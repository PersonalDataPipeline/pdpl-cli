import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { AxiosError, AxiosResponse } from "axios";

import Stats, { StatsRunData } from "../utils/stats.class.js";
import {
  ensureOutputPath,
  writeOutputFile,
  makeOutputPath,
  readDirectory,
} from "../utils/fs.js";
import { fileNameDateTime } from "../utils/date.js";
import { ApiHandler, DailyData, EndpointRecord } from "../utils/types.js";
import { getApiData, MockAxiosResponse } from "../utils/data.js";
import Queue, { HistoricalRunEntry, StandardRunEntry } from "../utils/queue.class.js";
import { ONE_DAY_IN_MS } from "../utils/constants.js";

////
/// Helpers
//

const apisSupported = readDirectory("src/apis");

const apiName = process.argv[2];

if (!apiName) {
  console.log(`❌ No API name included`);
  process.exit();
}

if (!apisSupported.includes(apiName)) {
  console.log(`❌ Unsupported API "${apiName}"`);
  process.exit();
}

const runStats = new Stats(apiName);

////
/// Queue management
//

const runQueue = new Queue(apiName);
const queueEntry = runQueue.getEntry();

let runEndpoints: EndpointRecord[] = [];
let isHistoricalRun = false;
if (!queueEntry) {
  console.log("🤖 Doing first historical run");
  isHistoricalRun = true;
} else if (queueEntry && queueEntry.type === "standard") {
  console.log("🤖 Doing standard run");
  const { nextRun } = queueEntry as StandardRunEntry;
  if ((new Date()).getTime() < new Date(nextRun).getTime()) {
    runQueue.addStandardEntry(nextRun);
    console.log(`⏩ Waiting until ${nextRun} ...`);
    process.exit();
  }
} else if (queueEntry.type === "historical") {
  console.log("🤖 Doing subsequent historical run");
  isHistoricalRun = true;
  runEndpoints = (queueEntry as HistoricalRunEntry).endpoints;
  console.log(runEndpoints);
  
} else {
  console.log("❌ Unknown queue entry state!");
  process.exit();
}

////
/// Endpoints: Primary
//

const apiHandler = (await import(`../apis/${apiName}/index.js`)) as ApiHandler;
const perEndpointData: { [key: string]: [] } = {};
const nextHistoricalEndpoints: EndpointRecord[] = [];

for (const endpointHandler of apiHandler.endpointsPrimary) {
  const endpointName = endpointHandler.getEndpoint();
  const foundEndpoint = runEndpoints.filter((ep) => ep.endpoint === endpointName)[0];
  if (runEndpoints.length && !foundEndpoint) {
    continue;
  }

  // If we're calling a specific endpoint, we may have specific params to use
  let specificParams: object | null = null;
  if (isHistoricalRun) {
    specificParams = foundEndpoint && foundEndpoint.params
      ? foundEndpoint.params
      : typeof endpointHandler.getHistoricParams === "function"
        ? endpointHandler.getHistoricParams()
        : null;
  }

  if (typeof specificParams === "object") {
    endpointHandler.getParams = () => specificParams as object;
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
  } catch (error) {
    runStats.addError(endpointName, {
      type: "http",
      message: error instanceof Error ? error.message : "Unknown error for getApiData",
      data: (error as AxiosError)["response"]!["data"] || {},
    });
    continue;
  }

  const savePath = [apiName, endpointHandler.getDirName()];
  ensureOutputPath(savePath);

  const apiResponseData =
    typeof endpointHandler.transformResponseData === "function"
      ? endpointHandler.transformResponseData(apiResponse)
      : apiResponse.data;

  if (isHistoricalRun && typeof endpointHandler.getNextParams === "function") {
    const nextParams = endpointHandler.getNextParams(apiResponse.data, specificParams);
    if (typeof nextParams === "object") {
      nextHistoricalEndpoints.push({
        endpoint: endpointName,
        params: nextParams,
      });
    }
  }

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
        dailyData[entity.day].push(entity);
      }
    } catch (error) {
      runStats.addError(endpointName, {
        type: "http",
        message: `Cannot parse data from ${endpointName} into days: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data: (error as Record<string, unknown>)["data"] || {},
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

if (nextHistoricalEndpoints.length) {
  runQueue.addHistoricalEntry(nextHistoricalEndpoints);
} else {
  runQueue.addStandardEntry((new Date()).getTime() + ONE_DAY_IN_MS);
}

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
    } catch (error: any) {
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
