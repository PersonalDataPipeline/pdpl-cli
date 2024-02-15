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
  year: 1979,
  offset: 110
};

const parseDayFromEntity = (entity: ApiNinjasHistoricEventEntity) => {
  return `${entity.year}-${entity.month}-${entity.day}`
};

////
/// Exports
//

const getApiName = () => "api-ninjas";
const getApiBaseUrl = () => "https://api.api-ninjas.com/v1/";

const getApiAuthHeaders = () => ({
  "X-Api-Key": API_NINJAS_KEY,
});

const endpointsPrimary: ApiPrimaryEndpoint[] = [
  {
    getEndpoint: () => "historicalevents",
    getDirName: () => "historicalevents",
    getParams: () => defaultParams,
    parseDayFromEntity,
  }
];

const endpointsSecondary: ApiSecondaryEndpoint[] = [];

export {
  getApiName,
  getApiBaseUrl,
  getApiAuthHeaders,
  endpointsPrimary,
  endpointsSecondary,
};
