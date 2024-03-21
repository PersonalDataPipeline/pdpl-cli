import path from "path";
import axios, { AxiosResponse } from "axios";

import getConfig from "./config.js";
import { ApiHandler, ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "./types.js";
import { __dirname, readFile, writeFile } from "./fs.js";

////
/// Types
//

export interface MockAxiosResponse extends Omit<AxiosResponse, "config"> {}

////
/// Helpers
//

const makeMockPath = (apiName: string, endpointDir: string) =>
  path.join(
    __dirname,
    "..",
    "..",
    "__mocks__",
    "api-data",
    apiName,
    `${endpointDir}.json`
  );

const getMockApiData = (
  apiName: string,
  endpointDir: string
): MockAxiosResponse | null => {
  const mockPath = makeMockPath(apiName, endpointDir);

  try {
    const mockJson = readFile(mockPath);
    return {
      data: JSON.parse(mockJson) as unknown,
      headers: {},
      status: 200,
      statusText: "OK",
    };
  } catch (error) {
    return null;
  }
};

////
/// Exports
//

export const getApiData = async (
  apiHandler: ApiHandler,
  handler: ApiPrimaryEndpoint | ApiSecondaryEndpoint,
  entity?: object
): Promise<AxiosResponse | MockAxiosResponse> => {
  const isEnriching = typeof entity !== "undefined";
  const endpoint = handler.getEndpoint(entity);

  const mockFilename = isEnriching
    ? endpoint.replaceAll("/", "--")
    : handler.getDirName();
  if (getConfig().debugUseMocks) {
    const apiData = getMockApiData(apiHandler.getApiName(), mockFilename);

    if (apiData === null) {
      throw new Error(`No mock data found for ${endpoint}`);
    }

    return apiData;
  }

  const axiosConfig = {
    url: endpoint,
    baseURL: apiHandler.getApiBaseUrl(),
    headers: await apiHandler.getApiAuthHeaders(),
    method: typeof handler.getMethod === "function" ? handler.getMethod() : "get",
    params: typeof handler.getParams === "function" ? handler.getParams() : {},
  };

  const response = await axios(axiosConfig);

  if (getConfig().debugSaveMocks) {
    writeFile(
      makeMockPath(apiHandler.getApiName(), mockFilename),
      JSON.stringify(response.data)
    );
  }

  return response;
};