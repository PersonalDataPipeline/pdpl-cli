require("dotenv").config();

const { readdirSync } = require("fs");

const apisSupported = readdirSync("./src/apis");

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
  let curlCommand = "curl";

  const authHeaders = await apiHandler.getApiAuthHeaders();
  for (const header in authHeaders) {
    curlCommand += ` -H "${header}: ${authHeaders[header]}"`;
  }

  console.log(`${curlCommand} ${apiHandler.getApiBaseUrl()}`);
})();
