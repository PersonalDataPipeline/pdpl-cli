import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import RunLog from "../utils/stats.class.js";
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
/// Types
//

interface RunEntry extends Omit<QueueEntry, "runAfter" | "historic"> {
  historic: boolean;
}

////
/// Startup
//

const apisSupported = readDirectory("src/apis");
const apiName = process.argv[2];
const logger = new RunLog(apiName);

if (!apiName) {
  logger.error({ stage: "startup", error: "No API name in command" }).shutdown();
  process.exit();
}

if (!apisSupported.includes(apiName)) {
  logger.error({ stage: "startup", error: `Unknown API name "${apiName}"` }).shutdown();
  process.exit();
}

const runDate = runDateUtc();

const apiHandler = (await import(`../apis/${apiName}/index.js`)) as ApiHandler;

// TODO: Should this be the shape of the endpoint handler collection?
const handlerDict: { [key: string]: ApiPrimaryEndpoint } = {};
const handledEndpoints: string[] = [];
for (const endpointHandler of apiHandler.endpointsPrimary) {
  handledEndpoints.push(endpointHandler.getEndpoint());
  handlerDict[endpointHandler.getEndpoint()] = endpointHandler;
}

////
/// Queue management
//

// TODO: Consider whether this logic should go in the queue class
const queueInstance = new Queue(apiName);
const runQueue: RunEntry[] = queueInstance
  .getQueue()
  .filter((entry) => {
    const endpointName = entry.endpoint;
    // If an endpoint was removed from the handler, remove from the queue
    if (!handledEndpoints.includes(endpointName)) {
      logger.info({
        stage: "queue_management",
        message: "Removing unknown endpoint found in queue",
        endpoint: endpointName,
      });
      return false;
    }

    // If we're too early for an entry to run, add back as-is
    if (entry.runAfter > runDate.seconds) {
      const waitMinutes = Math.ceil((entry.runAfter - runDate.seconds) / 60);
      logger.info({
        stage: "queue_management",
        message: `Skipping endpoint for ${waitMinutes} minutes`,
        endpoint: endpointName,
      });
      queueInstance.addEntry(entry);
      return false;
    }

    // Add the next standard entry to the queue
    if (!Queue.entryHasParams(entry) && !entry.historic) {
      queueInstance.addEntry({
        endpoint: entry.endpoint,
        runAfter: handlerDict[endpointName].getDelay() + runDate.seconds,
      });
    }

    return true;
  })
  .map((entry) => {
    const entryHasParams = Queue.entryHasParams(entry);
    const newEntry: RunEntry = {
      endpoint: entry.endpoint,
      historic: !entryHasParams ? false : !!entry.historic,
    };
    if (entryHasParams) {
      newEntry.params = entry.params;
    }
    return newEntry;
  });

// TODO: Consider whether this logic should go in the queue class
for (const handledEndpoint of handledEndpoints) {
  if (!queueInstance.hasStandardEntryFor(handledEndpoint)) {
    logger.info({
      stage: "queue_management",
      message: `Adding standard entry to queue for unhandled endpoint`,
      endpoint: handledEndpoint,
    });
    queueInstance.addEntry({
      endpoint: handledEndpoint,
      runAfter: handlerDict[handledEndpoint].getDelay() + runDate.seconds,
    });
    runQueue.push({ endpoint: handledEndpoint, historic: false });
  }
}

if (!runQueue.length) {
  logger.info({
    stage: "queue_management",
    message: "Empty run queue ... stopping",
  });
  logger.shutdown();
  process.exit();
}

////
/// Endpoints: Primary
//

const perEndpointData: { [key: string]: any[] } = {};

for (const runEntry of runQueue) {
  const endpoint = runEntry.endpoint;
  const endpointHandler = Object.assign({}, handlerDict[endpoint]);

  if (typeof runEntry.params === "object") {
    endpointHandler.getParams = () => runEntry.params as object;
  }

  const runMetadata = {
    endpoint,
    filesWritten: 0,
    filesSkipped: 0,
    total: 0,
    days: 0,
  };

  // BEFORE HTTP LOOP

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

  // AFTER HTTP LOOP

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
  }
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

logger.shutdown();
