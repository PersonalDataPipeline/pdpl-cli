const axios = require("axios");
const { envStringReplace } = require("../../utils/fs");

let accessToken = "";

const authorizeUrl = "https://www.strava.com/oauth/authorize";
const tokenUrl = "https://www.strava.com/oauth/token";

const { 
  STRAVA_REFRESH_TOKEN,
  STRAVA_AUTHORIZE_CLIENT_ID,
  STRAVA_AUTHORIZE_CLIENT_SECRET 
} = process.env;

module.exports = {
  authorizeUrl,
  tokenUrl,
  getApiBaseUrl: () => "https://www.strava.com/api/v3/",
  getApiAuthHeaders: async () => {
    if (!STRAVA_REFRESH_TOKEN) {
      console.log("❌ No Strava refresh token stored. See README for more information.");
      process.exit();
    }

    let tokenResponse = {};
    if (!accessToken) {
      tokenResponse = await axios.post(
        tokenUrl, 
        {
          client_id: STRAVA_AUTHORIZE_CLIENT_ID,
          client_secret: STRAVA_AUTHORIZE_CLIENT_SECRET,
          refresh_token: STRAVA_REFRESH_TOKEN,
          grant_type: "refresh_token",
        }
      );
      accessToken = tokenResponse.data.access_token;
      const newRefreshToken = tokenResponse.data.refresh_token;
      envStringReplace("STRAVA_REFRESH_TOKEN", STRAVA_REFRESH_TOKEN, newRefreshToken);
    }

    return {
      Authorization: `Bearer ${accessToken}`
    }
  },
}