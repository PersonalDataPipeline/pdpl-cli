import { ONE_DAY_IN_SEC, ONE_QUATER_IN_SEC } from "../../utils/date-time.js";
import { ApiHandler, EpHistoric, EpSecondary, EpSnapshot } from "../../utils/types.js";

const { HACKER_NEWS_USERNAME = "" } = process.env;

////
/// Exports
//

const isReady = () => !!HACKER_NEWS_USERNAME;
const getApiName = () => "hacker-news";
const getApiBaseUrl = () => "https://hacker-news.firebaseio.com/v0/";
const getHistoricDelay = () => ONE_QUATER_IN_SEC;
const getApiAuthHeaders = async () => ({});

const endpointsPrimary: (EpHistoric | EpSnapshot)[] = [
  {
    isHistoric: () => false,
    getEndpoint: () => `user/${HACKER_NEWS_USERNAME}.json`,
    getDirName: () => "user",
    getDelay: () => ONE_DAY_IN_SEC,
  },
];
const endpointsSecondary: EpSecondary[] = [];

const handler: ApiHandler = {
  isReady,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  getHistoricDelay,
  endpointsPrimary,
  endpointsSecondary,
};

export default handler;
