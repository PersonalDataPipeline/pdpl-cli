import { ONE_DAY_IN_SEC, ONE_YEAR_IN_SEC } from "../../utils/constants.js";
import { ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "../../utils/types.js";
import getConfig from "../../utils/config.js";
import { getFormattedDate } from "../../utils/date.js";

const { API_NINJAS_KEY = "" } = process.env;

////
/// Types
//

interface ApiNinjasHistoricParams {
  offset?: number;
  year?: string;
  month?: string;
  day?: string;
}

interface ApiNinjasHistoricEventEntity {
  year: string;
  month: string;
  day: string;
}

////
/// Helpers
//

const [todayYear, todayMonth, todayDay] = getFormattedDate().split("-");
const defaultParams = {
  year: todayYear,
  month: todayMonth,
  day: todayDay,
  offset: 0,
};

const parseDayFromEntity = (entity: ApiNinjasHistoricEventEntity) => {
  return `${entity.year}-${entity.month}-${entity.day}`;
};

////
/// Exports
//

const getApiName = () => "api-ninjas";
const getApiBaseUrl = () => "https://api.api-ninjas.com/v1/";
const getApiAuthHeaders = () => ({
  "X-Api-Key": API_NINJAS_KEY,
});
const getHistoricDelay = () => ONE_YEAR_IN_SEC;

const endpointsPrimary: ApiPrimaryEndpoint[] = [
  {
    getEndpoint: () => "historicalevents",
    getDirName: () => "historicalevents",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: () => 0,
    getHistoricParams: (
      params?: ApiNinjasHistoricParams,
      didReturnData?: boolean
    ): ApiNinjasHistoricParams => {
      if (params && "year" in params && "offset" in params) {
        return {
          year: didReturnData ? params.year : `${parseInt(params.year!, 10) - 1}`,
          offset: didReturnData ? params.offset! + 10 : 0,
        };
      }
      return {
        year: todayYear,
        offset: 0,
      };
    },
    shouldHistoricContinue: (responseData: object | [], params: object): boolean => {
      if (Object.keys(responseData).length) {
        return true;
      }

      const { originDate } = getConfig();
      const originYear = new Date(`${originDate}T00:00:00`);
      if (
        "year" in params &&
        parseInt(params.year as string, 10) > originYear.getFullYear()
      ) {
        return true;
      }

      return false;
    },
    parseDayFromEntity,
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
