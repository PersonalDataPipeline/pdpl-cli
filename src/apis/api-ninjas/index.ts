import { ONE_DAY_IN_SEC, ONE_YEAR_IN_SEC } from "../../utils/date-time.js";
import { ApiHandler, EpChronological, EpSecondary } from "../../utils/types.js";
import getConfig from "../../utils/config.js";
import { getFormattedDate } from "../../utils/date-time.js";
import { isObjectWithKeys } from "../../utils/object.js";

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

const parseDayFromEntity = (entity: object) => {
  return (
    `${(entity as ApiNinjasHistoricEventEntity).year}-` +
    `${(entity as ApiNinjasHistoricEventEntity).month}-` +
    `${(entity as ApiNinjasHistoricEventEntity).day}`
  );
};

////
/// Exports
//

const isReady = () => !!API_NINJAS_KEY;
const getApiName = () => "api-ninjas";
const getApiBaseUrl = () => "https://api.api-ninjas.com/v1/";
const getApiAuthHeaders = async () => ({
  "X-Api-Key": API_NINJAS_KEY,
});

const endpointsPrimary: EpChronological[] = [
  {
    isChronological: () => true,
    getEndpoint: () => "historicalevents",
    getDirName: () => "historicalevents",
    getParams: () => defaultParams,
    getDelay: () => ONE_DAY_IN_SEC,
    getHistoricDelay: (continuation?) => (continuation ? 0 : ONE_YEAR_IN_SEC),
    getHistoricParams: (
      params?: ApiNinjasHistoricParams,
      responseDataRaw?: object | []
    ): ApiNinjasHistoricParams => {
      const didReturnData = isObjectWithKeys(responseDataRaw);
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
    shouldHistoricContinue: (responseDataRaw: object | [], params: object): boolean => {
      if (Object.keys(responseDataRaw).length === 10) {
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
