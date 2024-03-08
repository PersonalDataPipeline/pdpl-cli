import { runDateUtc, getFormattedDate, adjustDateByDays } from "./date.js";

describe("Function: adjustDateByDays", () => {
  it("removes days correctly", () => {
    // TODO: Setup test config with a known timezone
    expect(adjustDateByDays(-5, new Date("2000-01-06T00:00:00")).toISOString()).toEqual(
      "2000-01-01T08:00:00.000Z"
    );
  });

  it("adds days correctly", () => {
    // TODO: Setup test config with a known timezone
    expect(adjustDateByDays(5, new Date("2000-01-06T00:00:00")).toISOString()).toEqual(
      "2000-01-11T08:00:00.000Z"
    );
  });
});

describe("Function: runDateUtc", () => {
  it("returns the same values when called multiple times", async () => {
    const startDate = runDateUtc();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(runDateUtc().time).toEqual(startDate.time);
    expect(runDateUtc().date).toEqual(startDate.date);
    expect(runDateUtc().dateTime).toEqual(startDate.dateTime);
    expect(runDateUtc().fileName).toEqual(startDate.fileName);
  });
});

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
