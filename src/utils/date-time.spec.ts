import {
  runDateUtc,
  getFormattedDate,
  adjustDateByDays,
  getFormattedTime,
} from "./date-time.js";

describe("Function: adjustDateByDays", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2000, 0, 6, 0, 0, 0));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("removes days correctly", () => {
    expect(adjustDateByDays(-5).getDate()).toEqual(1);
  });

  it("adds days correctly", () => {
    expect(adjustDateByDays(5).getDate()).toEqual(11);
  });
});

describe("Function: runDateUtc", () => {
  it("returns the same values when called multiple times", async () => {
    const startDate = runDateUtc();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(runDateUtc().seconds).toEqual(startDate.seconds);
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

describe("Function: getFormattedTime", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2000, 0, 6, 13, 2, 54));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("returns the correctly formatted time", () => {
    expect(getFormattedTime()).toEqual("13:03:54");
  });
});
