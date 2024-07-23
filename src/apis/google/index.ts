import axios, { AxiosResponse } from "axios";
import { importPKCS8, SignJWT } from "jose";
import { readFileSync } from "fs";
import { URLSearchParams } from "url";

import {
  ONE_DAY_IN_SEC,
  QUARTER_YEAR_IN_SEC,
  QUARTER_HOUR_IN_SEC,
  getFormattedDate,
} from "../../utils/date-time.js";
import {
  ApiHandler,
  EpChronological,
  EpSecondary,
  EpSnapshot,
} from "../../utils/types.js";
import { isObjectWithKeys } from "../../utils/object.js";

const {
  GOOGLE_KEYS_FILE_PATH = "",
  GOOGLE_SERVICE_ACCOUNT_EMAIL = "",
  GOOGLE_USER_EMAIL = "",
} = process.env;

////
/// Types
//

interface GoogleCredentials {
  private_key: string;
}

interface GoogleEventEntity {
  status: string;
  start: {
    dateTime: string;
    date: string;
  };
}

interface GoogleUrlParams {
  maxResults?: number;
  singleEvents?: boolean;
  timeMin?: string;
  timeMax?: string;
}

////
/// Helpers
//

// const getStandardNextCallParams = (
//   response: AxiosResponse,
//   params?: GoogleUrlParams
// ): GoogleUrlParams => {
//   return params && (response.data as object[]).length === 100
//     ? {
//         page: params.page ? params.page + 1 : 1,
//         per_page: 100,
//       }
//     : {};
// };

const parseDayFromEntity = (entity: object): string => {
  return (
    (entity as GoogleEventEntity).start.date ||
    (entity as GoogleEventEntity).start.dateTime.split("T")[0]
  );
};

const getDefaultParams = () => ({
  maxResults: 2500,
  singleEvents: true,
  timeMin: `${getFormattedDate(-30)}T00:00:00Z`,
  timeMax: `${getFormattedDate()}T00:00:00Z`,
});

////
/// Exports
//

let accessToken = "";
const tokenEndpoint = "https://oauth2.googleapis.com/token";

const isReady = () =>
  !!GOOGLE_KEYS_FILE_PATH && !!GOOGLE_SERVICE_ACCOUNT_EMAIL && !!GOOGLE_USER_EMAIL;
const getApiName = () => "google";
const getApiBaseUrl = () => "https://www.googleapis.com/calendar/v3/";

const getApiAuthHeaders = async () => {
  const jwtAlg = "RS256";
  let tokenResponse: AxiosResponse;

  if (!accessToken) {
    const googleCredentials = JSON.parse(
      readFileSync(GOOGLE_KEYS_FILE_PATH, { encoding: "utf8" })
    ) as GoogleCredentials;

    const privateKey = await importPKCS8(googleCredentials.private_key, jwtAlg);

    const jwt = await new SignJWT({
      scope: "https://www.googleapis.com/auth/calendar",
      sub: GOOGLE_USER_EMAIL,
    })
      .setProtectedHeader({ alg: jwtAlg })
      .setIssuedAt()
      .setIssuer(GOOGLE_SERVICE_ACCOUNT_EMAIL)
      .setAudience(tokenEndpoint)
      .setExpirationTime("10mins")
      .sign(privateKey);

    tokenResponse = await axios.post(
      tokenEndpoint,
      new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    accessToken = tokenResponse.data.access_token;
  }

  return {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
};

const endpointsPrimary: (EpChronological | EpSnapshot)[] = [
  {
    isChronological: () => true,
    getEndpoint: () => `calendars/${GOOGLE_USER_EMAIL}/events`,
    getDirName: () => "calendar--events",
    getDelay: () => ONE_DAY_IN_SEC,
    getParams: getDefaultParams,
    parseDayFromEntity,
    getHistoricDelay: (continuation?: boolean) =>
      continuation ? QUARTER_HOUR_IN_SEC : QUARTER_YEAR_IN_SEC,
    getHistoricParams: (currentParams?: GoogleUrlParams): GoogleUrlParams => {
      const params: GoogleUrlParams = {
        ...getDefaultParams(),
        timeMin: `${getFormattedDate(-365)}T00:00:01Z`,
      };
      if (currentParams && currentParams.timeMin) {
        params.timeMin = `${getFormattedDate(-365, new Date(currentParams.timeMin))}T00:00:01Z`;
        params.timeMax = currentParams.timeMin.replace("T00:00:01Z", "T00:00:00Z");
      }
      return params;
    },
    transformResponseData: (response: AxiosResponse) =>
      response.data.items.filter((event: GoogleEventEntity) => {
        return event.status !== "cancelled" && isObjectWithKeys(event.start);
      }),
  },
];
const endpointsSecondary: EpSecondary[] = [];

const handler: ApiHandler = {
  isReady,
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary,
};

export default handler;
