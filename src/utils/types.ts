import { AxiosResponse } from "axios";

export interface DailyData {
  [key: string]: object[];
}

export interface ApiHandler {
  isReady: () => boolean;
  getApiName: () => string;
  getApiBaseUrl: () => string;
  getApiAuthHeaders: () => Promise<{ [key: string]: string }>;
  getHistoricDelay: () => number;
  endpointsPrimary: (EpHistoric | EpSnapshot)[];
  endpointsSecondary: EpSecondary[];
  authorizeEndpoint?: string;
  tokenEndpoint?: string;
}

export interface EpSnapshot {
  isHistoric: () => false;
  getDirName: () => string;
  getEndpoint: () => string;
  getDelay: () => number;
  getMethod?: () => "get" | "post";
  getParams?: () => object;
  getRequestData?: () => object;
  getNextCallParams?: (response: AxiosResponse, params?: object) => object;
  transformResponseData?: (
    response: AxiosResponse,
    existingData?: [] | object
  ) => [] | object;
  // TODO: Do we ever need this on a snapshot?
  parseDayFromEntity?: (entity: object) => string;
}

export interface EpHistoric
  extends Omit<EpSnapshot, "isHistoric" | "parseDayFromEntity"> {
  isHistoric: () => true;
  parseDayFromEntity: (entity: object) => string;
  getHistoricParams: (currentParams?: object, didReturnData?: boolean) => object;
  getHistoricDelay: () => number;
  transformPrimary?: (entity: object | []) => unknown[];
  shouldHistoricContinue?: (responseData: object | [], params: object) => boolean;
}

export interface EpSecondary {
  getDirName: (entity?: object) => string;
  getEndpoint: (entity: object) => string;
  getPrimary: () => string;
  getIdentifier: (entity: object) => string;
  getParams?: () => object;
  getMethod?: () => string;
  getRequestData?: () => object;
  transformResponseData?: (
    response: AxiosResponse,
    existingData?: [] | object
  ) => [] | object;
}

export interface EndpointRecord {
  endpoint: string;
  params: object;
}

export interface ImportHandler {
  importFiles: ImportFileHandler[];
}

export interface ImportFileHandler {
  getImportPath: () => string;
  getDirName: () => string;
  parsingStrategy: () => "csv" | "json";
  parseDayFromEntity: (entity: object) => string;
  transformEntity?: (entity: object) => object | null;
  transformFileContents?: (content: string) => string;
}
