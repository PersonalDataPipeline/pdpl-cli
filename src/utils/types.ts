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
  endpointsPrimary: (ApiHistoricEndpoint | ApiSnapshotEndpoint)[];
  endpointsSecondary: ApiSecondaryEndpoint[];
  authorizeEndpoint?: string;
  tokenEndpoint?: string;
}

export interface ApiSnapshotEndpoint {
  isHistoric: () => false;
  getDirName: () => string;
  getEndpoint: () => string;
  getDelay: () => number;
  getMethod?: () => "get" | "post";
  getParams?: () => object;
  getRequestData?: () => object;
  getNextCallParams?: (
    response: AxiosResponse | MockAxiosResponse,
    params?: object
  ) => object;
  transformResponseData?: (
    response: AxiosResponse | MockAxiosResponse,
    existingData?: [] | object
  ) => [] | object;
  parseDayFromEntity?: (entity: any) => string;
}

export interface ApiHistoricEndpoint
  extends Omit<ApiSnapshotEndpoint, "isHistoric" | "parseDayFromEntity"> {
  isHistoric: () => true;
  parseDayFromEntity: (entity: any) => string;
  getHistoricParams: (currentParams?: object, didReturnData?: boolean) => object;
  getHistoricDelay: () => number;
  shouldHistoricContinue?: (responseData: object | [], params: object) => boolean;
}

export interface ApiSecondaryEndpoint {
  getDirName: () => string;
  getEndpoint: (entity: any) => string;
  getPrimary: () => string;
  getIdentifier: (entity: any) => string;
  getParams?: () => object;
  getMethod?: () => string;
  getRequestData?: () => object;
  transformResponseData?: (
    response: AxiosResponse | MockAxiosResponse,
    existingData?: [] | object
  ) => [] | object;
}

export interface EndpointRecord {
  endpoint: string;
  params: object;
}
