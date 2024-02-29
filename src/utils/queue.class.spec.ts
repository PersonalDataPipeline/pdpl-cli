import getConfig from "./config.js";
import { pathExists, readFile, writeFile } from "./fs.js";
jest.mock("./fs.js", () => ({
  pathExists: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

import Queue from "./queue.class.js";

const outputDir = getConfig().outputDir;
const queueFilePath = `${outputDir}/API_NAME/_queue.json`;

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

  describe("entry management", () => {
    let queue: Queue;

    beforeEach(() => {
      (pathExists as jest.Mock).mockImplementation(() => false);
      queue = new Queue("API_NAME");
      (writeFile as jest.Mock).mockClear();
    });

    it("returns undefined when queue is empty", () => {
      expect(queue.getEntry()).toEqual(undefined);
    });

    it("removes the entry from the queue", () => {
      queue.addStandardEntry(1709169289129);
      expect(queue.getQueue().length).toEqual(1);
      queue.getEntry();
      expect(queue.getQueue().length).toEqual(0);
    });

    describe("standard", () => {
      const testEntry = {
        type: "standard",
        apiName: "API_NAME",
        nextRun: 1709169289129,
      };

      beforeEach(() => {
        queue.addStandardEntry(1709169289129);
      });

      it("writes the queue file", () => {
        expect(writeFile).toHaveBeenCalledWith(
          queueFilePath,
          JSON.stringify([testEntry], null, 2)
        );
      });

      it("adds an entry to the queue", () => {
        expect(queue.getQueue()).toEqual([testEntry]);
      });

      it("returns the added entry", () => {
        expect(queue.getEntry()).toEqual(testEntry);
      });
    });

    describe("error", () => {
      const testEntry = {
        type: "error",
        apiName: "API_NAME",
        endpoint: "TEST_ENDPOINT",
        retryCount: 2,
      };

      beforeEach(() => {
        queue.addErrorEntry("TEST_ENDPOINT", 2);
      });

      it("writes the queue file", () => {
        expect(writeFile).toHaveBeenCalledWith(
          queueFilePath,
          JSON.stringify([testEntry], null, 2)
        );
      });

      it("adds an entry to the queue", () => {
        expect(queue.getQueue()).toEqual([testEntry]);
      });

      it("returns the added entry", () => {
        expect(queue.getEntry()).toEqual(testEntry);
      });
    });

    describe("historical", () => {
      const testEntry = {
        type: "historical",
        apiName: "API_NAME",
        endpoints: [
          {
            endpoint: "TEST_ENDPOINT",
            params: "param1=test&param2=test",
          },
        ],
      };

      beforeEach(() => {
        queue.addHistoricalEntry([
          {
            endpoint: "TEST_ENDPOINT",
            params: "param1=test&param2=test",
          },
        ]);
      });

      it("writes the queue file", () => {
        expect(writeFile).toHaveBeenCalledWith(
          queueFilePath,
          JSON.stringify([testEntry], null, 2)
        );
      });

      it("adds an entry to the queue", () => {
        expect(queue.getQueue()).toEqual([testEntry]);
      });

      it("returns the added entry", () => {
        expect(queue.getEntry()).toEqual(testEntry);
      });
    });
  });
});
