import * as http from "http";
import { config } from "dotenv";
config();

import { authorizeEndpoint, tokenEndpoint } from "./index.js";
import { serverPort, serverCallback } from "../../utils/authorize-app.js";

const {
  STRAVA_AUTHORIZE_CLIENT_ID = "",
  STRAVA_AUTHORIZE_CLIENT_SECRET = "",
  STRAVA_REFRESH_TOKEN = "",
} = process.env;

http
  .createServer(
    serverCallback({
      checkState: true,
      clientId: STRAVA_AUTHORIZE_CLIENT_ID,
      clientSecret: STRAVA_AUTHORIZE_CLIENT_SECRET,
      refreshToken: STRAVA_REFRESH_TOKEN,
      refreshTokenEnvKey: "STRAVA_REFRESH_TOKEN",
      scope: "read_all,profile:read_all,activity:read_all",
      authorizeEndpoint,
      tokenEndpoint,
    })
  )
  .listen(serverPort);
