import axios, { AxiosResponse } from "axios";
import { AuthorizeServerConfig } from "../../commands/api/authorize.js";
import {
  getFormattedDate,
  ONE_DAY_IN_SEC,
  QUARTER_HOUR_IN_SEC,
} from "../../utils/date-time.js";
import { ApiHandler, EpChronological, EpSnapshot } from "../../utils/types.js";
import { makeBasicAuth } from "../../utils/string.js";
import { envWrite } from "../../utils/fs.js";

const {
  REDDIT_AUTHORIZE_CLIENT_ID = "",
  REDDIT_AUTHORIZE_CLIENT_SECRET = "",
  REDDIT_REFRESH_TOKEN = "",
  REDDIT_USER_NAME = "",
} = process.env;

////
/// Types
//

interface RedditListingResponse {
  data: {
    after: string;
    children: [];
  };
}

interface RedditListingEntity {
  data: {
    created: number;
    subreddit_subscribers?: number;
    upvote_ratio?: number;
    ups?: number;
    score?: number;
    body_html?: string;
    selftext_html?: string;
  };
}

interface RedditListingParams {
  limit?: number;
  after?: string;
}

////
/// Helpers
//

////
/// Exports
//

const isReady = () => !!REDDIT_REFRESH_TOKEN || !!REDDIT_USER_NAME;
const tokenEndpoint = "https://www.reddit.com/api/v1/access_token";
const getApiName = () => "reddit";
const getApiBaseUrl = () => "https://oauth.reddit.com/";

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

const listingEndpointHandler = {
  getDelay: () => ONE_DAY_IN_SEC,
  getParams: () => ({ limit: 100 }),
  transformResponseData: (entity: object) => {
    const { children } = ((entity as AxiosResponse).data as RedditListingResponse).data;
    children.map((listing) => {
      delete (listing as RedditListingEntity).data.subreddit_subscribers;
      delete (listing as RedditListingEntity).data.upvote_ratio;
      delete (listing as RedditListingEntity).data.ups;
      delete (listing as RedditListingEntity).data.score;
      delete (listing as RedditListingEntity).data.body_html;
      delete (listing as RedditListingEntity).data.selftext_html;
    });
    return children;
  },
  parseDayFromEntity: (entity: object) => {
    const { created } = (entity as RedditListingEntity).data;
    return getFormattedDate(0, new Date(created * 1000));
  },
  getHistoricParams: (
    currentParams?: RedditListingParams,
    responseDataRaw?: object
  ): RedditListingParams => {
    const params: RedditListingParams = {
      limit: currentParams?.limit || 100,
    };

    const { after } = (responseDataRaw as RedditListingResponse)?.data || {};
    if (after) {
      params.after = after;
    }

    return params;
  },
  getHistoricDelay: () => QUARTER_HOUR_IN_SEC,
  shouldHistoricContinue: (responseDataRaw: object | []) =>
    !!(responseDataRaw as RedditListingResponse).data.after,
};

const endpointsPrimary: (EpChronological | EpSnapshot)[] = [
  {
    isChronological: () => true,
    getEndpoint: () => `user/${REDDIT_USER_NAME}/comments`,
    getDirName: () => "user--comments",
    ...listingEndpointHandler,
  },
  {
    isChronological: () => true,
    getEndpoint: () => `user/${REDDIT_USER_NAME}/submitted`,
    getDirName: () => "user--submitted",
    ...listingEndpointHandler,
  },
  {
    isChronological: () => false,
    getEndpoint: () => `api/v1/me`,
    getDirName: () => "me",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isChronological: () => false,
    getEndpoint: () => `api/v1/trophies`,
    getDirName: () => "trophies",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isChronological: () => false,
    getEndpoint: () => `api/v1/prefs`,
    getDirName: () => "prefs",
    getDelay: () => ONE_DAY_IN_SEC,
  },
  {
    isChronological: () => false,
    getEndpoint: () => `api/v1/karma`,
    getDirName: () => "karma",
    getDelay: () => ONE_DAY_IN_SEC,
  },
];

const handler: ApiHandler = {
  isReady,
  getAuthorizeConfig,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary: [],
};

export default handler;
