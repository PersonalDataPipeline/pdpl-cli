const axios = require("axios");
const path = require("path");

const { envWrite } = require("../../utils/fs");

let accessToken = "";

const authorizeUrl = "https://www.strava.com/oauth/authorize";
const tokenUrl = "https://www.strava.com/oauth/token";

const {
  STRAVA_REFRESH_TOKEN,
  STRAVA_AUTHORIZE_CLIENT_ID,
  STRAVA_AUTHORIZE_CLIENT_SECRET,
} = process.env;

const apiName = "strava";
const apiBaseUrl = "https://www.strava.com/api/v3/";

const apiDirName = (endpoint) => path.join(apiName, endpoint);

const getApiAuthHeaders = async () => {
  if (!STRAVA_REFRESH_TOKEN) {
    console.log(
      "❌ No Strava refresh token stored. See README for more information."
    );
    process.exit();
  }

  let tokenResponse = {};
  if (!accessToken) {
    tokenResponse = await axios.post(tokenUrl, {
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

const enrichActivity = async (activity) => {
  const headers = await getApiAuthHeaders();
  try {
    activityResponse = await axios.get(`${apiBaseUrl}/activities/${item.id}`, {
      headers,
    });
  } catch (error) {
    console.log(`❌ Error getting activity detail for ${item.id}: ${error.message}`);
    return activity;
  }

  actvity = activityResponse.data;

  let streamsResponse = { data: [] };
  try {
    streamsResponse = await axios.get(
      `${apiBaseUrl}/activities/${item.id}/streams`,
      {
        params: {
          keys: "latlng,time,altitude,distance",
        },
        headers,
      }
    );
  } catch (error) {
    console.log(`❌ Error getting stream detail for ${item.id}: ${error.message}`);
    return activity;
  }

  actvity.streams = {};
  streamsResponse.data.forEach((stream) => {
    actvity.streams[stream.type] = stream;
  });
  return actvity;
};

module.exports = {
  authorizeUrl,
  tokenUrl,
  getApiBaseUrl: () => apiBaseUrl,
  getApiAuthHeaders,
  endpoints: {
    "athlete": {
      getDirName: () => apiDirName("athlete"),
      getParams: () => ({}),
    },
    "athlete/activities": {
      getDirName: () => apiDirName("athlete--activities"),
      getParams: () => ({
        before: Math.floor(Date.now() / 1000),
        after: 0,
        page: 1,
        per_page: 2,
      }),
      parseResponseToDays: (singleItem) => singleItem.start_date_local.split("T")[0],
    },
  },
};
