import * as http from "http";
import { config } from "dotenv";
config();

import redditHandler from "./index.js";
import { serverPort, serverCallback } from "../../utils/authorize-app.js";

const {
  REDDIT_AUTHORIZE_CLIENT_ID = "",
  REDDIT_AUTHORIZE_CLIENT_SECRET = "",
  REDDIT_REFRESH_TOKEN = "",
} = process.env;

http
  .createServer(
    serverCallback({
      checkState: true,
      clientId: REDDIT_AUTHORIZE_CLIENT_ID,
      clientSecret: REDDIT_AUTHORIZE_CLIENT_SECRET,
      basicAuth: true,
      refreshToken: REDDIT_REFRESH_TOKEN,
      refreshTokenEnvKey: "REDDIT_REFRESH_TOKEN",
      scope: "identity, flair, history, mysubreddits, privatemessages, read, wikiread",
      authorizeEndpoint: redditHandler.authorizeEndpoint!,
      tokenEndpoint: redditHandler.tokenEndpoint!,
      authorizeParams: {
        duration: "permanent",
      },
    })
  )
  .listen(serverPort);
