import axios, { AxiosResponse } from "axios";

import { envWrite } from "../../utils/fs.js";
import { ApiHandler, EpHistoric, EpSecondary, EpSnapshot } from "../../utils/types.js";
import {
  HALF_HOUR_IN_SEC,
  ONE_DAY_IN_SEC,
  ONE_QUATER_IN_SEC,
} from "../../utils/date-time.js";
import { getEpochNow } from "../../utils/date-time.js";

const {
  STRAVA_REFRESH_TOKEN = "",
  STRAVA_AUTHORIZE_CLIENT_ID = "",
  STRAVA_AUTHORIZE_CLIENT_SECRET = "",
} = process.env;

////
/// Types
//

interface StravaUrlParams {
  before?: number;
  after?: number;
  page?: number;
  per_page?: number;
}

type StravaStreamTypes = "latlng" | "distance" | "altitude" | "time";

interface StravaStream {
  type: StravaStreamTypes;
}

interface StravaActivityEntity {
  start_date_local: string;
  id: string;
  streams: {
    [key in StravaStreamTypes]?: StravaStream;
  };
}

////
/// Helpers
//

const getIdentifier = (entity: object) => (entity as StravaActivityEntity).id;

////
/// Exports
//

const authorizeEndpoint = "https://www.strava.com/oauth/authorize";
const tokenEndpoint = "https://www.strava.com/oauth/token";

const isReady = () => !!STRAVA_REFRESH_TOKEN;
const getApiName = () => "strava";
const getApiBaseUrl = () => "https://www.strava.com/api/v3/";
const getHistoricDelay = () => ONE_QUATER_IN_SEC;

let accessToken = "";
const getApiAuthHeaders = async () => {
  let tokenResponse: AxiosResponse;
  if (!accessToken) {
    tokenResponse = await axios.post(tokenEndpoint, {
      client_id: STRAVA_AUTHORIZE_CLIENT_ID,
      client_secret: STRAVA_AUTHORIZE_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    });
    accessToken = tokenResponse.data.access_token;
    const newRefreshToken = tokenResponse.data.refresh_token;
    envWrite("STRAVA_REFRESH_TOKEN", STRAVA_REFRESH_TOKEN, newRefreshToken);
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

const endpointsPrimary: (EpHistoric | EpSnapshot)[] = [
  {
    isHistoric: () => false,
    getEndpoint: () => "athlete",
    getDirName: () => "athlete",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "athlete/activities",
    getDirName: () => "athlete--activities",
    getParams: (): StravaUrlParams => ({
      before: getEpochNow(),
      after: getEpochNow() - ONE_DAY_IN_SEC * 2,
    }),
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricParams: (currentParams?: StravaUrlParams): StravaUrlParams => ({
      page: currentParams && currentParams.page ? currentParams.page + 1 : 1,
      per_page: 30,
    }),
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    parseDayFromEntity: (entity: object) =>
      (entity as StravaActivityEntity).start_date_local.split("T")[0] || "",
  },
];

const endpointsSecondary: EpSecondary[] = [
  {
    getDirName: () => "activities",
    getEndpoint: (entity: object) => `activities/${getIdentifier(entity)}`,
    getPrimary: () => "athlete/activities",
    getIdentifier,
  },
  {
    getDirName: () => "activities--streams",
    getParams: () => ({
      keys: "latlng,time,altitude,distance",
    }),
    getEndpoint: (entity: object) => {
      return `activities/${getIdentifier(entity)}/streams`;
    },
    getPrimary: () => "athlete/activities",
    getIdentifier,
  },
];

const handler: ApiHandler = {
  authorizeEndpoint,
  tokenEndpoint,
  isReady,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  getHistoricDelay,
  endpointsPrimary,
  endpointsSecondary,
};

export default handler;
