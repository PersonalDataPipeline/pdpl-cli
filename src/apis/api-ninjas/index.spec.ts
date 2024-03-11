import { padLeftZero } from "../../utils/string.js";
import { ApiPrimaryEndpoint } from "../../utils/types.js";
import * as apiNinjaHandler from "./index.js";

const todaysDate = new Date();

describe("Module: API Ninja API handler", () => {
  let epHandler: ApiPrimaryEndpoint;

  const defaultParams = {
    year: `${todaysDate.getFullYear()}`,
    month: `${padLeftZero(todaysDate.getMonth() + 1)}`,
    day: `${padLeftZero(todaysDate.getDate())}`,
    offset: 0,
  };

  beforeEach(() => {
    epHandler = apiNinjaHandler.endpointsPrimary.filter((handler) => {
      return handler.getEndpoint() === "historicalevents";
    })[0];
  });

  it("gets the correct default params", () => {
    // TODO: Setup test config with a known timezone
    expect(epHandler.getParams!()).toEqual(defaultParams);
  });

  it("gets the correct historic params", () => {
    // TODO: Setup test config with a known timezone
    expect(epHandler.getHistoricParams!()).toEqual({
      year: `${todaysDate.getFullYear()}`,
      offset: 0,
    });
  });

  it("calculates the correct next historic params when there is data", () => {
    // TODO: Setup test config with a known timezone
    expect(
      epHandler.getHistoricParams!(
        {
          year: `${todaysDate.getFullYear()}`,
          offset: 0,
        },
        true
      )
    ).toEqual({
      year: `${todaysDate.getFullYear()}`,
      offset: 10,
    });
  });

  it("calculates the correct next historic params when there is not data", () => {
    // TODO: Setup test config with a known timezone
    expect(
      epHandler.getHistoricParams!(
        {
          year: `${todaysDate.getFullYear()}`,
          offset: 0,
        },
        false
      )
    ).toEqual({
      year: `${todaysDate.getFullYear() - 1}`,
      offset: 0,
    });
  });
});
