import type { Mock } from "vitest";

import getConfig from "./config.js";
import { ONE_DAY_IN_SEC, ONE_HOUR_IN_SEC } from "./date-time.js";
import { runDateUtc } from "./date-time.js";
import { makeDirectory, pathExists, readFile, writeFile } from "./fs.js";
import logger from "./logger.js";

vi.mock("./fs.js", () => ({
  __dirname: "",
  ensureOutputPath: vi.fn(),
  pathExists: vi.fn(() => true),
  readFile: vi.fn(() => "[]"),
  writeFile: vi.fn(),
  makeDirectory: vi.fn(),
}));

import * as queue from "./queue.js";
import { ApiHandler, EpSnapshot } from "./types.js";

const outputDir = getConfig().outputDir;
const queueFilePath = `${outputDir}/API_NAME/_queue.json`;

const mockApiHandler: ApiHandler = {
  isReady: vi.fn(() => true),
  getApiName: vi.fn(() => "API_NAME"),
  getApiBaseUrl: vi.fn(() => "API_BASE_URL"),
  getApiAuthHeaders: vi.fn(async () => ({})),
  getHistoricDelay: vi.fn(() => ONE_HOUR_IN_SEC),
  endpointsPrimary: [
    {
      isHistoric: vi.fn(() => false),
      getEndpoint: vi.fn(() => "API_ENDPOINT"),
      getDirName: () => "API_DIRECTORY",
      getDelay: () => ONE_DAY_IN_SEC,
    } as EpSnapshot,
  ],
  endpointsSecondary: [],
};

const missingEndpoint: queue.QueueEntry = {
  endpoint: "API_ENDPOINT",
  runAfter: ONE_DAY_IN_SEC + runDateUtc().seconds,
  historic: false,
  params: {},
};

const mockHistoricEntry = {
  endpoint: "this/endpoint",
  runAfter: 1234567890,
  historic: true,
  params: {
    params1: "value1",
  },
};

const mockStandardEntry = {
  endpoint: "this/endpoint",
  runAfter: 1234567890,
  historic: false,
  params: {},
};

const mockOtherEntry = {
  endpoint: "this/endpoint",
  runAfter: 1234567890,
  historic: false,
  params: {
    params1: "value1",
  },
};

describe("Class: Queue", () => {
  beforeEach(() => {
    global.console.log = vi.fn();
  });

  it("looks for a queue file when a new instance is created", () => {
    queue.loadQueue(mockApiHandler);
    expect(pathExists).toHaveBeenCalledWith(queueFilePath);
  });

  describe("queue file does not exist", () => {
    beforeAll(() => {
      (pathExists as Mock).mockImplementation(() => false);
      queue.loadQueue(mockApiHandler);
    });

    it("checks the write path", () => {
      expect(makeDirectory).toHaveBeenCalled();
    });

    it("creates the queue file", () => {
      expect(writeFile).toHaveBeenCalledWith(queueFilePath, "[]");
    });

    it("returns an empty queue", () => {
      expect(queue.getQueue()).toEqual([]);
    });
  });

  describe("queue file exists", () => {
    beforeAll(() => {
      (pathExists as Mock).mockImplementation(() => true);
      (readFile as Mock).mockImplementation(() => '[{"test": true}]');
      queue.loadQueue(mockApiHandler);
    });

    it("reads the existing queue file", () => {
      expect(readFile).toHaveBeenCalledWith(queueFilePath);
    });

    it("returns the queue contents", () => {
      expect(queue.getQueue()).toEqual([{ test: true }]);
    });
  });

  describe("queue management", () => {
    beforeEach(() => {
      (readFile as Mock).mockImplementation(() => "[]");
      queue.loadQueue(mockApiHandler);
    });

    it("is initiated as an empty queue", () => {
      expect(queue.getQueue()).toEqual([]);
    });

    it("entries are added and retrieved as expected", () => {
      queue.addEntry(mockHistoricEntry);
      queue.addEntry(mockStandardEntry);
      expect(queue.getQueue()).toEqual([
        mockHistoricEntry,
        { ...mockStandardEntry, historic: false, params: {} },
      ]);
    });
  });

  describe("queue processing", () => {
    beforeEach(() => {
      (readFile as Mock).mockImplementation(() => "[]");
      queue.loadQueue(mockApiHandler);
    });

    it("adds handled endpoints to the queue", () => {
      queue.processQueue(mockApiHandler, logger);
      expect(queue.getQueue()).toEqual([missingEndpoint]);
    });

    it("returns added endpoints", () => {
      const runQueue = queue.processQueue(mockApiHandler, logger);
      expect(runQueue).toEqual([
        {
          endpoint: missingEndpoint.endpoint,
          historic: missingEndpoint.historic,
          params: missingEndpoint.params,
        },
      ]);
    });

    it("does not return endpoints scheduled for the future", () => {
      // First call returns the missing endpoint
      queue.processQueue(mockApiHandler, logger);
      // Second call skips the existing endpoint
      const runQueue = queue.processQueue(mockApiHandler, logger);
      expect(runQueue).toEqual([]);
    });

    it("removes unknown endpoints", () => {
      queue.addEntry({
        endpoint: "UNKNOWN_ENDPOINT",
        runAfter: 1234567890,
      });
      queue.processQueue(mockApiHandler, logger);
      expect(queue.getQueue()).toEqual([missingEndpoint]);
    });
  });

  describe("entry management", () => {
    beforeEach(() => {
      (readFile as Mock).mockImplementation(() => "[]");
      queue.loadQueue(mockApiHandler);
    });

    it("finds no standard entries in an empty queue", () => {
      expect(queue.hasStandardEntryFor("this/endpoint")).toEqual(false);
    });

    it("finds no historic entries in an empty queue", () => {
      expect(queue.hasHistoricEntryFor("this/endpoint")).toEqual(false);
    });

    describe("finds standard entries", () => {
      beforeEach(() => {
        queue.addEntry(mockStandardEntry);
      });

      it("finds a standard entry", () => {
        expect(queue.hasStandardEntryFor("this/endpoint")).toEqual(true);
      });
    });

    describe("finds historic entries", () => {
      beforeEach(() => {
        queue.addEntry(mockHistoricEntry);
      });

      it("finds a historic entry", () => {
        expect(queue.hasHistoricEntryFor("this/endpoint")).toEqual(true);
      });
    });

    describe("no standard or historic entries", () => {
      beforeEach(() => {
        queue.addEntry(mockOtherEntry);
        queue.addEntry(mockOtherEntry);
        queue.addEntry(mockOtherEntry);
      });

      it("does not find a standard entry", () => {
        expect(queue.hasStandardEntryFor("this/endpoint")).toEqual(false);
      });

      it("does not find a historic entry", () => {
        expect(queue.hasHistoricEntryFor("this/endpoint")).toEqual(false);
      });
    });
  });
});
