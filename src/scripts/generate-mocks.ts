import { config } from "dotenv";
config();

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import axios from "axios";
import path from "path";

const apisSupported = process.argv[2] ? [process.argv[2]] : readdirSync("./src/apis");
const mocksDirRelative = path.join(__dirname, "..", "..", "__mocks__", "api-data");

for (const apiName of apisSupported) {
  const saveDir = path.join(mocksDirRelative, apiName);
  rmSync(saveDir, { recursive: true, force: true });
  mkdirSync(saveDir);

  const apiHandler = await import(`../apis/${apiName}/index.js`);

  for (const endpointHandler of apiHandler.endpoints) {
    const axiosConfig = {
      baseURL: apiHandler.getApiBaseUrl(),
      headers: await apiHandler.getApiAuthHeaders(),
      url: endpointHandler.getEndpoint(),
      method: endpointHandler.method || "get",
      params:
        typeof endpointHandler.getParams === "function"
          ? endpointHandler.getParams()
          : {},
    };

    let apiResponse = { data: {} };
    try {
      apiResponse = await axios(axiosConfig);
      writeFileSync(
        path.join(saveDir, `${endpointHandler.getDirName()}.json`),
        JSON.stringify(apiResponse.data)
      );
    } catch (error: any) {
      console.log(`❌ Caught error for ${axiosConfig.url}: ${error.message}`);
    }

    if (endpointHandler.enrichEntity) {
      const entityData =
        typeof endpointHandler.transformResponseData === "function"
          ? endpointHandler.transformResponseData(apiResponse.data)
          : apiResponse.data;

      for (const entity of entityData) {
        for (const enrichFunction of endpointHandler.enrichEntity) {
          const enrichAxiosConfig = {
            baseURL: apiHandler.getApiBaseUrl(),
            headers: await apiHandler.getApiAuthHeaders(),
            url: enrichFunction.getEndpoint(entity),
            method: enrichFunction.method || "get",
            params:
              typeof enrichFunction.getParams === "function"
                ? enrichFunction.getParams(entity)
                : {},
          };

          try {
            const enrichApiResponse = await axios(enrichAxiosConfig);
            const fileName = enrichFunction.getEndpoint(entity).replaceAll("/", "--");
            writeFileSync(
              path.join(saveDir, `${fileName}.json`),
              JSON.stringify(enrichApiResponse.data)
            );
          } catch (error: any) {
            console.log(`❌ Caught error for ${enrichAxiosConfig.url}: ${error.message}`);
          }
        }
      }
    }
  }
}
