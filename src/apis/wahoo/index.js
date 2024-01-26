const axios = require("axios");
const path = require("path");

const { envWrite } = require("../../utils/fs");

let accessToken = "";

const authorizeEndpoint = "https://api.wahooligan.com/oauth/authorize";
const tokenEndpoint = "https://api.wahooligan.com/oauth/token";

const {
  WAHOO_AUTHORIZE_CLIENT_ID,
  WAHOO_AUTHORIZE_CLIENT_SECRET,
  WAHOO_REFRESH_TOKEN,
} = process.env;

const apiName = "wahoo";
const apiBaseUrl = "https://api.wahooligan.com/v1/";

const apiDirName = (endpoint) => path.join(apiName, endpoint);

const getApiAuthHeaders = async () => {
  if (!WAHOO_REFRESH_TOKEN) {
    console.log(
      "❌ No Wahoo refresh token stored. See README for more information."
    );
    process.exit();
  }

  let tokenResponse = {};
  if (!accessToken) {
    tokenResponse = await axios.post(tokenEndpoint, {
      client_id: WAHOO_AUTHORIZE_CLIENT_ID,
      client_secret: WAHOO_AUTHORIZE_CLIENT_SECRET,
      refresh_token: WAHOO_REFRESH_TOKEN,
      grant_type: "refresh_token",
    });
    accessToken = tokenResponse.data.access_token;
    const newRefreshToken = tokenResponse.data.refresh_token;
    envWrite("WAHOO_REFRESH_TOKEN", WAHOO_REFRESH_TOKEN, newRefreshToken);
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
    
  },
};
