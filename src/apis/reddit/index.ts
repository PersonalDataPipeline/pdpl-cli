import axios, { AxiosResponse } from "axios";
import { AuthorizeServerConfig } from "../../commands/api/authorize.js";
import { ONE_DAY_IN_SEC } from "../../utils/date-time.js";
import { ApiHandler, EpHistoric, EpSecondary, EpSnapshot } from "../../utils/types.js";
import { makeBasicAuth } from "../../utils/string.js";
import { envWrite } from "../../utils/fs.js";

const {
  REDDIT_AUTHORIZE_CLIENT_ID = "",
  REDDIT_AUTHORIZE_CLIENT_SECRET = "",
  REDDIT_REFRESH_TOKEN = "",
} = process.env;

////
/// Types
//

////
/// Helpers
//

////
/// Exports
//

const isReady = () => !!REDDIT_REFRESH_TOKEN;
const tokenEndpoint = "https://www.reddit.com/api/v1/access_token";
const getApiName = () => "reddit";
const getApiBaseUrl = () => "https://oauth.reddit.com/api/v1/";

let accessToken = "";
const getApiAuthHeaders = async () => {
  let tokenResponse: AxiosResponse;
  const basicAuth = makeBasicAuth(
    REDDIT_AUTHORIZE_CLIENT_ID,
    REDDIT_AUTHORIZE_CLIENT_SECRET
  );
  if (!accessToken) {
    tokenResponse = await axios.post(
      tokenEndpoint,
      `grant_type=refresh_token&refresh_token=${REDDIT_REFRESH_TOKEN}`,
      {
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (tokenResponse.data.error) {
      throw new Error(`Error during token refresh: ${tokenResponse.data.error}`);
    }

    accessToken = tokenResponse.data.access_token;
    const newRefreshToken = tokenResponse.data.refresh_token;
    envWrite("REDDIT_REFRESH_TOKEN", REDDIT_REFRESH_TOKEN, newRefreshToken);
  }

  return {
    Authorization: `bearer ${accessToken}`,
  };
};

const getAuthorizeConfig = (): AuthorizeServerConfig => ({
  checkState: true,
  clientId: REDDIT_AUTHORIZE_CLIENT_ID,
  clientSecret: REDDIT_AUTHORIZE_CLIENT_SECRET,
  basicAuth: true,
  formDataForToken: true,
  refreshToken: REDDIT_REFRESH_TOKEN,
  refreshTokenEnvKey: "REDDIT_REFRESH_TOKEN",
  scope: "identity flair history mysubreddits privatemessages read wikiread",
  authorizeEndpoint: "https://www.reddit.com/api/v1/authorize",
  tokenEndpoint: tokenEndpoint,
  authorizeParams: {
    duration: "permanent",
  },
});

const endpointsPrimary: (EpHistoric | EpSnapshot)[] = [
  {
    isHistoric: () => false,
    getEndpoint: () => `me`,
    getDirName: () => "me",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => false,
    getEndpoint: () => `trophies`,
    getDirName: () => "trophies",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => false,
    getEndpoint: () => `prefs`,
    getDirName: () => "prefs",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isHistoric: () => false,
    getEndpoint: () => `karma`,
    getDirName: () => "karma",
    getDelay: () => ONE_DAY_IN_SEC,
  },
];
const endpointsSecondary: EpSecondary[] = [];

const handler: ApiHandler = {
  isReady,
  getAuthorizeConfig,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary,
};

export default handler;
