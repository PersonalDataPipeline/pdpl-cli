import { AxiosResponse } from "axios";

import { getFormattedDate } from "../../utils/date.js";
import { ApiHandler } from "../../utils/types.js";

const { OURA_AUTH_TOKEN = "" } = process.env;

////
/// Types
//

interface OuraEntity {
  day: string;
  timestamp: string;
  [key: string]: any;
}

////
/// Helpers
//

const defaultParams = {
  start_date: getFormattedDate(-180),
  end_date: getFormattedDate(),
};

const parseDayFromEntity = (entity: OuraEntity) => entity.day;

const transformResponse = (apiResponse: AxiosResponse) => [
  apiResponse.data.data,
  apiResponse.headers,
];

////
/// Exports
//

const getApiName = () => "oura";
const getApiBaseUrl = () => "https://api.ouraring.com/v2/";

const getApiAuthHeaders = () => ({
  Authorization: `Bearer ${OURA_AUTH_TOKEN}`,
});

const endpoints = [
  {
    getEndpoint: () => "usercollection/workout",
    getDirName: () => "user--workouts",
    getParams: () => defaultParams,
    parseDayFromEntity,
    transformResponse,
  },
  {
    getEndpoint: () => "usercollection/sleep",
    getDirName: () => "user--sleep",
    getParams: () => defaultParams,
    parseDayFromEntity,
    transformResponse,
  },
  {
    getEndpoint: () => "usercollection/daily_stress",
    getDirName: () => "user--daily-stress",
    getParams: () => defaultParams,
    parseDayFromEntity,
    transformResponse,
  },
  {
    getEndpoint: () => "usercollection/daily_readiness",
    getDirName: () => "user--daily-readiness",
    getParams: () => defaultParams,
    parseDayFromEntity,
    transformResponse,
  },
  {
    getEndpoint: () => "usercollection/daily_activity",
    getDirName: () => "user--daily-activity",
    getParams: () => defaultParams,
    parseDayFromEntity,
    transformResponse,
  },
  {
    getEndpoint: () => "usercollection/daily_spo2",
    getDirName: () => "user--daily-spo2",
    getParams: () => defaultParams,
    parseDayFromEntity,
    transformResponse,
  },
  {
    getEndpoint: () => "usercollection/sleep_time",
    getDirName: () => "user--sleep-time",
    getParams: () => defaultParams,
    parseDayFromEntity,
    transformResponse,
  },
  {
    getEndpoint: () => "usercollection/heartrate",
    getDirName: () => "user--heartrate",
    getParams: () => ({
      // Date/time returned from the API is always UTC,
      // even is a different timezone is indicated.
      start_datetime: getFormattedDate(-5) + "T00:00:00-08:00",
      end_datetime: getFormattedDate(-1) + "T23:59:59-08:00",
    }),
    parseDayFromEntity: (entity: OuraEntity) =>
      getFormattedDate(0, new Date(entity.timestamp)),
    transformResponse,
  },
];

export { getApiName, getApiBaseUrl, getApiAuthHeaders, endpoints };

const handler: ApiHandler = {
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpoints,
};

export default handler;
