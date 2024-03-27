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
  getMethod?: () => string;
  getParams?: () => object;
  transformResponseData?: (
    response: AxiosResponse | MockAxiosResponse,
    existingData?: [] | object
  ) => [] | object;
}

export interface ApiHistoricEndpoint extends Omit<ApiSnapshotEndpoint, "isHistoric"> {
  isHistoric: () => true;
  parseDayFromEntity: (entity: any) => string;
  getHistoricParams: (currentParams?: object, didReturnData?: boolean) => object;
  getHistoricDelay: () => number;
  shouldHistoricContinue?: (responseData: object | [], params: object) => boolean;
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
