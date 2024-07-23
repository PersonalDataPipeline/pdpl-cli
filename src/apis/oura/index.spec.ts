import { getFormattedDate } from "../../utils/date-time.js";
import { EpChronological } from "../../utils/types.js";
import ouraHandler from "./index.js";

describe("Module: Oura API handler", () => {
  describe("Heartrate endpoint", () => {
    let epHandler: EpChronological;

    beforeEach(() => {
      epHandler = ouraHandler.endpointsPrimary.filter((handler) => {
        return handler.getEndpoint() === "usercollection/heartrate";
      })[0] as EpChronological;
    });

    it("gets the correct default params", () => {
      // TODO: Setup test config with a known timezone
      expect(epHandler.getParams!()).toEqual({
        start_datetime: `${getFormattedDate(-3)}T07:00:00.000Z`,
        end_datetime: `${getFormattedDate()}T06:59:59.999Z`,
      });
    });

    it("gets the correct historic params", () => {
      // TODO: Setup test config with a known timezone
      expect(epHandler.getHistoricParams()).toEqual({
        start_datetime: `${getFormattedDate(-3)}T07:00:00.000Z`,
        end_datetime: `${getFormattedDate()}T06:59:59.999Z`,
      });
    });

    it("calculates the correct next params", () => {
      // TODO: Setup test config with a known timezone
      expect(epHandler.getHistoricParams(epHandler.getParams!())).toEqual({
        start_datetime: `${getFormattedDate(-6)}T07:00:00.000Z`,
        end_datetime: `${getFormattedDate(-3)}T06:59:59.999Z`,
      });
    });

    it("calculates the day", () => {
      expect(
        epHandler.parseDayFromEntity({ timestamp: "2024-03-18T00:36:14+00:00" })
      ).toEqual("2024-03-17");
      expect(
        epHandler.parseDayFromEntity({ timestamp: "2024-03-18T09:36:14+00:00" })
      ).toEqual("2024-03-18");
    });
  });

  describe("Workouts endpoint", () => {
    let epHandler: EpChronological;

    beforeEach(() => {
      epHandler = ouraHandler.endpointsPrimary.filter((handler) => {
        return handler.getEndpoint() === "usercollection/workout";
      })[0] as EpChronological;
    });

    it("gets the correct default params", () => {
      // TODO: Setup test config with a known timezone
      expect(epHandler.getParams!()).toEqual({
        start_date: `${getFormattedDate(-31)}`,
        end_date: `${getFormattedDate(-1)}`,
      });
    });

    it("gets the correct historic params", () => {
      // TODO: Setup test config with a known timezone
      expect(epHandler.getHistoricParams()).toEqual({
        start_date: `${getFormattedDate(-91)}`,
        end_date: `${getFormattedDate(-1)}`,
      });
    });

    it("calculates the correct next params", () => {
      // TODO: Setup test config with a known timezone
      expect(epHandler.getHistoricParams(epHandler.getHistoricParams())).toEqual({
        start_date: `${getFormattedDate(-181)}`,
        end_date: `${getFormattedDate(-91)}`,
      });
    });
  });
});
