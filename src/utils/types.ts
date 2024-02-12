import { AxiosResponse } from "axios";

export interface DailyEntity {
  day: string;
}

export interface DailyData {
  [key: string]: DailyEntity[];
}

export interface ApiHandler {
  getApiName: () => string;
  getApiBaseUrl: () => string;
  getApiAuthHeaders: () => {};
  endpoints: ApiEndpoint[];
  authorizeEndpoint?: string;
  tokenEndpoint?: string;
}

export interface ApiEndpoint {
  getDirName: () => string;
  getEndpoint: (entity?: any) => string;
  method?: string;
  getParams?: () => {};
  parseDayFromEntity?: (entity: any) => string;
  enrichEntity?: ApiEnrichEndpoint[];
}

export interface ApiEnrichEndpoint {
  getEndpoint: (entity: any) => string;
  enrichEntity: (entity: any, response: AxiosResponse) => {};
  getDirName?: () => {};
  getParams?: () => {};
}
