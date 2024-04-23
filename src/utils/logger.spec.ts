import type { Mock } from "vitest";

import logger, { InfoEntry, SuccessEntry } from "./logger.js";
import { runDateUtc } from "./date-time.js";
import { writeFile } from "./fs.js";

vi.mock("./config.js", () => ({
  default: () => ({
    outputDir: "/output/dir",
  }),
}));

vi.mock("./fs.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./fs.js")>()),
  writeFile: vi.fn(),
}));

vi.mock("fs");

const mockInfoLog: InfoEntry = {
  message: "INFO_MESSAGE",
};

const mockSuccessLog: SuccessEntry = {
  endpoint: "mock/endpoint",
  filesWritten: 12,
  filesSkipped: 11,
  total: 20,
  days: 10,
};

describe("Logger", () => {
  beforeEach(() => {
    (writeFile as Mock).mockReset();
  });

  describe("info log", () => {
    let writeFileCall: string[];
    beforeEach(() => {
      logger.info(mockInfoLog);
      logger.shutdown();
      writeFileCall = (writeFile as Mock).mock.calls[0] as [];
    });

    it("generates the correct file path", () => {
      expect(writeFileCall[0]).toEqual(`/output/dir/_runs/${runDateUtc().fileName}.json`);
    });

    it("generates the correct log content", () => {
      const logObject = JSON.parse(writeFileCall[1]) as { entries: object[] };
      expect(logObject.entries[0]).toMatchObject({
        message: "INFO_MESSAGE",
        type: "info",
      });
    });
  });

  describe("success log", () => {
    let writeFileCall: string[];
    beforeEach(() => {
      logger.success(mockSuccessLog);
      logger.shutdown("API_NAME");
      writeFileCall = (writeFile as Mock).mock.calls[0] as [];
    });

    it("generates the correct file path", () => {
      expect(writeFileCall[0]).toEqual(
        `/output/dir/API_NAME/_runs/${runDateUtc().fileName}.json`
      );
    });

    it("generates the correct log content", () => {
      const logObject = JSON.parse(writeFileCall[1]) as { entries: object[] };
      expect(logObject.entries[0]).toMatchObject({
        type: "success",
        endpoint: "mock/endpoint",
        filesWritten: 12,
        filesSkipped: 11,
        total: 20,
        days: 10,
      });
    });
  });
});
