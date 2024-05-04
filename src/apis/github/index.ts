import { AxiosResponse } from "axios";
import {
  ONE_DAY_IN_SEC,
  QUARTER_YEAR_IN_SEC,
  QUARTER_HOUR_IN_SEC,
  getFormattedDate,
} from "../../utils/date-time.js";
import { ApiHandler, EpHistoric, EpSecondary, EpSnapshot } from "../../utils/types.js";

const { GITHUB_PERSONAL_ACCESS_TOKEN = "", GITHUB_USERNAME = "" } = process.env;

////
/// Types
//

interface GitHubEventEntity {
  created_at: string;
}

interface GitHubUrlParams {
  page?: number;
  per_page?: number;
  since?: string;
}

////
/// Helpers
//

const getDefaultParams = (): GitHubUrlParams => ({
  page: 1,
  per_page: 100,
});

const getStandardNextCallParams = (
  response: AxiosResponse,
  params?: GitHubUrlParams
): GitHubUrlParams => {
  return params && (response.data as object[]).length === 100
    ? {
        page: params.page ? params.page + 1 : 1,
        per_page: 100,
      }
    : {};
};

const parseDayFromEntity = (entity: object): string => {
  return (entity as GitHubEventEntity).created_at.split("T")[0];
};

const getHistoricParams = (currentParams?: GitHubUrlParams): GitHubUrlParams => ({
  page: currentParams && currentParams.page ? currentParams.page + 1 : 1,
  per_page: 100,
});

const getHistoricDelay = (continuation?: boolean) =>
  continuation ? QUARTER_HOUR_IN_SEC : QUARTER_YEAR_IN_SEC;

////
/// Exports
//

const isReady = () => !!GITHUB_PERSONAL_ACCESS_TOKEN && !!GITHUB_USERNAME;
const getApiName = () => "github";
const getApiBaseUrl = () => "https://api.github.com/";
const getApiAuthHeaders = async () => ({
  "Authorization": `Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
  "Accept": "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

const endpointsPrimary: (EpHistoric | EpSnapshot)[] = [
  {
    isHistoric: () => false,
    getEndpoint: () => `users/${GITHUB_USERNAME}`,
    getDirName: () => "user",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => false,
    getEndpoint: () => "user/starred",
    getDirName: () => "user--starred",
    getDelay: () => ONE_DAY_IN_SEC,
    getParams: getDefaultParams,
    getNextCallParams: getStandardNextCallParams,
  },
  {
    isHistoric: () => false,
    getEndpoint: () => "user/followers",
    getDirName: () => "user--followers",
    getDelay: () => ONE_DAY_IN_SEC,
    getParams: getDefaultParams,
    getNextCallParams: getStandardNextCallParams,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "gists",
    getDirName: () => "user--gists",
    getDelay: () => ONE_DAY_IN_SEC,
    getParams: () => ({
      ...getDefaultParams(),
      since: `${getFormattedDate(-7)}T00:00:00Z`,
    }),
    parseDayFromEntity,
    getHistoricDelay,
    getHistoricParams,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => `users/${GITHUB_USERNAME}/events`,
    getDirName: () => "user--events",
    getDelay: () => ONE_DAY_IN_SEC,
    getParams: getDefaultParams,
    parseDayFromEntity,
    getHistoricDelay,
    getHistoricParams,
  },
];
const endpointsSecondary: EpSecondary[] = [];

const handler: ApiHandler = {
  isReady,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary,
};

export default handler;
