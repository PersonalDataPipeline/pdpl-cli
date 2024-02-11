import { config } from "dotenv";
config();

import { mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apisSupported = process.argv[2] ? [ process.argv[2] ] : readdirSync("./src/apis");
const mocksDirRelative = path.join(__dirname, "..", "..", "__mocks__", "api-data");

(async () => {
  for (const apiName of apisSupported) {
    const saveDir = path.join(mocksDirRelative, apiName);
    rmSync(saveDir, { recursive: true, force: true });
    mkdirSync(saveDir);

    const apiHandler = await import(`../apis/${apiName}/index.js`);
  
    for (const endpoint in apiHandler.endpoints) {
      const thisEndpoint = apiHandler.endpoints[endpoint];

      const axiosConfig = {
        baseURL: apiHandler.getApiBaseUrl(),
        headers: await apiHandler.getApiAuthHeaders(),
        url: endpoint,
        method: thisEndpoint.method || "get",
        params:
          typeof thisEndpoint.getParams === "function" ? thisEndpoint.getParams() : {},
      };

      let apiResponse = { data: {} };
      try {
        apiResponse = await axios(axiosConfig);
        writeFileSync(
          path.join(saveDir, `${thisEndpoint.getDirName()}.json`), 
          JSON.stringify(apiResponse.data)
        );
      } catch (error: any) {
        console.log(`❌ Caught error for ${axiosConfig.url}: ${error.message}`);
      }
      
      if (thisEndpoint.enrichEntity) {
        
        const [ entityData ] = typeof thisEndpoint.transformResponse === "function" ?
          thisEndpoint.transformResponse(apiResponse.data) : 
          [ apiResponse.data ];

        for (const entity of entityData) {
          
          for (const enrichFunction of thisEndpoint.enrichEntity) {

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
})();
