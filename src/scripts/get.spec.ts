import { run } from "./get.js";
import logger from "../utils/logger.class.js";

vi.mock("../utils/logger.class.js");

describe("Script: Get API data", () => {
  beforeEach(() => {});

  it("fails with a logged error if no API name was included", async () => {
    await run([], logger);
    expect(logger.error).toHaveBeenCalled();
    expect(logger.shutdown).toHaveBeenCalled();
  });

  it("fails with a logged error if no API name was not found", async () => {
    await run(["", "", "UNKNOWN_API_NAME"], logger);
    expect(logger.error).toHaveBeenCalled();
    expect(logger.shutdown).toHaveBeenCalled();
  });
});
