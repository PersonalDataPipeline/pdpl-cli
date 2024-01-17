require("dotenv").config();

const axios = require("axios");
const { readdirSync, readFileSync } = require("fs");
const path = require("path");

const Logger = require("./src/utils/logger");
const {
  ensureOutputPath,
  writeOutputFile,
  getLatestDayFileContents,
} = require("./src/utils/fs");
const { fileNameDateTime } = require("./src/utils/date");

const apisSupported = readdirSync("src/apis");

//
// Runtime
//

const apiName = process.argv[2];

if (!apiName) {
  console.log(`❌ No API name included`);
  process.exit();
}

if (!apisSupported.includes(apiName)) {
  console.log(`❌ Unsupported API "${apiName}"`);
  process.exit();
}

const runEndpoint = process.argv[3];
const apiHandler = require(`./src/apis/${apiName}/index.js`);
const runLogger = new Logger();

(async () => {
  const axiosBaseConfig = {
    baseURL: apiHandler.getApiBaseUrl(),
    headers: await apiHandler.getApiAuthHeaders(),
  };

  for (const endpoint in apiHandler.endpoints) {
    if (runEndpoint && runEndpoint !== endpoint) {
      continue;
    }

    const runDateTime = fileNameDateTime();
    const axiosConfig = {
      ...axiosBaseConfig,
      url: endpoint,
      method: apiHandler.endpoints[endpoint].method || "get",
      params: apiHandler.endpoints[endpoint].getParams(),
    };

    let apiResponse;
    try {
      apiResponse = await axios(axiosConfig);
    } catch (error) {
      runLogger.addError(apiName, endpoint, {
        type: "http",
        message: error.message,
        data: error.data || {},
      });
      continue;
    }

    let handlerOutput;
    let runMetadata;
    try {
      [handlerOutput, runMetadata] =
        apiHandler.endpoints[endpoint].successHandler(apiResponse);
    } catch (error) {
      runLogger.addError(apiName, endpoint, {
        type: "handler",
        message: error.message,
      });
      continue;
    }

    const apiPath = apiHandler.endpoints[endpoint].getDirName();
    ensureOutputPath(apiPath);

    runMetadata.filesWritten = 0;
    runMetadata.filesSkipped = 0;
    for (const day in handlerOutput) {
      const fileName = day + "--run-" + runDateTime + ".json";
      const written = writeOutputFile(path.join(apiPath, fileName), handlerOutput[day], {
        checkDuplicate: true,
      });
      runMetadata.filesWritten += written ? 1 : 0;
      runMetadata.filesSkipped += written ? 0 : 1;
    }

    runMetadata.dateTime = runDateTime;
    runLogger.addRun(apiName, endpoint, runMetadata);
  }

  runLogger.shutdown();
})();
