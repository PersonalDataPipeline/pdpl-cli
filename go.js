require("dotenv").config();
const axios = require("axios");
const { readdirSync } = require("fs");

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

(async () => {
  const axiosConfig = {};
  axiosConfig.baseURL = apiHandler.getApiBaseUrl();
  axiosConfig.headers = await apiHandler.getApiAuthHeaders();

  for (const endpoint in apiHandler.endpoints) {
    const axiosConfigPerCall = JSON.parse(JSON.stringify(axiosConfig));
    axiosConfigPerCall.method = apiHandler.endpoints[endpoint].method || "get";
    axiosConfigPerCall.url = endpoint;
    axiosConfigPerCall.params = apiHandler.endpoints[endpoint].getParams();
    console.log(axiosConfigPerCall);
    try {
      apiHandler.endpoints[endpoint].successHandler(await axios(axiosConfigPerCall));
    } catch (error) {
      apiHandler.endpoints[endpoint].errorHandler(error);
    }
  };
  
  console.log(`🎉🎉🎉`);
})();
