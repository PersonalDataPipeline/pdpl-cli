import { AxiosResponse } from "axios";

import { getFormattedDate } from "../../utils/date.js";
import { ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "../../utils/types.js";
import { MockAxiosResponse } from "../../utils/data.js";

const { OURA_AUTH_TOKEN = "" } = process.env;

////
/// Types
//

interface OuraEntity {
  day: string;
  timestamp: string;
}

////
/// Helpers
//

const defaultParams = {
  start_date: getFormattedDate(-180),
  end_date: getFormattedDate(),
};

const historicParams = {
  start_date: "1900-01-01",
  end_date: getFormattedDate(),
};

const parseDayFromEntity = (entity: OuraEntity) => entity.day;

const transformResponseData = (response: AxiosResponse | MockAxiosResponse): unknown =>
  response.data.data;

const getNextParams = (data: { next_token?: string }): object => {
  return data.next_token ? { next_token: data.next_token } : {};
}

////
/// Exports
//

const getApiName = () => "oura";
const getApiBaseUrl = () => "https://api.ouraring.com/v2/";

const getApiAuthHeaders = () => ({
  Authorization: `Bearer ${OURA_AUTH_TOKEN}`,
});

const endpointsPrimary: ApiPrimaryEndpoint[] = [
  {
    getEndpoint: () => "usercollection/workout",
    getDirName: () => "user--workouts",
    getParams: () => defaultParams,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/sleep",
    getDirName: () => "user--sleep",
    getParams: () => defaultParams,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/daily_stress",
    getDirName: () => "user--daily-stress",
    getParams: () => defaultParams,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/daily_readiness",
    getDirName: () => "user--daily-readiness",
    getParams: () => defaultParams,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/daily_activity",
    getDirName: () => "user--daily-activity",
    getParams: () => defaultParams,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/daily_spo2",
    getDirName: () => "user--daily-spo2",
    getParams: () => defaultParams,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/sleep_time",
    getDirName: () => "user--sleep-time",
    getParams: () => defaultParams,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/heartrate",
    getDirName: () => "user--heartrate",
    getParams: () => ({
      // Date/time returned from the API is always UTC,
      // even is a different timezone is indicated.
      start_datetime: getFormattedDate(-3) + "T00:00:00-08:00",
      end_datetime: getFormattedDate(-1) + "T23:59:59-08:00",
    }),
    getHistoricParams: () => ({
      // Same as default
      start_datetime: getFormattedDate(-3) + "T00:00:00-08:00",
      end_datetime: getFormattedDate(-1) + "T23:59:59-08:00",
    }),
    // getNextParams: (data: { next_token?: string }, params?: object | null): object => {
    //   return data.next_token ? { next_token: data.next_token } : {};
    // },
    parseDayFromEntity: (entity: OuraEntity) => entity.timestamp.split("T")[0],
    transformResponseData,
  },
];

const endpointsSecondary: ApiSecondaryEndpoint[] = [];

export {
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary,
};
