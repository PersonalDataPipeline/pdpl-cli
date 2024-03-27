import {
  ONE_DAY_IN_SEC,
  ONE_QUATER_IN_SEC,
  QUARTER_HOUR_IN_SEC,
} from "../../utils/date-time.js";
import { ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "../../utils/types.js";

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
}

////
/// Exports
//

const getApiName = () => "github";
const getApiBaseUrl = () => "https://api.github.com/";
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
const getHistoricDelay = () => ONE_QUATER_IN_SEC;
const endpointsPrimary: ApiPrimaryEndpoint[] = [
  {
    getEndpoint: () => "user/followers",
    getDirName: () => "user--followers",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    getEndpoint: () => `users/${GITHUB_USERNAME}/events`,
    getDirName: () => "user--events",
    getDelay: () => ONE_DAY_IN_SEC,
    getParams: (): GitHubUrlParams => ({
      page: 1,
      per_page: 100,
    }),
    parseDayFromEntity: (entity: GitHubEventEntity): string => {
      return entity.created_at.split("T")[0];
    },
    getHistoricDelay: () => QUARTER_HOUR_IN_SEC,
    getHistoricParams: (currentParams?: GitHubUrlParams) => ({
      page: currentParams && currentParams.page ? currentParams.page + 1 : 1,
      per_page: 100,
    }),
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
