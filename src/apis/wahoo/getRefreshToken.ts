import * as http from "http";
import { config } from "dotenv";
config();

import { authorizeEndpoint, tokenEndpoint } from "./index.js";
import { serverPort, serverCallback } from "../../utils/authorize-app.js";

const {
  WAHOO_AUTHORIZE_CLIENT_ID = "",
  WAHOO_AUTHORIZE_CLIENT_SECRET = "",
  WAHOO_REFRESH_TOKEN = "",
} = process.env;

if (!WAHOO_AUTHORIZE_CLIENT_ID) {
  console.log("❌ No Wahoo Client ID stored. See README for more information.");
  process.exit(1);
}

if (!WAHOO_AUTHORIZE_CLIENT_SECRET) {
  console.log("❌ No Wahoo Client Secret stored. See README for more information.");
  process.exit(1);
}

http
  .createServer(
    serverCallback({
      checkState: true,
      clientId: WAHOO_AUTHORIZE_CLIENT_ID,
      clientSecret: WAHOO_AUTHORIZE_CLIENT_SECRET,
      refreshToken: WAHOO_REFRESH_TOKEN,
      refreshTokenEnvKey: "WAHOO_REFRESH_TOKEN",
      scope: "workouts_read plans_read power_zones_read offline_data user_read",
      authorizeEndpoint,
      tokenEndpoint,
    })
  )
  .listen(serverPort);
