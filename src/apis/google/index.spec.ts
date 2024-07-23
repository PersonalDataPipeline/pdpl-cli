import { EpChronological } from "../../utils/types.js";
import googleHandler from "./index.js";

describe("Module: Google API handler", () => {
  let epHandler: EpChronological;

  beforeEach(() => {
    vi.useFakeTimers();
    const date = new Date(2000, 0, 31, 0, 0, 0);
    vi.setSystemTime(date);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultParams = {
    maxResults: 2500,
    singleEvents: true,
    timeMin: `2000-01-01T00:00:00Z`,
    timeMax: `2000-01-31T00:00:00Z`,
  };

  describe("Endpoint: Calendar events", () => {
    beforeEach(() => {
      epHandler = googleHandler.endpointsPrimary.filter((handler) => {
        return handler.getDirName() === "calendar--events";
      })[0] as EpChronological;
    });

    it("gets the correct default params", () => {
      // TODO: Setup test config with a known timezone
      expect(epHandler.getParams!()).toEqual(defaultParams);
    });

    it("gets the correct historic params", () => {
      // TODO: Setup test config with a known timezone
      expect(epHandler.getHistoricParams()).toEqual({
        maxResults: 2500,
        singleEvents: true,
        timeMin: `1999-01-31T00:00:01Z`,
        timeMax: `2000-01-31T00:00:00Z`,
      });
    });

    it("calculates the correct next historic params when there is data", () => {
      // TODO: Setup test config with a known timezone
      expect(
        epHandler.getHistoricParams({
          maxResults: 2500,
          singleEvents: true,
          timeMin: `1999-01-31T00:00:01Z`,
        })
      ).toEqual({
        maxResults: 2500,
        singleEvents: true,
        timeMin: `1998-01-30T00:00:01Z`,
        timeMax: `1999-01-31T00:00:00Z`,
      });
    });
  });
});
