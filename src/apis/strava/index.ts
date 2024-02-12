import axios, { AxiosResponse } from "axios";

import { envWrite } from "../../utils/fs.js";

const {
  STRAVA_REFRESH_TOKEN = "",
  STRAVA_AUTHORIZE_CLIENT_ID = "",
  STRAVA_AUTHORIZE_CLIENT_SECRET = "",
} = process.env;

////
/// Types
//

type StravaStreamTypes = "latlng" | "distance" | "altitude" | "time";

interface StravaStream {
  type: StravaStreamTypes;
  [key: string]: unknown;
}

interface StravaActivityEntity {
  start_date_local: string;
  id: string;
  streams: {
    [key in StravaStreamTypes]?: StravaStream;
  };
}

////
/// Exports
//

const authorizeEndpoint = "https://www.strava.com/oauth/authorize";
const tokenEndpoint = "https://www.strava.com/oauth/token";

const getApiName = () => "strava";
const getApiBaseUrl = () => "https://www.strava.com/api/v3/";

let accessToken = "";
const getApiAuthHeaders = async () => {
  if (!STRAVA_REFRESH_TOKEN) {
    console.log(
      "❌ No Strava refresh token stored. See README for more information."
    );
    process.exit();
  }

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

const endpoints = [
  {
    getEndpoint: () => "athlete",
    getDirName: () => "athlete",
  },
  {
    getEndpoint: () => "athlete/activities",
    getDirName: () => "athlete--activities",
    getParams: () => ({
      before: Math.floor(Date.now() / 1000),
      after: 0,
      page: 1,
      per_page: 50,
    }),
    parseDayFromEntity: (entity: StravaActivityEntity) =>
      entity.start_date_local.split("T")[0] || "",
    enrichEntity: [
      {
        getEndpoint: (entity: StravaActivityEntity) => `activities/${entity.id}`,
        enrichEntity: (response: AxiosResponse) => response.data,
      },
      {
        getParams: () => ({
          keys: "latlng,time,altitude,distance",
        }),
        getEndpoint: (entity: StravaActivityEntity) =>
          `activities/${entity.id}/streams`,
        enrichEntity: (response: AxiosResponse, entity: StravaActivityEntity) => {
          entity.streams = {};
          const responseStreams = response.data as [StravaStream];
          responseStreams.forEach((stream: StravaStream) => {
            entity.streams[stream.type] = stream;
          });
          return entity;
        },
      },
    ],
  },
];

export {
  authorizeEndpoint,
  tokenEndpoint,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpoints,
};
