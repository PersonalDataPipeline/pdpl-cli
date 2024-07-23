import { AxiosError, AxiosResponse } from "axios";
import { AuthorizeServerConfig } from "../commands/api/authorize.js";
import { Database } from "duckdb-async";

export type KeyVal = { [key: string]: string };

export interface DailyData {
  [key: string]: object[];
}

export interface ApiHandler {
  isReady: () => boolean;
  getApiName: () => string;
  getApiBaseUrl: () => string;
  getApiAuthHeaders: () => Promise<{ [key: string]: string }>;
  endpointsPrimary: (EpChronological | EpSnapshot)[];
  endpointsSecondary: EpSecondary[];
  getAuthorizeConfig?: () => AuthorizeServerConfig;
}

export interface EpSnapshot {
  isChronological: () => false;
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
  parseDayFromEntity?: (entity: object) => string;
  handleApiError?: (response: AxiosError) => void;
}

export interface EpChronological
  extends Omit<EpSnapshot, "isChronological" | "parseDayFromEntity"> {
  isChronological: () => true;
  parseDayFromEntity: (entity: object) => string;
  getHistoricParams: (currentParams?: object, responseDataRaw?: object | []) => object;
  getHistoricDelay: (continuation?: boolean) => number;
  transformPrimary?: (entity: object | []) => unknown[];
  shouldHistoricContinue?: (
    responseDataRaw: object | [],
    currentParams: object
  ) => boolean;
}

export interface EpSecondary {
  getDirName: (entity?: object) => string;
  getEndpoint: (entity: object) => string;
  getPrimary: () => string;
  getIdentifier: (entity1: object | number, entity2: object) => string;
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
  getDirName: () => string;
  parsingStrategy: () => "csv" | "json" | "vcf";
  getImportPath?: () => string;
  parseDayFromEntity?: (entity: object | []) => string;
  transformEntity?: (entity: object | []) => object | null;
  transformFileContents?: (content: string) => string;
  transformParsedData?: (data: object | []) => (object | string[])[];
  handleEntityFiles?: (entity: object, importPath: string) => void;
}

export interface OutputHandler {
  handlers: OutputStrategy[];
  isReady: () => boolean;
}

export type OutputStrategyHandler = (
  db: Database,
  fields: KeyVal,
  data?: KeyVal
) => Promise<void>;

export interface OutputStrategy {
  name: () => string;
  isReady: (fields: KeyVal, data?: KeyVal) => string[];
  handle: OutputStrategyHandler;
}
