import axios, { AxiosResponse } from "axios";

import { envWrite } from "../../utils/fs.js";
import {
  ApiHandler,
  EpChronological,
  EpSecondary,
  EpSnapshot,
} from "../../utils/types.js";
import {
  HALF_HOUR_IN_SEC,
  ONE_DAY_IN_SEC,
  QUARTER_YEAR_IN_SEC,
  ONE_WEEK_IN_SEC,
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

const getIdentifier = (entity1: object | number) => (entity1 as StravaActivityEntity).id;

////
/// Exports
//

const tokenEndpoint = "https://www.strava.com/oauth/token";

const isReady = () => !!STRAVA_REFRESH_TOKEN;
const getApiName = () => "strava";
const getApiBaseUrl = () => "https://www.strava.com/api/v3/";

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

const getAuthorizeConfig = () => ({
  checkState: true,
  clientId: STRAVA_AUTHORIZE_CLIENT_ID,
  clientSecret: STRAVA_AUTHORIZE_CLIENT_SECRET,
  refreshToken: STRAVA_REFRESH_TOKEN,
  refreshTokenEnvKey: "STRAVA_REFRESH_TOKEN",
  scope: "read_all,profile:read_all,activity:read_all",
  authorizeEndpoint: "https://www.strava.com/oauth/authorize",
  tokenEndpoint: tokenEndpoint,
});

const endpointsPrimary: (EpChronological | EpSnapshot)[] = [
  {
    isChronological: () => false,
    getEndpoint: () => "athlete",
    getDirName: () => "athlete",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isChronological: () => true,
    getEndpoint: () => "athlete/activities",
    getDirName: () => "athlete--activities",
    getParams: (): StravaUrlParams => ({
      before: getEpochNow(),
      after: getEpochNow() - ONE_WEEK_IN_SEC,
    }),
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricParams: (currentParams?: StravaUrlParams): StravaUrlParams => ({
      page: currentParams && currentParams.page ? currentParams.page + 1 : 1,
      per_page: 30,
    }),
    getHistoricDelay: (continuation?: boolean) =>
      continuation ? HALF_HOUR_IN_SEC : QUARTER_YEAR_IN_SEC,
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
    getEndpoint: (entity: object) => `activities/${getIdentifier(entity)}/streams`,
    getPrimary: () => "athlete/activities",
    getIdentifier,
  },
];

const handler: ApiHandler = {
  getAuthorizeConfig,
  isReady,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary,
};

export default handler;
