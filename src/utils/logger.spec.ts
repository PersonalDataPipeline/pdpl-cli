import type { Mock } from "vitest";

import logger, { InfoEntry, SuccessEntry } from "./logger.js";
import { runDateUtc } from "./date-time.js";
import { ensureOutputPath, writeFile } from "./fs.js";

vi.mock("./config.js", () => ({
  default: () => ({
    outputDir: "/output/dir",
    debugLogOutput: false,
  }),
}));

vi.mock("./fs.js", () => ({
  ensureOutputPath: vi.fn(),
  writeFile: vi.fn(),
}));

const mockInfoLog: InfoEntry = {
  message: "INFO_MESSAGE",
  stage: "other",
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

    it("checks the correct path", () => {
      expect(ensureOutputPath).toBeCalledWith(["_runs"]);
    });

    it("generates the correct file path", () => {
      expect(writeFileCall[0]).toEqual(`/output/dir/_runs/${runDateUtc().fileName}.json`);
    });

    it("generates the correct log content", () => {
      const logObject = JSON.parse(writeFileCall[1]) as { entries: object[] };
      expect(logObject.entries[0]).toMatchObject({
        stage: "other",
        message: "INFO_MESSAGE",
        type: "info",
      });
    });
  });

  describe("success log", () => {
    let writeFileCall: string[];
    beforeEach(() => {
      logger.setApiName("API_NAME");
      logger.success(mockSuccessLog);
      logger.shutdown();
      writeFileCall = (writeFile as Mock).mock.calls[0] as [];
    });

    it("checks the correct path", () => {
      expect(ensureOutputPath).toBeCalledWith(["API_NAME", "_runs"]);
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
