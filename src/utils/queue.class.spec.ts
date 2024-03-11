import getConfig from "./config.js";
import { pathExists, readFile, writeFile, ensureOutputPath } from "./fs.js";
jest.mock("./fs.js", () => ({
  ensureOutputPath: jest.fn(),
  pathExists: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

import Queue from "./queue.class.js";

const outputDir = getConfig().outputDir;
const queueFilePath = `${outputDir}/API_NAME/_queue.json`;

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
};

const mockOtherEntry = {
  endpoint: "this/endpoint",
  runAfter: 1234567890,
  params: {
    params1: "value1",
  },
};

describe("Class: Queue", () => {
  it("looks for a queue file when a new instance is created", () => {
    new Queue("API_NAME");
    expect(pathExists).toHaveBeenCalledWith(queueFilePath);
  });

  describe("queue file does not exist", () => {
    let queue: Queue;

    beforeAll(() => {
      (pathExists as jest.Mock).mockImplementation(() => false);
      queue = new Queue("API_NAME");
    });

    it("checks the write path", () => {
      expect(ensureOutputPath).toHaveBeenCalledWith(["API_NAME"]);
    });

    it("creates the queue file", () => {
      expect(writeFile).toHaveBeenCalledWith(queueFilePath, "[]");
    });

    it("returns an empty queue", () => {
      expect(queue.getQueue()).toEqual([]);
    });
  });

  describe("queue file exists", () => {
    let queue: Queue;

    beforeAll(() => {
      (pathExists as jest.Mock).mockImplementation(() => true);
      (readFile as jest.Mock).mockImplementation(() => '[{"test": true}]');
      queue = new Queue("API_NAME");
    });

    it("reads the existing queue file", () => {
      expect(readFile).toHaveBeenCalledWith(queueFilePath);
    });

    it("returns the queue contents", () => {
      expect(queue.getQueue()).toEqual([{ test: true }]);
    });
  });

  describe("queue management", () => {
    let queue: Queue;

    beforeEach(() => {
      (readFile as jest.Mock).mockImplementation(() => "[]");
      queue = new Queue("API_NAME");
      (writeFile as jest.Mock).mockClear();
      (ensureOutputPath as jest.Mock).mockClear();
    });

    it("is initiated as an empty queue", () => {
      expect(queue.getQueue()).toEqual([]);
    });

    it("entries are added and retrieved as expected", () => {
      queue.addEntry(mockHistoricEntry);
      expect(queue.getQueue()).toEqual([mockHistoricEntry]);
    });

    it("clears the queue when getting it", () => {
      queue.addEntry(mockHistoricEntry);
      queue.getQueue();
      expect(queue.getQueue()).toEqual([]);
      expect(writeFile).toHaveBeenCalled();
    });
  });

  describe("entry management", () => {
    let queue: Queue;

    beforeEach(() => {
      (readFile as jest.Mock).mockImplementation(() => "[]");
      queue = new Queue("API_NAME");
    });

    it("finds no standard entries in an empty queue", () => {
      expect(queue.hasStandardEntryFor("this/endpoint")).toEqual(false);
    });

    it("finds no historic entries in an empty queue", () => {
      expect(queue.hasHistoricEntryFor("this/endpoint")).toEqual(false);
    });

    describe("finds entries", () => {
      beforeEach(() => {
        queue.addEntry(mockStandardEntry);
        queue.addEntry(mockHistoricEntry);
        queue.addEntry(mockOtherEntry);
      });

      it("finds a standard entry", () => {
        expect(queue.hasStandardEntryFor("this/endpoint")).toEqual(true);
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
