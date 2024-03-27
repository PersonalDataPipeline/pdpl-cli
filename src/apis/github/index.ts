import { AxiosResponse } from "axios";
import {
  ONE_DAY_IN_SEC,
  ONE_QUATER_IN_SEC,
  QUARTER_HOUR_IN_SEC,
  getFormattedDate,
} from "../../utils/date-time.js";
import {
  ApiHistoricEndpoint,
  ApiSecondaryEndpoint,
  ApiSnapshotEndpoint,
} from "../../utils/types.js";
import { MockAxiosResponse } from "../../utils/api-data.js";

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
  response: AxiosResponse | MockAxiosResponse,
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

////
/// Exports
//

const getApiName = () => "github";
const getApiBaseUrl = () => "https://api.github.com/";
const getHistoricDelay = () => ONE_QUATER_IN_SEC;
const getApiAuthHeaders = (): object => {
  if (!GITHUB_PERSONAL_ACCESS_TOKEN) {
    console.log("❌ No GitHub access token stored. See README for more information.");
    process.exit(1);
  }

  if (!GITHUB_USERNAME) {
    console.log("❌ No GitHub username stored. See README for more information.");
    process.exit(1);
  }

  return {
    "Authorization": `Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
};

const endpointsPrimary: (ApiHistoricEndpoint | ApiSnapshotEndpoint)[] = [
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
    getHistoricDelay: () => QUARTER_HOUR_IN_SEC,
    getHistoricParams,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => `users/${GITHUB_USERNAME}/events`,
    getDirName: () => "user--events",
    getDelay: () => ONE_DAY_IN_SEC,
    getParams: getDefaultParams,
    parseDayFromEntity,
    getHistoricDelay: () => QUARTER_HOUR_IN_SEC,
    getHistoricParams,
  },
];
const endpointsSecondary: ApiSecondaryEndpoint[] = [];

export {
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  getHistoricDelay,
  endpointsPrimary,
  endpointsSecondary,
};
