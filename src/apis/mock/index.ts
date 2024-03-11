import { AxiosResponse } from "axios";

import { ApiPrimaryEndpoint, ApiSecondaryEndpoint } from "../../utils/types.js";
import { MockAxiosResponse } from "../../utils/data.js";
import { ONE_DAY_IN_SEC } from "../../utils/constants.js";

////
/// Types
//

interface MockEntity {
  day: string;
  date: string;
}

////
/// Helpers
//

const parseDayFromEntity = (entity: MockEntity) => entity.date;

const transformResponseData = (response: AxiosResponse | MockAxiosResponse): unknown =>
  response.data.data;

////
/// Exports
//

const getApiName = () => "mock";
const getApiBaseUrl = () => "https://www.joshcanhelp.com/api/";
const getApiAuthHeaders = () => ({
  Authorization: `Bearer AUTH_TOKEN_HERE`,
});

const endpointsPrimary: ApiPrimaryEndpoint[] = [
  {
    getEndpoint: () => "api-getter-mock.json",
    getDirName: () => "main",
    getDelay: () => ONE_DAY_IN_SEC,
    parseDayFromEntity,
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
