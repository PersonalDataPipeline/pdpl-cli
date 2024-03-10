import * as path from "path";
import getConfig from "./config.js";
import { ensureOutputPath, pathExists, readFile, writeFile } from "../utils/fs.js";

////
/// Types
//

export interface QueueEntry {
  endpoint: string;
  runAfter: number;
  params?: object;
  historic?: boolean;
}

type RunQueue = QueueEntry[];

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

  static entryHasParams(entry: { params?: object }) {
    return !!(entry.params && Object.keys(entry.params).length);
  }

  getQueue() {
    const currentQueue = this.queue;
    this.clearQueue();
    return currentQueue;
  }

  addEntry({ runAfter, endpoint, params = {}, historic = false }: QueueEntry) {
    this.queue.push({
      historic: historic || false,
      runAfter,
      endpoint,
      params,
    });
    this.writeQueue();
  }

  hasStandardEntryFor(endpoint: string) {
    return (
      this.queue.filter((entry: QueueEntry) => {
        const sameEndpoint = entry.endpoint === endpoint;
        const hasParams = Queue.entryHasParams(entry);
        return sameEndpoint && !hasParams;
      }).length > 0
    );
  }

  private clearQueue() {
    this.queue = [];
    this.writeQueue();
  }

  private writeQueue() {
    ensureOutputPath([this.apiName]);
    writeFile(this.queueFile, JSON.stringify(this.queue, null, 2));
  }
}
