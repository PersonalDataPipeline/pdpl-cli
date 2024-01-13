require("dotenv").config();

const axios = require("axios");
const { readdirSync } = require("fs");

const Logger = require("./src/utils/logger");

const apisSupported = readdirSync("src/apis");

// 
// Configuration
// 

const config = {
  outputDir: "data"
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

const apiHandler = require(`./src/apis/${apiName}/index.js`);
const runLogger = new Logger();

(async () => {
  const axiosBaseConfig = {};
  axiosBaseConfig.baseURL = apiHandler.getApiBaseUrl();
  axiosBaseConfig.headers = await apiHandler.getApiAuthHeaders();

  for (const endpoint in apiHandler.endpoints) {
    const axiosConfig = JSON.parse(JSON.stringify(axiosBaseConfig));

    axiosConfig.url = endpoint;
    axiosConfig.method = apiHandler.endpoints[endpoint].method || "get";
    axiosConfig.params = apiHandler.endpoints[endpoint].getParams();

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

    runLogger.addRun(apiName, endpoint, runMetadata);
  };

  runLogger.shutdown();
})();
