import axios, { AxiosResponse } from "axios";

import { envWrite } from "../../utils/fs.js";
import { ApiHandler, EpHistoric, EpSecondary, EpSnapshot } from "../../utils/types.js";
import {
  HALF_HOUR_IN_SEC,
  ONE_DAY_IN_SEC,
  QUARTER_YEAR_IN_SEC,
} from "../../utils/date-time.js";
import { AuthorizeServerConfig } from "../../commands/api/authorize.js";

const {
  WAHOO_AUTHORIZE_CLIENT_ID = "",
  WAHOO_AUTHORIZE_CLIENT_SECRET = "",
  WAHOO_REFRESH_TOKEN = "",
} = process.env;

////
/// Types
//

interface WahooUrlParams {
  page?: number;
  per_page?: number;
}

interface WahooWorkoutEntity {
  created_at: string;
  id: number;
}

////
/// Exports
//

const tokenEndpoint = "https://api.wahooligan.com/oauth/token";

const isReady = () =>
  !!WAHOO_AUTHORIZE_CLIENT_ID && !!WAHOO_AUTHORIZE_CLIENT_SECRET && !!WAHOO_REFRESH_TOKEN;
const getApiName = () => "wahoo";
const getApiBaseUrl = () => "https://api.wahooligan.com/v1/";

let accessToken = "";
const getApiAuthHeaders = async () => {
  if (!WAHOO_REFRESH_TOKEN) {
    console.log("❌ No Wahoo refresh token stored. See README for more information.");
    process.exit(1);
  }

  let tokenResponse: AxiosResponse;
  if (!accessToken) {
    tokenResponse = await axios.post(tokenEndpoint, {
      client_id: WAHOO_AUTHORIZE_CLIENT_ID,
      client_secret: WAHOO_AUTHORIZE_CLIENT_SECRET,
      refresh_token: WAHOO_REFRESH_TOKEN,
      grant_type: "refresh_token",
    });
    accessToken = tokenResponse.data.access_token;
    const newRefreshToken = tokenResponse.data.refresh_token;
    envWrite("WAHOO_REFRESH_TOKEN", newRefreshToken, WAHOO_REFRESH_TOKEN);
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

const getAuthorizeConfig = (): AuthorizeServerConfig => ({
  checkState: true,
  clientId: WAHOO_AUTHORIZE_CLIENT_ID,
  clientSecret: WAHOO_AUTHORIZE_CLIENT_SECRET,
  refreshToken: WAHOO_REFRESH_TOKEN,
  refreshTokenEnvKey: "WAHOO_REFRESH_TOKEN",
  scope: "workouts_read plans_read power_zones_read offline_data user_read",
  authorizeEndpoint: "https://api.wahooligan.com/oauth/authorize",
  tokenEndpoint: tokenEndpoint,
});

const endpointsPrimary: (EpHistoric | EpSnapshot)[] = [
  {
    isHistoric: () => false,
    getEndpoint: () => "user",
    getDirName: () => "user",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "workouts",
    getDirName: () => "workouts",
    getParams: (): WahooUrlParams => ({
      page: 1,
      per_page: 10,
    }),
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricParams: (currentParams?: WahooUrlParams): WahooUrlParams => ({
      page: currentParams && currentParams.page ? currentParams.page + 1 : 1,
      per_page: 30,
    }),
    getHistoricDelay: (continuation?: boolean) =>
      continuation ? HALF_HOUR_IN_SEC : QUARTER_YEAR_IN_SEC,
    parseDayFromEntity: (entity: object) =>
      (entity as WahooWorkoutEntity).created_at.split("T")[0],
    transformResponseData: (response: AxiosResponse, existingData?: object | []) => {
      existingData = existingData ? existingData : [];
      return [...(response.data as { workouts: [] }).workouts, ...(existingData as [])];
    },
  },
];
const endpointsSecondary: EpSecondary[] = [];

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
