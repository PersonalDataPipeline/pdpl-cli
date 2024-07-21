import { AxiosError, AxiosResponse } from "axios";

import { ApiBaseCommand, apiNameArg } from "./_base.js";
import logger from "../../utils/logger.js";
import * as queue from "../../utils/queue.js";
import { runDateUtc } from "../../utils/date-time.js";
import { ApiHandler, DailyData, EpHistoric, EpSnapshot } from "../../utils/types.js";
import { isObjectWithKeys } from "../../utils/object.js";
import { getApiData } from "../../utils/api-data.js";
import { makeOutputPath, writeOutputFile } from "../../utils/fs.js";
import { Flags } from "@oclif/core";

export default class ApiGet extends ApiBaseCommand<typeof ApiGet> {
  static override summary = "Get API data based on a queue";

  static override args = {
    ...apiNameArg,
  };

  static override flags = {
    force: Flags.boolean({
      summary: "Force API calls to run even if delay has not passed",
      default: false,
    }),
  };

  static override examples = ["<%= config.bin %> <%= command.id %> API_NAME"];

  protected override async finally(_: Error | undefined) {
    await super.finally(_);
    logger.shutdown((this.args && this.args.apiName) || "");
  }

  public override async run(): Promise<void> {
    const { apiName } = this.args;
    const { force: forceRun } = this.flags;

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

    const runQueue = queue.processQueue(apiHandler, logger, forceRun);
    if (!runQueue.length) {
      logger.info({
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
          shouldHistoricContinue: (responseDataRaw: [] | object) =>
            !!Object.keys(responseDataRaw).length,
          transformResponseData: (response: AxiosResponse): unknown => response.data,
          transformPrimary: (entity: unknown): unknown => entity,
          handleApiError: (): void => {},
        },
        handlerDict[endpoint]
      );

      if (runEntry.historic && !isObjectWithKeys(runEntry.params)) {
        runEntry.params = (epHandler as EpHistoric).getHistoricParams();
      }

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
          epHandler.handleApiError(error as AxiosError);
          logger.error({
            endpoint,
            error,
          });
          break;
        }
        apiResponseData = epHandler.transformResponseData(apiResponse, apiResponseData);
        nextCallParams = epHandler.getNextCallParams(apiResponse, epHandler.getParams());
        if (isObjectWithKeys(nextCallParams)) {
          epHandler.getParams = () => nextCallParams;
        }
      } while (isObjectWithKeys(nextCallParams));

      if (typeof apiResponseData === "undefined") {
        continue;
      }

      // Store all the entity data for the primary endpoint to process secondary endpoints
      perEndpointData[endpoint] = epHandler.transformPrimary(apiResponseData);

      if (typeof epHandler.parseDayFromEntity === "function") {
        ////
        /// Historic endpoints
        //

        const dailyData: DailyData = {};
        const entities = apiResponseData as [];

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
            endpoint: endpoint,
            error,
          });
          continue;
        }

        runMetadata.total = entities.length;
        runMetadata.days = Object.keys(dailyData).length;

        for (const day in dailyData) {
          const outputPath = makeOutputPath([apiName, epHandler.getDirName()], day);
          writeOutputFile(outputPath, dailyData[day])
            ? runMetadata.filesWritten++
            : runMetadata.filesSkipped++;
        }
      } else {
        ////
        /// Snapshot endpoints
        //

        runMetadata.total = 1;
        const outputPath = makeOutputPath([apiName, epHandler.getDirName()]);
        writeOutputFile(outputPath, apiResponseData)
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;
      }

      logger.success({
        ...runMetadata,
      });

      ////
      /// Historic queue management
      //
      if (runEntry.historic && epHandler.isHistoric()) {
        const continueHistoric = epHandler.shouldHistoricContinue(
          (apiResponse as AxiosResponse).data as object | [],
          runEntry.params
        );

        const runAfterDelay = (epHandler as EpHistoric).getHistoricDelay(
          continueHistoric
        );

        const params = continueHistoric
          ? (epHandler as EpHistoric).getHistoricParams(
              runEntry.params,
              (apiResponse as AxiosResponse).data as object | []
            )
          : {};

        queue.updateHistoricEntry({
          endpoint: epHandler.getEndpoint(),
          runAfter: runDate.seconds + runAfterDelay,
          params,
        });
      } else {
        queue.updateStandardEntry(epHandler);
      }
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
            endpoint: epHandler.getEndpoint(entity),
            error,
          });
          continue;
        }

        const apiResponseData = epHandler.transformResponseData(apiResponse);

        const outputPath = makeOutputPath(
          [apiName, epHandler.getDirName(apiResponseData as object)],
          epHandler.getIdentifier(entity, apiResponseData as object)
        );

        writeOutputFile(outputPath, apiResponseData)
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;

        logger.success(runMetadata);
      }
    } // END endpointsSecondary
  }
}
