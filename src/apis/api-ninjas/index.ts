import {
  HALF_HOUR_IN_SEC,
  ONE_DAY_IN_SEC,
  ONE_YEAR_IN_SEC,
} from "../../utils/constants.js";
import { ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "../../utils/types.js";

const { API_NINJAS_KEY = "" } = process.env;

////
/// Types
//

interface ApiNinjasHistoricEventEntity {
  year: string;
  month: string;
  day: string;
}

////
/// Helpers
//

const defaultParams = {
  year: 2022,
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
    getHistoricDelay: () => HALF_HOUR_IN_SEC,
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
