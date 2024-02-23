import { readFileSync } from "fs";

import path from "path";
import axios, { AxiosResponse } from "axios";

import getConfig from "./config.js";
import { ApiHandler } from "./types.js";
import { __dirname } from "./fs.js";

////
/// Types
//

export interface MockAxiosResponse extends Omit<AxiosResponse, "config"> {}

////
/// Helpers
//

const getMockApiData = (apiName: string, endpointDir: string): MockAxiosResponse | null => {
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
    const mockJson = readFileSync(mockPath, "utf8");
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
  endpointHandler: any,
  entity?: any
): Promise<AxiosResponse | MockAxiosResponse> => {
  const isEnriching = typeof entity !== "undefined";
  const endpoint = endpointHandler.getEndpoint(entity);

  if (getConfig().debug) {
    const filename = isEnriching
      ? endpoint.replaceAll("/", "--")
      : endpointHandler.getDirName();
    const apiData = getMockApiData(apiHandler.getApiName(), filename);
    
    if (apiData !== null) {
      return apiData;
    }
  }

  const axiosConfig = {
    baseURL: apiHandler.getApiBaseUrl(),
    headers: await apiHandler.getApiAuthHeaders(),
    url: endpoint,
    method: endpointHandler.method || "get",
    params:
      typeof endpointHandler.getParams === "function" ? endpointHandler.getParams() : {},
  };

  if (getConfig().debug) {
    console.log(axiosConfig);
  }
  
  return await axios(axiosConfig);
};
