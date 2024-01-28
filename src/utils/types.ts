import { AxiosResponse } from "axios";

export interface DailyEntity {
  day: string;
}

export interface DailyData {
  [key: string]: DailyEntity[];
}

export interface ApiEnrichEndpoint {
  getEndpoint: (entity: any) => string;
  enrichEntity: (entity: any, response: AxiosResponse) => {};
  getParams?: () => {};
}

export interface ApiEndpoint {
  getDirName: () => string;
  getParams?: () => {};
  parseDayFromEntity?: (entity: any) => string;
  enrichEntity?: ApiEnrichEndpoint[];
}

export interface ApiHandler {
  getApiBaseUrl: () => string;
  getApiAuthHeaders: () => {};
  endpoints: {
    [key: string]: ApiEndpoint;
  };
  authorizeEndpoint?: string;
  tokenEndpoint?: string;
}
