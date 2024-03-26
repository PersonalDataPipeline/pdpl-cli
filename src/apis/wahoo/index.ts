import axios, { AxiosResponse } from "axios";

import { envWrite } from "../../utils/fs.js";
import { ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "../../utils/types.js";
import { MockAxiosResponse } from "../../utils/api-data.js";
import { ONE_DAY_IN_SEC, ONE_QUATER_IN_SEC } from "../../utils/date-time.js";

const { WAHOO_AUTHORIZE_CLIENT_ID, WAHOO_AUTHORIZE_CLIENT_SECRET, WAHOO_REFRESH_TOKEN } =
  process.env;

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

const authorizeEndpoint = "https://api.wahooligan.com/oauth/authorize";
const tokenEndpoint = "https://api.wahooligan.com/oauth/token";

const getApiName = () => "wahoo";
const getApiBaseUrl = () => "https://api.wahooligan.com/v1/";
const getHistoricDelay = () => ONE_QUATER_IN_SEC;

let accessToken = "";
const getApiAuthHeaders = async () => {
  if (!WAHOO_REFRESH_TOKEN) {
    console.log("❌ No Wahoo refresh token stored. See README for more information.");
    process.exit();
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

const endpointsPrimary: ApiPrimaryEndpoint[] = [
  {
    getEndpoint: () => "user",
    getDirName: () => "user",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
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
    getHistoricDelay: () => 0,
    parseDayFromEntity: (entity: WahooWorkoutEntity) => entity.created_at.split("T")[0],
    transformResponseData: (
      response: AxiosResponse | MockAxiosResponse,
      existingData?: object | []
    ) => {
      existingData = existingData ? existingData : [];
      return [...(response.data as { workouts: [] }).workouts, ...(existingData as [])];
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
