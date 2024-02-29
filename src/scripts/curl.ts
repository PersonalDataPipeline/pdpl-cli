import { config } from "dotenv";
config();

import { readDirectory } from "../utils/fs.js";

const apisSupported = readDirectory("./src/apis");

const apiName = process.argv[2];

if (!apiName) {
  console.log(`❌ No API name included`);
  process.exit();
}

if (!apisSupported.includes(apiName)) {
  console.log(`❌ Unsupported API "${apiName}"`);
  process.exit();
}

const apiHandler = await import(`../apis/${apiName}/index.js`);
let curlCommand = "curl";

const authHeaders = await apiHandler.getApiAuthHeaders();
for (const header in authHeaders) {
  curlCommand += ` -H "${header}: ${authHeaders[header]}"`;
}

console.log(`${curlCommand} ${apiHandler.getApiBaseUrl()}`);
