require("dotenv").config();

const axios = require("axios");
const { readdirSync, writeFileSync } = require("fs");
const path = require("path");

const Logger = require("./src/utils/logger");
const { ensurePath } = require("./src/utils/fs");
const { fileSafeDateTime } = require("./src/utils/date");

const apisSupported = readdirSync("src/apis");

// 
// Configuration
// 

const config = {
  outputDir: "/Users/joshcanhelp/Scripts/cortex/_data"
}

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
const runLogger = new Logger(config);

(async () => {
  const axiosBaseConfig = {
    baseURL: apiHandler.getApiBaseUrl(),
    headers: await apiHandler.getApiAuthHeaders()
  };

  for (const endpoint in apiHandler.endpoints) {
    if (runEndpoint && runEndpoint !== endpoint) {
      continue;
    }
    
    const runDateTime = fileSafeDateTime();
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
        data: error.data || {}
      });
      continue;
    }

    let handlerOutput;
    let runMetadata;
    try {
      [ handlerOutput, runMetadata ] = apiHandler.endpoints[endpoint].successHandler(apiResponse);
    } catch (error) {
      runLogger.addError(apiName, endpoint, {
        type: "handler",
        message: error.message
      });
      continue;
    }

    const createPathParts = [apiName, apiHandler.endpoints[endpoint].getDirName()];
    ensurePath(config.outputDir, createPathParts);
    for (const day in handlerOutput) {
      const fileName = day + "--run-" + runDateTime + ".json";
      const createPath = [config.outputDir, ...createPathParts, fileName].join(path.sep);
      writeFileSync(createPath, JSON.stringify(handlerOutput[day], null, 2));
    }

    runMetadata.dateTime = runDateTime;
    runLogger.addRun(apiName, endpoint, runMetadata);
  };

  runLogger.shutdown();
})();
