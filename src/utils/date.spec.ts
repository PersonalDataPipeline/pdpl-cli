import { getFormattedDate } from "./date.js";

describe("Function: getFormattedDate", () => {
  it("returns the correctly formatted date", () => {
    const thisDate = new Date("1990-12-20T00:00:00");
    expect(getFormattedDate(0, thisDate)).toEqual("1990-12-20");
  });
  it("does not change the time zone", () => {
    const thisDate = new Date("1990-12-20T23:59:59");
    expect(getFormattedDate(0, thisDate)).toEqual("1990-12-20");
  });
  it("respects date adjustment for specific date", () => {
    const thisDate = new Date("2020-01-02 GMT-0800");
    expect(getFormattedDate(-1, thisDate)).toEqual("2020-01-01");
  });
});
