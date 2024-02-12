import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { AxiosError, AxiosResponse } from "axios";
import { readdirSync } from "fs";

import Stats, { StatsRunData } from "../utils/stats.js";
import { ensureOutputPath, writeOutputFile, makeOutputPath } from "../utils/fs.js";
import { fileNameDateTime } from "../utils/date.js";
import { DailyData } from "../utils/types.js";
import { getApiData, MockAxiosResponse } from "../utils/data.js";

////
/// Helpers
//

const apisSupported = readdirSync("src/apis");

const apiName = process.argv[2];
const runEndpoint = process.argv[3];

if (!apiName) {
  console.log(`❌ No API name included`);
  process.exit();
}

if (!apisSupported.includes(apiName)) {
  console.log(`❌ Unsupported API "${apiName}"`);
  process.exit();
}

const apiHandler = await import(`../apis/${apiName}/index.js`);
const allEndpoints = Object.keys(apiHandler.endpoints);

if (runEndpoint && !allEndpoints.includes(runEndpoint)) {
  console.log(`❌ Unsupported endpoint "${runEndpoint}" for API "${apiName}"`);
  process.exit();
}

const runStats = new Stats(apiName);

(async () => {

  for (const endpointHandler of apiHandler.endpoints) {
    if (runEndpoint && runEndpoint !== endpointHandler.getEndpoint()) {
      continue;
    }

    const runDateTime = fileNameDateTime();

    let apiResponse: AxiosResponse | MockAxiosResponse;
    try {
      apiResponse = await getApiData(apiHandler, endpointHandler);
    } catch (error: AxiosError | any) {
      runStats.addError(endpointHandler.getEndpoint(), {
        type: "http",
        message: error.message,
        data: error.data || {},
      });
      continue;
    }

    const savePath = [apiName, endpointHandler.getDirName()];
    ensureOutputPath(savePath);

    const runMetadata: StatsRunData = {
      dateTime: runDateTime,
      filesWritten: 0,
      filesSkipped: 0,
    };

    const [apiResponseData] =
      typeof endpointHandler.transformResponse === "function"
        ? endpointHandler.transformResponse(apiResponse)
        : [apiResponse.data, apiResponse.headers];

    // Need to parse returned to days if not a snapshot
    const filesGenerated: DailyData = {};
    if (typeof endpointHandler.parseDayFromEntity === "function") {
      const dailyData: DailyData = {};
      const entities = apiResponseData;

      if (!Array.isArray(entities)) {
        runStats.addError(endpointHandler.getEndpoint(), {
          type: "parsing_response",
          message: `Cannot iterate through data from ${endpointHandler.getEndpoint()}.`,
        });
        continue;
      }

      try {
        for (const entity of entities) {
          entity.day = endpointHandler.parseDayFromEntity(entity);
          if (!dailyData[entity.day]) {
            dailyData[entity.day] = [entity];
          }
          dailyData[entity.day]!.push(entity);
        }
      } catch (error: AxiosError | any) {
        runStats.addError(endpointHandler.getEndpoint(), {
          type: "parsing_response",
          message: `Cannot parse data from ${endpointHandler.getEndpoint()} into days: ${error.message}`,
        });
        continue;
      }

      runMetadata.total = entities.length;
      runMetadata.days = Object.keys(dailyData).length;

      for (const day in dailyData) {
        const outputPath = makeOutputPath(savePath, day, runDateTime);
        writeOutputFile(outputPath, dailyData[day])
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;

        filesGenerated[outputPath] = dailyData[day]!;
      }
    } else {
      runMetadata.total = 1;
      const outputPath = makeOutputPath(savePath, null, runDateTime);
      writeOutputFile(outputPath, apiResponseData)
        ? runMetadata.filesWritten++
        : runMetadata.filesSkipped++;

      filesGenerated[outputPath] = apiResponseData;
    }

    runStats.addRun(endpointHandler.getEndpoint(), runMetadata);

    if (endpointHandler.enrichEntity) {
      for (const dayEntityFile in filesGenerated) {
        // dayEntityFile is file name, value is an array of entity objects
        const dayEntityData = filesGenerated[dayEntityFile];
        const newEntityData = [];

        const enrichRunMetadata: StatsRunData = {
          dateTime: runDateTime,
          filesWritten: 0,
          filesSkipped: 0,
        };

        const enrichUrls = [];
        for (const entity of dayEntityData!) {
          let enrichedEntity = {};
          for (const enrichFunction of endpointHandler.enrichEntity) {
            const enrichEndpoint = enrichFunction.getEndpoint(entity);

            enrichUrls.push(enrichEndpoint);

            let enrichApiResponse: AxiosResponse | MockAxiosResponse;
            try {
              enrichApiResponse = await getApiData(apiHandler, enrichFunction, entity);
            } catch (error: AxiosError | any) {
              runStats.addError(enrichEndpoint, {
                type: "http",
                message: error.message,
                data: error.data || {},
              });
              continue;
            }

            enrichedEntity = enrichFunction.enrichEntity(enrichApiResponse, entity);
          } // END enrich functions
          newEntityData.push(enrichedEntity);
        } // END days

        writeOutputFile(dayEntityFile, newEntityData)
          ? enrichRunMetadata.filesWritten++
          : enrichRunMetadata.filesSkipped++;

        runStats.addRun(`enrich ${endpointHandler.getEndpoint()}`, { ...enrichRunMetadata, enrichUrls });
      } // END files
    }
  }

  runStats.shutdown();
})();
