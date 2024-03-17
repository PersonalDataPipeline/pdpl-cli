import { AxiosResponse } from "axios";

import { MockAxiosResponse } from "./data.js";

export interface DailyEntity {
  day: string;
}

export interface DailyData {
  [key: string]: DailyEntity[];
}

export interface ApiHandler {
  getApiName: () => string;
  getApiBaseUrl: () => string;
  getApiAuthHeaders: () => Promise<object>;
  endpointsPrimary: ApiPrimaryEndpoint[];
  endpointsSecondary: ApiSecondaryEndpoint[];
  getHistoricDelay?: () => number;
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
  transformResponseData?: (response: AxiosResponse | MockAxiosResponse) => unknown;
  parseDayFromEntity?: (entity: any) => string;
}

export interface ApiSecondaryEndpoint
  extends Omit<
    ApiPrimaryEndpoint,
    | "getEndpoint"
    | "getDelay"
    | "getHistoricParams"
    | "getHistoricDelay"
    | "shouldHistoricContinue"
  > {
  getEndpoint: (entity: any) => string;
  getPrimary: () => string;
  getIdentifier: (entity: any) => string;
}

export interface EndpointRecord {
  endpoint: string;
  params: object;
}
