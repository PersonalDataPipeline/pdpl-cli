import { config } from "dotenv";
config();

import { readdirSync } from "fs";

const apisSupported = readdirSync("./src/apis");

const apiName = process.argv[2];

if (!apiName) {
  console.log(`❌ No API name included`);
  process.exit();
}

if (!apisSupported.includes(apiName)) {
  console.log(`❌ Unsupported API "${apiName}"`);
  process.exit();
}

(async () => {
  const apiHandler = await import(`../imports/${apiName}/index.js`);
  let curlCommand = "curl";

  const authHeaders = await apiHandler.getApiAuthHeaders();
  for (const header in authHeaders) {
    curlCommand += ` -H "${header}: ${authHeaders[header]}"`;
  }

  console.log(`${curlCommand} ${apiHandler.getApiBaseUrl()}`);
})();
