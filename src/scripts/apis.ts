import path from "path";

import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: path.join(__dirname, "..", "..", ".env") });

import { readDirectory } from "../utils/fs.js";
import { ApiHandler, ApiHistoricEndpoint } from "../utils/types.js";
import getConfig from "../utils/config.js";

const apisSupported = readDirectory("./src/apis");

for (const apiName of apisSupported) {
  if (process.argv[2] && process.argv[2] !== apiName) {
    continue;
  }

  const apiHandler = (await import(`../apis/${apiName}/index.js`)) as ApiHandler;

  console.log(`👉 API handler for ${apiHandler.getApiName()}`);
  console.log(`Base URL: ${apiHandler.getApiBaseUrl()}`);

  let authHeaders: object;
  try {
    authHeaders = await apiHandler.getApiAuthHeaders();
    console.log(`Auth headers: ${JSON.stringify(authHeaders)}`);
  } catch (error) {
    console.log(
      `Error while getting auth headers: ${
        error instanceof Error ? error.message : "unknown"
      }`
    );
  }

  if (apiHandler.authorizeEndpoint) {
    console.log(`Authorize endpoint: ${apiHandler.authorizeEndpoint}`);
  }

  if (apiHandler.tokenEndpoint) {
    console.log(`Token endpoint: ${apiHandler.tokenEndpoint}`);
  }

  console.log(`Primary endpoints:`);
  for (const endpoint of apiHandler.endpointsPrimary) {
    const params = typeof endpoint.getParams === "function" ? endpoint.getParams() : {};
    const histParams = endpoint.isHistoric()
      ? (endpoint as ApiHistoricEndpoint).getHistoricParams()
      : params;
    const histDelay = endpoint.isHistoric()
      ? (endpoint as ApiHistoricEndpoint).getHistoricDelay()
      : endpoint.getDelay();
    console.log(``);
    console.log(`  | Endpoint: ${endpoint.getEndpoint()}`);
    console.log(
      `  | Standard params: ${new URLSearchParams(params as Record<string, string>).toString()}`
    );
    console.log(`  | Standard delay in seconds: ${endpoint.getDelay()}`);
    console.log(
      `  | Historic params: ${new URLSearchParams(histParams as Record<string, string>).toString()}`
    );
    console.log(`  | Historic delay in seconds: ${histDelay}`);
    console.log(
      `  | Directory: ${path.join(getConfig().outputDir, apiName, endpoint.getDirName())}`
    );
  }
  console.log(``);
  console.log(`---`);
  console.log(``);
}
