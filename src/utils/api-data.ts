import path from "path";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import axiosRetry, { exponentialDelay } from "axios-retry";

import { existsSync, mkdirSync } from "fs";
import getConfig from "./config.js";
import { ApiHandler, EpChronological, EpSecondary, EpSnapshot } from "./types.js";
import { __dirname, writeFile } from "./fs.js";
import logger from "./logger.js";

////
/// Helpers
//

axiosRetry(axios, { retries: 3, retryDelay: exponentialDelay });

const makeMockPath = (apiName: string, endpointDir: string) => {
  let mockPath = path.join(__dirname, "..", "..", "__mocks__", "api-data");

  if (!existsSync(mockPath)) {
    mkdirSync(mockPath);
  }

  mockPath = path.join(mockPath, apiName);

  if (!existsSync(mockPath)) {
    mkdirSync(mockPath);
  }

  return path.join(mockPath, `${endpointDir}.json`);
};

////
/// Exports
//

export const getApiData = async (
  apiHandler: ApiHandler,
  handler: EpChronological | EpSnapshot | EpSecondary,
  entity?: object
): Promise<AxiosResponse> => {
  const isEnriching = typeof entity !== "undefined";
  const endpoint = isEnriching
    ? (handler as EpSecondary).getEndpoint(entity)
    : (handler as EpChronological | EpSnapshot).getEndpoint();

  const axiosConfig: AxiosRequestConfig = {
    url: endpoint,
    baseURL: apiHandler.getApiBaseUrl(),
    headers: await apiHandler.getApiAuthHeaders(),
    method:
      typeof handler.getMethod === "function" ? handler.getMethod().toLowerCase() : "get",
    params: typeof handler.getParams === "function" ? handler.getParams() : {},
  };

  if (typeof handler.getRequestData === "function" && axiosConfig.method === "post") {
    axiosConfig.data = handler.getRequestData();
  }

  logger.printDebug(axiosConfig, apiHandler);
  const response = await axios(axiosConfig);

  if (getConfig().debugSaveMocks) {
    const mockFilename = isEnriching
      ? endpoint.replaceAll("/", "--")
      : handler.getDirName();

    writeFile(
      makeMockPath(apiHandler.getApiName(), mockFilename),
      JSON.stringify(response.data)
    );
  }

  return response;
};
