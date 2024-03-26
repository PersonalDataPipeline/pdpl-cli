import { AxiosResponse } from "axios";

import { MockAxiosResponse } from "./api-data.js";

export interface DailyEntity {
  day: string;
}

export interface DailyData {
  [key: string]: DailyEntity[];
}

export interface ApiHandler {
  getApiName: () => string;
  getApiBaseUrl: () => string;
  getApiAuthHeaders: () => Promise<{ [key: string]: string }>;
  getHistoricDelay: () => number;
  endpointsPrimary: ApiPrimaryEndpoint[];
  endpointsSecondary: ApiSecondaryEndpoint[];
  authorizeEndpoint?: string;
  tokenEndpoint?: string;
}

export interface ApiPrimaryEndpoint {
  getDirName: () => string;
  getEndpoint: () => string;
  getDelay: () => number;
  getMethod?: () => string;
  getParams?: () => object;
  shouldHistoricContinue?: (responseData: object | [], params: object) => boolean;
  getHistoricParams?: (currentParams?: object, didReturnData?: boolean) => object;
  getHistoricDelay?: () => number;
  transformResponseData?: (
    response: AxiosResponse | MockAxiosResponse,
    existingData?: [] | object
  ) => [] | object;
  parseDayFromEntity?: (entity: any) => string;
  getNextCallParams?: (response?: AxiosResponse | MockAxiosResponse) => object;
}

export interface ApiSecondaryEndpoint {
  getDirName: () => string;
  getEndpoint: (entity: any) => string;
  getPrimary: () => string;
  getIdentifier: (entity: any) => string;
  getParams?: () => object;
  getMethod?: () => string;
  transformResponseData?: (
    response: AxiosResponse | MockAxiosResponse,
    existingData?: [] | object
  ) => [] | object;
}

export interface EndpointRecord {
  endpoint: string;
  params: object;
}
