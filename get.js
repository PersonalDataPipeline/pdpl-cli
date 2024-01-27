require("dotenv").config();

const axios = require("axios");
const { readdirSync } = require("fs");
const path = require("path");

const Stats = require("./src/utils/stats");
const { ensureOutputPath, writeOutputFile, makeOutputPath } = require("./src/utils/fs");
const { fileNameDateTime } = require("./src/utils/date");
const getConfig = require("./src/utils/config");

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

const apiHandler = require(`./src/apis/${apiName}/index.js`);
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
      params: typeof thisEndpoint.getParams === "function" ? thisEndpoint.getParams() : {},
    };

    let apiResponse;
    try {
      apiResponse = await axios(axiosConfig);
    } catch (error) {
      runStats.addError(endpoint, {
        type: "http",
        message: error.message,
        data: error.data || {},
      });
      continue;
    }

    const apiPath = thisEndpoint.getDirName();
    ensureOutputPath(apiPath);

    let runMetadata = {
      dateTime: runDateTime,
      filesWritten: 0,
      filesSkipped: 0,
    };

    const [apiResponseData, apiResponseHeaders] =
      typeof thisEndpoint.transformResponse === "function"
        ? thisEndpoint.transformResponse(apiResponse)
        : [apiResponse.data, apiResponse.headers];

    // Need to parse returned to days if not a snapshot
    const filesGenerated = {};
    if (typeof thisEndpoint.parseDayFromEntity === "function") {
      const apiResponseParsed = {};
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
          if (!apiResponseParsed[entity.day]) {
            apiResponseParsed[entity.day] = [];
          }
          apiResponseParsed[entity.day].push(entity);
        }
      } catch (error) {
        runStats.addError(endpoint, {
          type: "parsing_response",
          message: `Cannot parse data from ${endpoint} into days: ${error.message}`,
        });
        continue;
      }

      runMetadata.total = entities.length;
      runMetadata.days = Object.keys(apiResponseParsed).length;
      for (const day in apiResponseParsed) {
        const outputPath = makeOutputPath(apiPath, day, runDateTime);
        writeOutputFile(outputPath, apiResponseParsed[day])
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;
        
        filesGenerated[outputPath] = apiResponseParsed[day];
      }
    } else {
      runMetadata.total = 1;
      const outputPath = makeOutputPath(apiPath, null, runDateTime);
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

        const enrichRunMetadata = {
          dateTime: runDateTime,
          filesWritten: 0,
          filesSkipped: 0,
          enrichUrls: []
        };

        for (const entity of dayEntityData) {
          let enrichedEntity = {};
          for (const enrichFunction of thisEndpoint.enrichEntity) {

            const enrichAxiosConfig = {
              ...axiosBaseConfig,
              url: enrichFunction.getEndpoint(entity),
              method: enrichFunction.method || "get",
              params: typeof enrichFunction.getParams === "function" ? enrichFunction.getParams(entity) : {},
            };

            enrichRunMetadata.enrichUrls.push(enrichAxiosConfig.url);

            try {
              enrichApiResponse = await axios(enrichAxiosConfig);
            } catch (error) {
              runStats.addError(enrichAxiosConfig.url, {
                type: "http",
                message: error.message,
                data: error.data || {},
              });
              continue;
            }

            enrichedEntity = enrichFunction.enrichEntity(entity, enrichApiResponse);

          } // END enrich functions
          newEntityData.push(enrichedEntity);
        } // END days

        writeOutputFile(dayEntityFile, newEntityData)
          ? enrichRunMetadata.filesWritten++
          : enrichRunMetadata.filesSkipped++;

        runStats.addRun(`enrich ${endpoint}`, enrichRunMetadata);
      } // END files
    }
  }

  runStats.shutdown();
})();
