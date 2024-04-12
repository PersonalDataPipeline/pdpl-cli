import { AxiosResponse } from "axios";

import { ApiBaseCommand, apiNameArg } from "./_base.js";
import logger from "../../utils/logger.js";
import * as queue from "../../utils/queue.js";
import { runDateUtc } from "../../utils/date-time.js";
import { ApiHandler, DailyData, EpHistoric, EpSnapshot } from "../../utils/types.js";
import { isObjectWithKeys } from "../../utils/object.js";
import { getApiData } from "../../utils/api-data.js";
import { makeOutputPath, writeOutputFile } from "../../utils/fs.js";

export default class ApiGet extends ApiBaseCommand<typeof ApiGet> {
  static override summary = "Get API data based on a queue";

  static override args = {
    ...apiNameArg,
  };

  static override examples = ["<%= config.bin %> <%= command.id %> API_NAME"];

  public override async run(): Promise<void> {
    const { apiName } = this.args;

    logger.setApiName(apiName);
    const runDate = runDateUtc();
    const { default: apiHandler } = (await import(`../../apis/${apiName}/index.js`)) as {
      default: ApiHandler;
    };

    const handlerDict: { [key: string]: EpHistoric | EpSnapshot } = {};
    for (const endpointHandler of apiHandler.endpointsPrimary) {
      handlerDict[endpointHandler.getEndpoint()] = endpointHandler;
    }

    ////
    /// Queue management
    //

    const runQueue = queue.processQueue(apiHandler, logger);
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

    const perEndpointData: { [key: string]: unknown } = {};

    for (const runEntry of runQueue) {
      const endpoint = runEntry.endpoint;
      const epHandler = Object.assign(
        {
          getParams: () => ({}),
          getMethod: () => "get",
          getNextCallParams: () => ({}),
          getHistoricDelay: handlerDict[endpoint].getDelay,
          shouldHistoricContinue: (apiData: [] | object) => !!Object.keys(apiData).length,
          transformResponseData: (response: AxiosResponse): unknown => response.data,
          transformPrimary: (entity: unknown): unknown => entity,
        },
        handlerDict[endpoint]
      );

      if (isObjectWithKeys(runEntry.params)) {
        epHandler.getParams = () => runEntry.params;
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
          apiResponse = await getApiData(apiHandler, epHandler);
        } catch (error) {
          logger.error({
            stage: "http",
            endpoint,
            error,
          });
          nextCallParams = {};
          continue;
        }
        apiResponseData = epHandler.transformResponseData(apiResponse, apiResponseData);
        nextCallParams = epHandler.getNextCallParams(apiResponse, epHandler.getParams());
        if (isObjectWithKeys(nextCallParams)) {
          epHandler.getParams = () => nextCallParams;
        }
      } while (Object.keys(nextCallParams).length);

      // Store all the entity data for the endpoint for secondary endpoints
      perEndpointData[endpoint] = epHandler.transformPrimary(apiResponseData);

      const savePath = [apiName, epHandler.getDirName()];

      if (typeof epHandler.parseDayFromEntity === "function") {
        // Need to parse returned to days if not a snapshot
        const dailyData: DailyData = {};
        const entities = apiResponseData as [];

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
            const day = epHandler.parseDayFromEntity(entity);
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
          const outputPath = makeOutputPath(savePath, day);
          writeOutputFile(outputPath, dailyData[day])
            ? runMetadata.filesWritten++
            : runMetadata.filesSkipped++;
        }
      } else {
        // Snapshot data, not time-bound
        runMetadata.total = 1;
        const outputPath = makeOutputPath(savePath);
        writeOutputFile(outputPath, apiResponseData)
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;
      }

      logger.success({
        ...runMetadata,
      });

      if (runEntry.historic && epHandler.isHistoric()) {
        const newQueueEntry: queue.QueueEntry = {
          endpoint: endpoint,
          historic: true,
          runAfter: runDate.seconds,
          params: {},
        };

        const didReturnData = !!Object.keys(apiResponseData as []).length;
        const continueHistoric = epHandler.shouldHistoricContinue(
          apiResponseData as [],
          runEntry.params
        );

        if (continueHistoric) {
          // Potentially more historic entries to get
          newQueueEntry.params = (epHandler as EpHistoric).getHistoricParams(
            runEntry.params,
            didReturnData
          );
          newQueueEntry.runAfter =
            runDate.seconds + (epHandler as EpHistoric).getHistoricDelay();
        } else {
          // Schedule next historic run for this endpoint
          newQueueEntry.runAfter = runDate.seconds + apiHandler.getHistoricDelay();
          newQueueEntry.params = (epHandler as EpHistoric).getHistoricParams();
        }
        queue.updateHistoricEntry(newQueueEntry);
        continue;
      }

      queue.updateStandardEntry(epHandler);
    } // END endpointsPrimary

    ////
    /// Endpoints: Secondary
    //
    for (const originalEpHandler of apiHandler.endpointsSecondary) {
      const epHandler = Object.assign(
        {
          transformResponseData: (response: AxiosResponse): unknown => response.data,
        },
        originalEpHandler
      );
      const entities = (perEndpointData[epHandler.getPrimary()] as []) || [];

      for (const entity of entities) {
        const runMetadata = {
          endpoint: epHandler.getEndpoint(entity),
          filesWritten: 0,
          filesSkipped: 0,
          total: 1,
        };

        let apiResponse;
        try {
          apiResponse = await getApiData(apiHandler, epHandler, entity);
        } catch (error) {
          logger.error({
            stage: "http",
            endpoint: epHandler.getEndpoint(entity),
            error,
          });
          continue;
        }

        const apiResponseData = epHandler.transformResponseData(apiResponse);

        const outputPath = makeOutputPath(
          [apiName, epHandler.getDirName(apiResponseData as object)],
          epHandler.getIdentifier(apiResponseData as object)
        );

        writeOutputFile(outputPath, apiResponseData)
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;

        logger.success(runMetadata);
      }
    } // END endpointsSecondary
  }
}
