import { config } from "dotenv";
config();

import axios, { AxiosError, AxiosResponse } from "axios";
import { readdirSync } from "fs";

import Stats, { StatsRunData } from "../utils/stats.js";
import { ensureOutputPath, writeOutputFile, makeOutputPath } from "../utils/fs.js";
import { fileNameDateTime } from "../utils/date.js";
import { DailyData } from "../utils/types.js";

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
  const axiosBaseConfig = {
    baseURL: apiHandler.getApiBaseUrl(),
    headers: await apiHandler.getApiAuthHeaders(),
  };

  for (const endpoint in apiHandler.endpoints) {
    if (runEndpoint && runEndpoint !== endpoint) {
      continue;
    }

    const thisEndpoint = apiHandler.endpoints[endpoint];
    const runDateTime = fileNameDateTime();

    const axiosConfig = {
      ...axiosBaseConfig,
      url: endpoint,
      method: thisEndpoint.method || "get",
      params:
        typeof thisEndpoint.getParams === "function" ? thisEndpoint.getParams() : {},
    };

    let apiResponse;
    try {
      apiResponse = await axios(axiosConfig);
    } catch (error: AxiosError | any) {
      runStats.addError(endpoint, {
        type: "http",
        message: error.message,
        data: error.data || {},
      });
      continue;
    }

    const savePath = [apiName, thisEndpoint.getDirName()];
    ensureOutputPath(savePath);

    const runMetadata: StatsRunData = {
      dateTime: runDateTime,
      filesWritten: 0,
      filesSkipped: 0,
    };

    const [apiResponseData] =
      typeof thisEndpoint.transformResponse === "function"
        ? thisEndpoint.transformResponse(apiResponse)
        : [apiResponse.data, apiResponse.headers];

    // Need to parse returned to days if not a snapshot
    const filesGenerated: DailyData = {};
    if (typeof thisEndpoint.parseDayFromEntity === "function") {
      const dailyData: DailyData = {};
      const entities = apiResponseData;

      if (!Array.isArray(entities)) {
        runStats.addError(endpoint, {
          type: "parsing_response",
          message: `Cannot iterate through data from ${endpoint}.`,
        });
        continue;
      }

      try {
        for (const entity of entities) {
          entity.day = thisEndpoint.parseDayFromEntity(entity);
          if (!dailyData[entity.day]) {
            dailyData[entity.day] = [entity];
          }
          dailyData[entity.day]!.push(entity);
        }
      } catch (error: AxiosError | any) {
        runStats.addError(endpoint, {
          type: "parsing_response",
          message: `Cannot parse data from ${endpoint} into days: ${error.message}`,
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

    runStats.addRun(endpoint, runMetadata);

    if (thisEndpoint.enrichEntity) {
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
          for (const enrichFunction of thisEndpoint.enrichEntity) {
            const enrichAxiosConfig = {
              ...axiosBaseConfig,
              url: enrichFunction.getEndpoint(entity),
              method: enrichFunction.method || "get",
              params:
                typeof enrichFunction.getParams === "function"
                  ? enrichFunction.getParams(entity)
                  : {},
            };

            enrichUrls.push(enrichAxiosConfig.url);

            let enrichApiResponse: AxiosResponse;
            try {
              enrichApiResponse = await axios(enrichAxiosConfig);
            } catch (error: AxiosError | any) {
              runStats.addError(enrichAxiosConfig.url, {
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

        runStats.addRun(`enrich ${endpoint}`, { ...enrichRunMetadata, enrichUrls });
      } // END files
    }
  }

  runStats.shutdown();
})();
