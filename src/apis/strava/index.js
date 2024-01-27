const axios = require("axios");
const path = require("path");

const { envWrite } = require("../../utils/fs");

let accessToken = "";

const authorizeEndpoint = "https://www.strava.com/oauth/authorize";
const tokenEndpoint = "https://www.strava.com/oauth/token";

const {
  STRAVA_REFRESH_TOKEN,
  STRAVA_AUTHORIZE_CLIENT_ID,
  STRAVA_AUTHORIZE_CLIENT_SECRET,
} = process.env;

const apiBaseUrl = "https://www.strava.com/api/v3/";

const getApiAuthHeaders = async () => {
  if (!STRAVA_REFRESH_TOKEN) {
    console.log(
      "❌ No Strava refresh token stored. See README for more information."
    );
    process.exit();
  }

  let tokenResponse = {};
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

module.exports = {
  authorizeEndpoint,
  tokenEndpoint,
  getApiBaseUrl: () => apiBaseUrl,
  getApiAuthHeaders,
  endpoints: {
    "athlete": {
      getDirName: () => "athlete",
    },
    "athlete/activities": {
      getDirName: () => "athlete--activities",
      getParams: () => ({
        before: Math.floor(Date.now() / 1000),
        after: 0,
        page: 1,
        per_page: 50,
      }),
      parseDayFromEntity: (singleItem) => singleItem.start_date_local.split("T")[0],
      enrichEntity: [
        {
          getEndpoint: (entity) => `activities/${entity.id}`,
          enrichEntity: (entity, response) => response.data
        },
        {
          getParams: (entity) => ({
            keys: "latlng,time,altitude,distance",
          }),
          getEndpoint: (entity) => `activities/${entity.id}/streams`,
          enrichEntity: (entity, response) => {
            entity.streams = {};
            response.data.forEach((stream) => {
              entity.streams[stream.type] = stream;
            });
            return entity;
          }
        },
      ]
    },
  },
};
