import * as path from "path";
import getConfig from "./config.js";
import { pathExists, readFile, writeFile } from "../utils/fs.js";

////
/// Types
//

export interface HistoricalRunEntryEndpoint {
  endpoint: string;
  params: string;
}

export interface HistoricalRunEntry extends RunEntry {
  endpoints: HistoricalRunEntryEndpoint[];
}

export interface ErrorRunEntry extends RunEntry {
  endpoint: string;
  retryCount: number;
}

export interface StandardRunEntry extends RunEntry {
  nextRun: number;
}

interface RunEntry {
  apiName: string;
  type: "standard" | "error" | "historical";
}

type RunQueue = (StandardRunEntry | ErrorRunEntry | HistoricalRunEntry)[];

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
    return this.queue.shift();
  }

  addStandardEntry(nextRun: number) {
    this.queue.push({
      type: "standard",
      apiName: this.apiName,
      nextRun,
    } as StandardRunEntry);
    this.writeQueue();
  }

  addErrorEntry(endpoint: string, retryCount: number) {
    this.queue.push({
      type: "error",
      apiName: this.apiName,
      endpoint,
      retryCount,
    } as ErrorRunEntry);
    this.writeQueue();
  }

  addHistoricalEntry(endpoints: HistoricalRunEntryEndpoint[]) {
    this.queue.push({
      type: "historical",
      apiName: this.apiName,
      endpoints,
    } as HistoricalRunEntry);
    this.writeQueue();
  }

  private writeQueue() {
    writeFile(this.queueFile, JSON.stringify(this.queue, null, 2));
  }
}
