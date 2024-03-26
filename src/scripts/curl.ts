import path from "path";

import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: path.join(__dirname, "..", "..", ".env") });

import { readDirectory, __dirname } from "../utils/fs.js";
import { ApiHandler } from "../utils/types.js";

const apisSupported = readDirectory(path.join(__dirname, "..", "apis"));
const apiName = process.argv[2];

if (!apiName) {
  console.log(`❌ No API name included`);
  process.exit();
}

if (!apisSupported.includes(apiName)) {
  console.log(`❌ Unsupported API "${apiName}"`);
  process.exit();
}

const apiHandler = (await import(`../apis/${apiName}/index.js`)) as ApiHandler;
let curlCommand = "curl";

const authHeaders: { [key: string]: string } = await apiHandler.getApiAuthHeaders();
for (const header in authHeaders) {
  curlCommand += ` -H "${header}: ${authHeaders[header]}"`;
}

for (const epHandler of apiHandler.endpointsPrimary) {
  console.log(`${curlCommand} ${apiHandler.getApiBaseUrl() + epHandler.getEndpoint()}`);
}
