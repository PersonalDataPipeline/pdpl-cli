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
  endpointsPrimary: ApiEndpoint[];
  endpointsSecondary: ApiEnrichEndpoint[];
  authorizeEndpoint?: string;
  tokenEndpoint?: string;
}

export interface ApiEndpoint {
  getDirName: () => string;
  getEndpoint: () => string;
  method?: string;
  getParams?: () => {};
  transformResponseData?: (response: any) => any[];
  parseDayFromEntity?: (entity: any) => string;
}

export interface ApiEnrichEndpoint extends Omit<ApiEndpoint, "getEndpoint"> {
  getEndpoint: (entity: any) => string;
  getPrimary: () => string;
  getIdentifier: (entity: any) => string;
}
