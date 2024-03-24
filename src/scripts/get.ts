import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import logger, { RunLogger } from "../utils/logger.js";
import {
  ensureOutputPath,
  writeOutputFile,
  makeOutputPath,
  readDirectory,
} from "../utils/fs.js";
import { runDateUtc } from "../utils/date.js";
import { ApiHandler, ApiPrimaryEndpoint, DailyData } from "../utils/types.js";
import { getApiData } from "../utils/api-data.js";
import Queue, { QueueEntry } from "../utils/queue.class.js";

////
/// Startup
//

export const run = async (cliArgs: string[], logger: RunLogger) => {
  const apisSupported = readDirectory("src/apis");
  const apiName = cliArgs[2];

  if (!apiName) {
    logger.error({ stage: "startup", error: "No API name in command" });
    logger.shutdown();
    return;
  }

  if (!apisSupported.includes(apiName)) {
    logger.error({ stage: "startup", error: `Unknown API name "${apiName}"` });
    logger.shutdown();
    return;
  }

  logger.setApiName(apiName);
  const runDate = runDateUtc();
  const apiHandler = (await import(`../apis/${apiName}/index.js`)) as ApiHandler;

  // TODO: Should this be the shape of the endpoint handler collection?
  const handlerDict: { [key: string]: ApiPrimaryEndpoint } = {};
  for (const endpointHandler of apiHandler.endpointsPrimary) {
    handlerDict[endpointHandler.getEndpoint()] = endpointHandler;
  }

  ////
  /// Queue management
  //

  const queueInstance = new Queue(apiHandler);
  const runQueue = queueInstance.processQueue(logger);
  if (!runQueue.length) {
    logger.info({
      stage: "queue_management",
      message: "Empty run queue ... stopping",
    });
    return;
  }

  ////
  /// Endpoints: Primary
  //

  const perEndpointData: { [key: string]: any[] } = {};

  for (const runEntry of runQueue) {
    const endpoint = runEntry.endpoint;
    const endpointHandler = Object.assign({}, handlerDict[endpoint]);

    if (typeof runEntry.params === "object") {
      endpointHandler.getParams = () => runEntry.params;
    }

    const runMetadata = {
      endpoint,
      filesWritten: 0,
      filesSkipped: 0,
      total: 0,
      days: 0,
    };

    let apiResponseData;
    let apiResponse;
    let nextCallParams = {};
    do {
      try {
        apiResponse = await getApiData(apiHandler, endpointHandler);
      } catch (error) {
        logger.error({
          stage: "http",
          endpoint,
          error,
        });
        nextCallParams = {};
        continue;
      }
      apiResponseData =
        typeof endpointHandler.transformResponseData === "function"
          ? endpointHandler.transformResponseData(apiResponse, apiResponseData)
          : apiResponse.data;

      nextCallParams =
        typeof endpointHandler.getNextCallParams === "function"
          ? endpointHandler.getNextCallParams(apiResponse)
          : {};

      endpointHandler.getParams = () => nextCallParams as object;
    } while (Object.keys(nextCallParams).length);

    // Store all the entity data for the endpoint for secondary endpoints
    perEndpointData[endpoint] = apiResponseData;

    const savePath = [apiName, endpointHandler.getDirName()];
    ensureOutputPath(savePath);

    if (typeof endpointHandler.parseDayFromEntity === "function") {
      // Need to parse returned to days if not a snapshot
      const dailyData: DailyData = {};
      const entities = apiResponseData;

      if (!Array.isArray(entities)) {
        logger.error({
          stage: "parsing_response",
          endpoint: endpoint,
          error: "Cannot iterate through data",
        });
        continue;
      }

      try {
        for (const entity of entities) {
          const day = endpointHandler.parseDayFromEntity(entity);
          if (!dailyData[day]) {
            dailyData[day] = [];
          }
          dailyData[day].push(entity);
        }
      } catch (error) {
        logger.error({
          stage: "parsing_response",
          endpoint: endpoint,
          error,
        });
        continue;
      }

      runMetadata.total = entities.length;
      runMetadata.days = Object.keys(dailyData).length;

      for (const day in dailyData) {
        const outputPath = makeOutputPath(savePath, day, runDate.fileName);
        writeOutputFile(outputPath, dailyData[day])
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;
      }
    } else {
      // Snapshot data, not time-bound
      runMetadata.total = 1;
      const outputPath = makeOutputPath(savePath, null, runDate.fileName);
      writeOutputFile(outputPath, apiResponseData)
        ? runMetadata.filesWritten++
        : runMetadata.filesSkipped++;
    }

    logger.success({
      ...runMetadata,
    });

    if (
      runEntry.historic &&
      typeof endpointHandler.getHistoricParams === "function" &&
      typeof apiHandler.getHistoricDelay === "function"
    ) {
      const newQueueEntry: QueueEntry = {
        endpoint: endpoint,
        historic: true,
        runAfter: runDate.seconds,
        params: {},
      };

      const didReturnData = !!Object.keys(apiResponseData).length;
      const continueHistoric =
        typeof endpointHandler.shouldHistoricContinue === "function"
          ? endpointHandler.shouldHistoricContinue(
              apiResponseData,
              endpointHandler.getParams!()
            )
          : didReturnData;

      if (continueHistoric) {
        // Potentially more historic entries to get
        newQueueEntry.params = endpointHandler.getHistoricParams(
          runEntry.params,
          didReturnData
        );
        newQueueEntry.runAfter =
          runDate.seconds +
          (typeof endpointHandler.getHistoricDelay === "function"
            ? endpointHandler.getHistoricDelay()
            : endpointHandler.getDelay());
      } else {
        // Schedule next historic run for this endpoint
        newQueueEntry.runAfter = runDate.seconds + apiHandler.getHistoricDelay();
        newQueueEntry.params = endpointHandler.getHistoricParams();
      }
      logger.info({
        endpoint,
        stage: "queue_management",
        message: `Adding historic queue entry`,
      });
      queueInstance.addEntry(newQueueEntry);
      continue;
    }

    queueInstance.updateStandardEntryFor(endpoint);
  } // END endpointsPrimary

  ////
  /// Endpoints: Secondary
  //
  for (const endpointHandler of apiHandler.endpointsSecondary) {
    const entities = perEndpointData[endpointHandler.getPrimary()] || [];
    const savePath = [apiName, endpointHandler.getDirName()];
    ensureOutputPath(savePath);

    for (const entity of entities) {
      const runMetadata = {
        endpoint: endpointHandler.getEndpoint(entity),
        filesWritten: 0,
        filesSkipped: 0,
        total: 0,
      };

      let apiResponse;
      try {
        apiResponse = await getApiData(apiHandler, endpointHandler, entity);
      } catch (error) {
        logger.error({
          stage: "http",
          endpoint: runMetadata.endpoint,
          error,
        });
        continue;
      }

      const apiResponseData =
        typeof endpointHandler.transformResponseData === "function"
          ? endpointHandler.transformResponseData(apiResponse)
          : apiResponse.data;

      runMetadata.total = 1;
      const outputPath = makeOutputPath(
        savePath,
        endpointHandler.getIdentifier(entity),
        runDate.fileName
      );
      writeOutputFile(outputPath, apiResponseData)
        ? runMetadata.filesWritten++
        : runMetadata.filesSkipped++;

      logger.success(runMetadata);
    }
  } // END endpointsSecondary
};

try {
  await run(process.argv, logger);
} catch (error) {
  logger.error({ stage: "other", error });
}
logger.shutdown();
