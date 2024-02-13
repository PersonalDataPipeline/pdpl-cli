import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { AxiosError, AxiosResponse } from "axios";
import { readdirSync } from "fs";

import Stats, { StatsRunData } from "../utils/stats.js";
import { ensureOutputPath, writeOutputFile, makeOutputPath } from "../utils/fs.js";
import { fileNameDateTime } from "../utils/date.js";
import { ApiHandler, DailyData } from "../utils/types.js";
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

const apiHandler = (await import(`../apis/${apiName}/index.js`)) as ApiHandler;
const runStats = new Stats(apiName);

(async () => {
  const perEndpointData: { [key: string]: [] } = {};

  ////
  /// Endpoints: Primary
  //
  for (const endpointHandler of apiHandler.endpointsPrimary) {
    const endpointName = endpointHandler.getEndpoint();
    if (runEndpoint && runEndpoint !== endpointName) {
      continue;
    }

    const runDateTime = fileNameDateTime();
    const runMetadata: StatsRunData = {
      dateTime: runDateTime,
      filesWritten: 0,
      filesSkipped: 0,
    };

    let apiResponse: AxiosResponse | MockAxiosResponse;
    try {
      apiResponse = await getApiData(apiHandler, endpointHandler);
    } catch (error: AxiosError | any) {
      runStats.addError(endpointName, {
        type: "http",
        message: error.message,
        data: error.data || {},
      });
      continue;
    }

    const savePath = [apiName, endpointHandler.getDirName()];
    ensureOutputPath(savePath);

    const apiResponseData =
      typeof endpointHandler.transformResponseData === "function"
        ? endpointHandler.transformResponseData(apiResponse)
        : apiResponse.data;

    // Store all the entity data for the endpoint for secondary endpoints
    perEndpointData[endpointName] = apiResponseData;

    if (typeof endpointHandler.parseDayFromEntity === "function") {
      // Need to parse returned to days if not a snapshot
      const dailyData: DailyData = {};
      const entities = apiResponseData;

      if (!Array.isArray(entities)) {
        runStats.addError(endpointName, {
          type: "parsing_response",
          message: `Cannot iterate through data from ${endpointName}.`,
        });
        continue;
      }

      try {
        for (const entity of entities) {
          entity.day = endpointHandler.parseDayFromEntity(entity);
          if (!dailyData[entity.day]) {
            dailyData[entity.day] = [];
          }
          dailyData[entity.day]!.push(entity);
        }
      } catch (error: AxiosError | any) {
        runStats.addError(endpointName, {
          type: "parsing_response",
          message: `Cannot parse data from ${endpointName} into days: ${error.message}`,
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
      }
    } else {
      // Snapshot data, not time-bound
      runMetadata.total = 1;
      const outputPath = makeOutputPath(savePath, null, runDateTime);
      writeOutputFile(outputPath, apiResponseData)
        ? runMetadata.filesWritten++
        : runMetadata.filesSkipped++;
    }

    runStats.addRun(endpointName, runMetadata);
  } // END endpointsPrimary

  ////
  /// Endpoints: Secondary
  //
  for (const endpointHandler of apiHandler.endpointsSecondary) {
    const entities = perEndpointData[endpointHandler.getPrimary()] || [];
    const savePath = [apiName, endpointHandler.getDirName()];
    ensureOutputPath(savePath);

    for (const entity of entities) {
      const runDateTime = fileNameDateTime();
      const runMetadata: StatsRunData = {
        dateTime: runDateTime,
        filesWritten: 0,
        filesSkipped: 0,
      };

      let apiResponse;
      try {
        apiResponse = await getApiData(apiHandler, endpointHandler, entity);
      } catch (error: AxiosError | any) {
        runStats.addError(endpointHandler.getEndpoint(entity), {
          type: "http",
          message: error.message,
          data: error.data || {},
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
        runDateTime
      );
      writeOutputFile(outputPath, apiResponseData)
        ? runMetadata.filesWritten++
        : runMetadata.filesSkipped++;

      runStats.addRun(endpointHandler.getEndpoint(entity), runMetadata);
    }
  } // END endpointsSecondary

  runStats.shutdown();
})();
