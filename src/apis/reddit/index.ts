import { ONE_DAY_IN_SEC } from "../../utils/date-time.js";
import { ApiHandler, EpHistoric, EpSecondary, EpSnapshot } from "../../utils/types.js";

const { REDDIT_REFRESH_TOKEN = "" } = process.env;

////
/// Types
//

////
/// Helpers
//

////
/// Exports
//

const isReady = () => !!REDDIT_REFRESH_TOKEN;
const authorizeEndpoint = "https://www.reddit.com/api/v1/authorize";
const tokenEndpoint = "https://www.reddit.com/api/v1/access_token";
const getApiName = () => "reddit";
const getApiBaseUrl = () => "https://oauth.reddit.com/api/v1/";
const getApiAuthHeaders = async () => ({
  Authorization: `Bearer ${REDDIT_REFRESH_TOKEN}`,
});

const endpointsPrimary: (EpHistoric | EpSnapshot)[] = [
  {
    isHistoric: () => false,
    getEndpoint: () => `me`,
    getDirName: () => "me",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => false,
    getEndpoint: () => `trophies`,
    getDirName: () => "trophies",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => false,
    getEndpoint: () => `prefs`,
    getDirName: () => "prefs",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => false,
    getEndpoint: () => `karma`,
    getDirName: () => "karma",
    getDelay: () => ONE_DAY_IN_SEC,
  },
];
const endpointsSecondary: EpSecondary[] = [];

const handler: ApiHandler = {
  isReady,
  authorizeEndpoint,
  tokenEndpoint,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary,
};

export default handler;
