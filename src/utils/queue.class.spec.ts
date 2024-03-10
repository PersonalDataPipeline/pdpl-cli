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

  describe("entry management", () => {
    let queue: Queue;
    const mockRunEntry = {
      endpoint: "this/endpoint",
      runAfter: 1234567890,
      historic: true,
      params: {
        params1: "value1",
      },
    };

    beforeEach(() => {
      (pathExists as jest.Mock).mockImplementation(() => false);
      queue = new Queue("API_NAME");
      (writeFile as jest.Mock).mockClear();
      (ensureOutputPath as jest.Mock).mockClear();
    });

    it("is initiated as an empty queue", () => {
      expect(queue.getQueue()).toEqual([]);
    });

    it("entries are added and retrieved as expected", () => {
      queue.addEntry(mockRunEntry);
      expect(queue.getQueue()).toEqual([mockRunEntry]);
    });

    it("clears the queue when getting it", () => {
      queue.addEntry(mockRunEntry);
      queue.getQueue();
      expect(queue.getQueue()).toEqual([]);
      expect(writeFile).toHaveBeenCalled();
    });
  });
});
