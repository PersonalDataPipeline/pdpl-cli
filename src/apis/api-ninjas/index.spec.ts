import { padLeftZero } from "../../utils/string.js";
import { EpHistoric } from "../../utils/types.js";
import apiNinjaHandler from "./index.js";

const todaysDate = new Date();

describe("Module: API Ninja API handler", () => {
  let epHandler: EpHistoric;

  const defaultParams = {
    year: `${todaysDate.getFullYear()}`,
    month: `${padLeftZero(todaysDate.getMonth() + 1)}`,
    day: `${padLeftZero(todaysDate.getDate())}`,
    offset: 0,
  };

  beforeEach(() => {
    epHandler = apiNinjaHandler.endpointsPrimary.filter((handler) => {
      return handler.getEndpoint() === "historicalevents";
    })[0] as EpHistoric;
  });

  it("gets the correct default params", () => {
    // TODO: Setup test config with a known timezone
    expect(epHandler.getParams!()).toEqual(defaultParams);
  });

  it("gets the correct historic params", () => {
    // TODO: Setup test config with a known timezone
    expect(epHandler.getHistoricParams()).toEqual({
      year: `${todaysDate.getFullYear()}`,
      offset: 0,
    });
  });

  it("calculates the correct next historic params when there is data", () => {
    // TODO: Setup test config with a known timezone
    expect(
      epHandler.getHistoricParams(
        {
          year: `${todaysDate.getFullYear()}`,
          offset: 0,
        },
        ["data"]
      )
    ).toEqual({
      year: `${todaysDate.getFullYear()}`,
      offset: 10,
    });
  });

  it("calculates the correct next historic params when there is not data", () => {
    // TODO: Setup test config with a known timezone
    expect(
      epHandler.getHistoricParams(
        {
          year: `${todaysDate.getFullYear()}`,
          offset: 0,
        },
        []
      )
    ).toEqual({
      year: `${todaysDate.getFullYear() - 1}`,
      offset: 0,
    });
  });

  it("does not continue by default", () => {
    expect(epHandler.shouldHistoricContinue!([], {})).toEqual(false);
  });

  it("continues when there is full data set", () => {
    const tenThings = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(epHandler.shouldHistoricContinue!(tenThings, {})).toEqual(true);
  });

  it("continues when there are still years left before origin", () => {
    expect(epHandler.shouldHistoricContinue!([], { year: 2023 })).toEqual(true);
  });

  it("does not continue when there are no more years left", () => {
    expect(epHandler.shouldHistoricContinue!([], { year: 1899 })).toEqual(false);
  });
});
