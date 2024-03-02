import * as path from "path";
import getConfig from "./config.js";
import { ensureOutputPath, pathExists, readFile, writeFile } from "../utils/fs.js";
import { EndpointRecord } from "./types.js";

////
/// Types
//

export interface HistoricalRunEntry {
  endpoints: EndpointRecord[];
  type: string;
}

export interface StandardRunEntry {
  nextRun: number;
  type: string;
}

type RunQueue = (StandardRunEntry | HistoricalRunEntry)[];

////
/// Export
//

export default class Queue {
  apiName: string;
  queueFile: string;
  queue: RunQueue;

  constructor(apiName: string) {
    this.apiName = apiName;
    this.queueFile = path.join(getConfig().outputDir, apiName, "_queue.json");

    if (!pathExists(this.queueFile)) {
      ensureOutputPath([this.apiName]);
      writeFile(this.queueFile, "[]");
      this.queue = [];
    } else {
      const queueContents = readFile(this.queueFile);
      this.queue = JSON.parse(queueContents) as RunQueue;
    }
  }

  getQueue() {
    return this.queue;
  }

  getEntry() {
    const entry = this.queue.shift();
    this.writeQueue();
    return entry;
  }

  addStandardEntry(nextRun: number) {
    this.queue.push({
      type: "standard",
      nextRun,
    } as StandardRunEntry);
    this.writeQueue();
  }

  addHistoricalEntry(endpoints: EndpointRecord[]) {
    this.queue.push({
      type: "historical",
      endpoints,
    } as HistoricalRunEntry);
    this.writeQueue();
  }

  private writeQueue() {
    ensureOutputPath([this.apiName]);
    writeFile(this.queueFile, JSON.stringify(this.queue, null, 2));
  }
}
