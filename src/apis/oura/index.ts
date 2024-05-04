import { AxiosResponse } from "axios";

import { adjustDateByDays, getFormattedDate } from "../../utils/date-time.js";
import { ApiHandler, EpHistoric, EpSecondary, EpSnapshot } from "../../utils/types.js";
import {
  HALF_HOUR_IN_SEC,
  ONE_DAY_IN_SEC,
  ONE_QUATER_IN_SEC,
} from "../../utils/date-time.js";

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

const getHistoricParams = (currentParams?: OuraUrlParams): OuraUrlParams => {
  if (currentParams) {
    return {
      start_date: getFormattedDate(-90, new Date(`${currentParams.start_date}T00:00:00`)),
      end_date: getFormattedDate(-90, new Date(`${currentParams.end_date}T00:00:00`)),
    };
  }
  return {
    start_date: getFormattedDate(-91),
    end_date: getFormattedDate(-1),
  };
};

const getHeartrateParams = (params?: OuraHeartRateUrlParams): OuraHeartRateUrlParams => {
  let startDateTime, endDateTime;
  if (params) {
    startDateTime = adjustDateByDays(-3, new Date(params.start_datetime || ""));
    endDateTime = adjustDateByDays(-3, new Date(params.end_datetime || ""));
  } else {
    startDateTime = adjustDateByDays(-3);
    endDateTime = adjustDateByDays(-1);
  }
  startDateTime.setHours(0, 0, 0, 0);
  endDateTime.setHours(23, 59, 59, 999);

  return {
    // Date/time returned from the API is always UTC,
    // even is a different timezone is indicated.
    start_datetime: startDateTime.toISOString(),
    end_datetime: endDateTime.toISOString(),
  };
};

const parseDayFromEntity = (entity: object) => (entity as OuraEntity).day;

const transformResponseData = (
  response: AxiosResponse,
  existingData?: object | []
): [] => {
  existingData = existingData ? existingData : [];
  return [...(existingData as []), ...(response.data as { data: [] }).data];
};

const getNextCallParams = (response?: AxiosResponse): object => {
  if (response && response.data && response.data.next_token) {
    return { next_token: response.data.next_token };
  }
  return {};
};

////
/// Exports
//

const isReady = () => !!OURA_AUTH_TOKEN;
const getApiName = () => "oura";
const getApiBaseUrl = () => "https://api.ouraring.com/v2/";
const getApiAuthHeaders = async () => ({
  Authorization: `Bearer ${OURA_AUTH_TOKEN}`,
});
const getHistoricDelay = (continuation?: boolean) =>
  continuation ? HALF_HOUR_IN_SEC : ONE_QUATER_IN_SEC;

const endpointsPrimary: (EpHistoric | EpSnapshot)[] = [
  {
    isHistoric: () => true,
    getEndpoint: () => "usercollection/workout",
    getDirName: () => "user--workouts",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay,
    getHistoricParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "usercollection/sleep",
    getDirName: () => "user--sleep",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
    getHistoricParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "usercollection/daily_stress",
    getDirName: () => "user--daily-stress",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay,
    getHistoricParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "usercollection/daily_readiness",
    getDirName: () => "user--daily-readiness",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay,
    getHistoricParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "usercollection/daily_activity",
    getDirName: () => "user--daily-activity",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay,
    getHistoricParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "usercollection/daily_spo2",
    getDirName: () => "user--daily-spo2",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay,
    getHistoricParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "usercollection/sleep_time",
    getDirName: () => "user--sleep-time",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay,
    getHistoricParams,
    parseDayFromEntity,
    transformResponseData,
  },
  {
    isHistoric: () => true,
    getEndpoint: () => "usercollection/heartrate",
    getDirName: () => "user--heartrate",
    getParams: getHeartrateParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricParams: getHeartrateParams,
    parseDayFromEntity: (entity: object) => {
      return getFormattedDate(0, new Date((entity as OuraEntity).timestamp));
    },
    getHistoricDelay,
    transformResponseData,
    getNextCallParams,
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
