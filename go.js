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

const apiHandler = require(`./src/apis/${apiName}`);

const axiosConfig = {
  baseURL: apiHandler.baseUrl,
  headers: {}
}

switch (apiHandler.authStrategy) {
  case "authHeader":
    const envName = `${apiName.toUpperCase()}_AUTH_TOKEN`;
    const authHeaderValue = (apiHandler.authHeaderValue || "") + process.env[envName];
    axiosConfig.headers[apiHandler.authHeaderName] = authHeaderValue;
    break;
}

console.log(axiosConfig);
console.log(`🎉🎉🎉`);