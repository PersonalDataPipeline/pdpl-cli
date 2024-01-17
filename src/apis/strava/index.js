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

const defaultParams = {
  before: Math.floor(Date.now() / 1000),
  after: 0,
  per_page: 100,
};

const defaultSuccessHandler = (responseData) => {
  const dailyData = {};
  const items = responseData.data;
  items.forEach((item) => {
    item.day = item.start_date_local.split("T")[0];
    if (!dailyData[item.day]) {
      dailyData[item.day] = [];
    }
    dailyData[item.day].push(item);
  });
  return [
    dailyData,
    {
      total: items.length,
      days: Object.keys(dailyData).length,
    },
  ];
};

const apiDirName = (endpoint) => path.join(apiName, endpoint);

module.exports = {
  authorizeUrl,
  tokenUrl,
  getApiBaseUrl: () => "https://www.strava.com/api/v3/",
  getApiAuthHeaders: async () => {
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
      envWrite(
        "STRAVA_REFRESH_TOKEN",
        STRAVA_REFRESH_TOKEN,
        newRefreshToken
      );
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  },
  endpoints: {
    "athlete/activities": {
      getDirName: () => apiDirName("athlete--activities"),
      getParams: () => defaultParams,
      successHandler: defaultSuccessHandler,
    },
  }
};
