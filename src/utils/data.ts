import path from "path";
import axios, { AxiosResponse } from "axios";

import getConfig from "./config.js";
import { ApiHandler, ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "./types.js";
import { __dirname, readFile } from "./fs.js";

////
/// Types
//

export interface MockAxiosResponse extends Omit<AxiosResponse, "config"> {}

////
/// Helpers
//

const getMockApiData = (
  apiName: string,
  endpointDir: string
): MockAxiosResponse | null => {
  const mockPath = path.join(
    __dirname,
    "..",
    "..",
    "__mocks__",
    "api-data",
    apiName,
    `${endpointDir}.json`
  );

  try {
    const mockJson = readFile(mockPath);
    return {
      data: JSON.parse(mockJson),
      headers: {},
      status: 200,
      statusText: "OK",
    };
  } catch (error) {
    // File not found, continue with HTTP request
    return null;
  }
};

////
/// Exports
//

export const getApiData = async (
  apiHandler: ApiHandler,
  handler: ApiPrimaryEndpoint | ApiSecondaryEndpoint,
  entity?: any
): Promise<AxiosResponse | MockAxiosResponse> => {
  const isEnriching = typeof entity !== "undefined";
  const endpoint = handler.getEndpoint(entity);

  if (getConfig().debug) {
    const filename = isEnriching ? endpoint.replaceAll("/", "--") : handler.getDirName();
    const apiData = getMockApiData(apiHandler.getApiName(), filename);

    if (apiData !== null) {
      return apiData;
    }
  }

  const axiosConfig = {
    url: endpoint,
    baseURL: apiHandler.getApiBaseUrl(),
    headers: await apiHandler.getApiAuthHeaders(),
    method: typeof handler.getMethod === "function" ? handler.getMethod() : "get",
    params: typeof handler.getParams === "function" ? handler.getParams() : {},
  };

  if (getConfig().debug) {
    console.log(axiosConfig);
  }

  return await axios(axiosConfig);
};
