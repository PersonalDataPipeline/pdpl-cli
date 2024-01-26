require("dotenv").config();
const http = require("http");

const { authorizeEndpoint, tokenEndpoint } = require("./index.js");
const { serverPort, serverCallback } = require("../../utils/authorizeApp.js");

const {
  STRAVA_AUTHORIZE_CLIENT_ID,
  STRAVA_AUTHORIZE_CLIENT_SECRET,
  STRAVA_REFRESH_TOKEN,
} = process.env;

http
  .createServer(serverCallback({
    checkState: true,
    clientId: STRAVA_AUTHORIZE_CLIENT_ID,
    clientSecret: STRAVA_AUTHORIZE_CLIENT_SECRET,
    refreshToken: STRAVA_REFRESH_TOKEN,
    refreshTokenEnvKey: "STRAVA_REFRESH_TOKEN",
    scope: "read_all,profile:read_all,activity:read_all",
    authorizeEndpoint,
    tokenEndpoint
  }))
  .listen(serverPort);
