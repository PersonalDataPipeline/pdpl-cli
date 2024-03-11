import { AxiosResponse } from "axios";

import { adjustDateByDays, getFormattedDate } from "../../utils/date.js";
import { ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "../../utils/types.js";
import { MockAxiosResponse } from "../../utils/data.js";
import {
  HALF_HOUR_IN_SEC,
  ONE_DAY_IN_SEC,
  ONE_QUATER_IN_SEC,
} from "../../utils/constants.js";

const { OURA_AUTH_TOKEN = "" } = process.env;

////
/// Types
//

interface OuraEntity {
  day: string;
  timestamp: string;
}

interface OuraUrlParams {
  start_date?: string;
  end_date?: string;
}

interface OuraHeartRateUrlParams {
  start_datetime?: string;
  end_datetime?: string;
}

////
/// Helpers
//

const defaultParams: OuraUrlParams = {
  start_date: getFormattedDate(-31),
  end_date: getFormattedDate(-1),
};

const historicParams: OuraUrlParams = {
  start_date: getFormattedDate(-91),
  end_date: getFormattedDate(-1),
};

const getNextParams = (currentParams: OuraUrlParams): OuraUrlParams => ({
  start_date: getFormattedDate(-90, new Date(`${currentParams.start_date}T00:00:00`)),
  end_date: getFormattedDate(-90, new Date(`${currentParams.end_date}T00:00:00`)),
});

const startDateTime = adjustDateByDays(-3);
startDateTime.setHours(0, 0, 0, 0);

const endDateTime = adjustDateByDays(-1);
endDateTime.setHours(23, 59, 59, 999);

export const heartRateParams: OuraHeartRateUrlParams = {
  // Date/time returned from the API is always UTC,
  // even is a different timezone is indicated.
  start_datetime: startDateTime.toISOString(),
  end_datetime: endDateTime.toISOString(),
};

const parseDayFromEntity = (entity: OuraEntity) => entity.day;

const transformResponseData = (response: AxiosResponse | MockAxiosResponse): unknown =>
  response.data.data;

////
/// Exports
//

const getApiName = () => "oura";
const getApiBaseUrl = () => "https://api.ouraring.com/v2/";
const getApiAuthHeaders = async (): Promise<object> => {
  return await new Promise((resolver) => {
    resolver({
      Authorization: `Bearer ${OURA_AUTH_TOKEN}`,
    });
  });
};
const getHistoricDelay = () => ONE_QUATER_IN_SEC;

const endpointsPrimary: ApiPrimaryEndpoint[] = [
  {
    getEndpoint: () => "usercollection/workout",
    getDirName: () => "user--workouts",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/sleep",
    getDirName: () => "user--sleep",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/daily_stress",
    getDirName: () => "user--daily-stress",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/daily_readiness",
    getDirName: () => "user--daily-readiness",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/daily_activity",
    getDirName: () => "user--daily-activity",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/daily_spo2",
    getDirName: () => "user--daily-spo2",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/sleep_time",
    getDirName: () => "user--sleep-time",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams: () => historicParams,
    getNextParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    getEndpoint: () => "usercollection/heartrate",
    getDirName: () => "user--heartrate",
    getParams: () => heartRateParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams: () => heartRateParams,
    getNextParams: (currentParams: OuraHeartRateUrlParams): OuraHeartRateUrlParams => {
      const startDateTime = adjustDateByDays(
        -3,
        new Date(currentParams.start_datetime || "")
      );
      startDateTime.setHours(0, 0, 0, 0);

      const endDateTime = adjustDateByDays(
        -3,
        new Date(currentParams.end_datetime || "")
      );
      endDateTime.setHours(23, 59, 59, 999);

      return {
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
      };
    },
    parseDayFromEntity: (entity: OuraEntity) => entity.timestamp.split("T")[0],
    transformResponseData,
  },
];

const endpointsSecondary: ApiSecondaryEndpoint[] = [];

export {
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  getHistoricDelay,
  endpointsPrimary,
  endpointsSecondary,
};
