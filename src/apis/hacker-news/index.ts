import { ONE_DAY_IN_SEC } from "../../utils/date-time.js";
import { ApiHandler, EpHistoric, EpSecondary, EpSnapshot } from "../../utils/types.js";

const { HACKER_NEWS_USERNAME = "" } = process.env;

////
/// Types
//

interface HNItemEntity {
  id: string;
  type: string;
}

interface HNUserEntity {
  id: string;
  submitted: string[];
}

////
/// Exports
//

const isReady = () => !!HACKER_NEWS_USERNAME;
const getApiName = () => "hacker-news";
const getApiBaseUrl = () => "https://hacker-news.firebaseio.com/v0/";
const getApiAuthHeaders = async () => ({});

const endpointsPrimary: (EpHistoric | EpSnapshot)[] = [
  {
    isHistoric: () => false,
    getEndpoint: () => `user/${HACKER_NEWS_USERNAME}.json`,
    getDirName: () => "user",
    getDelay: () => ONE_DAY_IN_SEC,
    transformPrimary: (entity: unknown): string[] => (entity as HNUserEntity).submitted,
  },
];

const endpointsSecondary: EpSecondary[] = [
  {
    getDirName: (entity?: object) => {
      return entity ? `item--${(entity as HNItemEntity).type}` : "item";
    },
    getEndpoint: (entity: unknown) => `item/${entity as number}.json`,
    getPrimary: () => `user/${HACKER_NEWS_USERNAME}.json`,
    // TODO: There's got to be a better way here
    // @ts-expect-error: first param not used
    getIdentifier: (entity1: object | number, entity2: object) =>
      (entity2 as HNItemEntity).id,
  },
];

const handler: ApiHandler = {
  isReady,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary,
};

export default handler;
