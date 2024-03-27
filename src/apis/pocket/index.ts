import { AxiosResponse } from "axios";
import {
  ONE_DAY_IN_SEC,
  ONE_YEAR_IN_SEC,
  getEpochNow,
  getFormattedDate,
} from "../../utils/date-time.js";
import { ApiSecondaryEndpoint, ApiSnapshotEndpoint } from "../../utils/types.js";
import { MockAxiosResponse } from "../../utils/api-data.js";
import getConfig from "../../utils/config.js";

const { POCKET_CONSUMER_KEY = "", POCKET_ACCESS_TOKEN = "" } = process.env;

////
/// Types
//

interface PocketRequestBody {
  consumer_key: string;
  access_token: string;
  status?: "all" | "unread" | "archive";
  sort?: "newest" | "oldest" | "title" | "site";
  detailType?: "simple" | "complete";
  since?: number;
}

interface PocketEntity {
  time_added: string;
}

////
/// Exports
//

const authorizeEndpoint = "https://getpocket.com/auth/authorize";
const tokenEndpoint = "https://getpocket.com/v3/oauth/authorize";
const getApiName = () => "pocket";
const getApiBaseUrl = () => "https://getpocket.com/v3/";
const getApiAuthHeaders = (): object => {
  if (!POCKET_CONSUMER_KEY) {
    console.log("❌ No Pocket consumer key stored. See README for more information.");
    process.exit(1);
  }

  return {
    "Content-Type": "application/json; charset=UTF-8",
  };
};

const getHistoricDelay = () => ONE_YEAR_IN_SEC;
const endpointsPrimary: ApiSnapshotEndpoint[] = [
  {
    isHistoric: () => false,
    getEndpoint: () => "get",
    getDirName: () => "get",
    getMethod: () => "post",
    getRequestData: (): PocketRequestBody => ({
      consumer_key: POCKET_CONSUMER_KEY,
      access_token: POCKET_ACCESS_TOKEN,
      status: "all",
      sort: "newest",
      detailType: "complete",
      since: getEpochNow(new Date(getConfig().originDate + "T00:00:00")),
    }),
    getDelay: () => ONE_DAY_IN_SEC,
    parseDayFromEntity: (entity: PocketEntity) => {
      return getFormattedDate(0, new Date(parseInt(entity.time_added, 10) * 1000));
    },
    transformResponseData: (
      response: AxiosResponse | MockAxiosResponse
    ): PocketEntity[] => {
      const listData = [];
      for (const entity of Object.values(response.data.list as object)) {
        if ("time_added" in (entity as object)) {
          listData.push(entity as PocketEntity);
        }
      }
      return listData;
    },
  },
];
const endpointsSecondary: ApiSecondaryEndpoint[] = [];

export {
  authorizeEndpoint,
  tokenEndpoint,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  getHistoricDelay,
  endpointsPrimary,
  endpointsSecondary,
};
