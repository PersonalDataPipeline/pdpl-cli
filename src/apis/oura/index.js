const path = require("path");
const { getFormattedDate } = require("../../utils/date");

const apiName = "oura";

const defaultParams = {
  start_date: getFormattedDate(-180),
  end_date: getFormattedDate(),
};

const apiDirName = (endpoint) => path.join(apiName, endpoint);
const parseDayFromEntity = (singleItem) => singleItem.day;
const transformResponse = (apiResponse) => [
  apiResponse.data.data,
  apiResponse.headers,
];

module.exports = {
  getApiBaseUrl: () => "https://api.ouraring.com/v2/",
  getApiAuthHeaders: () => ({
    Authorization: `Bearer ${process.env.OURA_AUTH_TOKEN}`,
  }),
  endpoints: {
    "usercollection/workout": {
      getDirName: () => apiDirName("user--workouts"),
      getParams: () => defaultParams,
      parseDayFromEntity,
      transformResponse,
    },
    "usercollection/sleep": {
      getDirName: () => apiDirName("user--sleep"),
      getParams: () => defaultParams,
      parseDayFromEntity,
      transformResponse,
    },
    "usercollection/daily_stress": {
      getDirName: () => apiDirName("user--daily-stress"),
      getParams: () => defaultParams,
      parseDayFromEntity,
      transformResponse,
    },
    "usercollection/daily_readiness": {
      getDirName: () => apiDirName("user--daily-readiness"),
      getParams: () => defaultParams,
      parseDayFromEntity,
      transformResponse,
    },
    "usercollection/daily_activity": {
      getDirName: () => apiDirName("user--daily-activity"),
      getParams: () => defaultParams,
      parseDayFromEntity,
      transformResponse,
    },
    "usercollection/daily_spo2": {
      getDirName: () => apiDirName("user--daily-spo2"),
      getParams: () => defaultParams,
      parseDayFromEntity,
      transformResponse,
    },
    "usercollection/sleep_time": {
      getDirName: () => apiDirName("user--sleep-time"),
      getParams: () => defaultParams,
      parseDayFromEntity,
      transformResponse,
    },
    "usercollection/heartrate": {
      getDirName: () => apiDirName("user--heartrate"),
      getParams: () => ({
        // Date/time returned from the API is always UTC,
        // even is a different timezone is indicated.
        start_datetime: getFormattedDate(-5) + "T00:00:00-08:00",
        end_datetime: getFormattedDate(-1) + "T23:59:59-08:00",
      }),
      parseDayFromEntity: (singleItem) =>
        getFormattedDate(0, new Date(singleItem.timestamp)),
      transformResponse,
    },
  },
};
