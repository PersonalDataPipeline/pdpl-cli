import * as path from "path";
import getConfig from "./config.js";
import { ensureOutputPath, pathExists, readFile, writeFile } from "../utils/fs.js";
import RunLog from "./logger.class.js";
import { runDateUtc } from "./date.js";
import { ApiHandler, ApiPrimaryEndpoint } from "./types.js";

////
/// Types
//

export interface QueueEntry {
  endpoint: string;
  runAfter: number;
  params: object;
  historic: boolean;
}

interface RunEntry extends Omit<QueueEntry, "runAfter"> {}

////
/// Export
//

export default class Queue {
  apiHandler: ApiHandler;
  queueFile: string;
  apiName: string;
  queue: QueueEntry[];
  handledEndpoints: string[];
  handlerDict: { [key: string]: ApiPrimaryEndpoint };

  constructor(apiHandler: ApiHandler) {
    this.apiHandler = apiHandler;
    this.apiName = apiHandler.getApiName();
    this.queueFile = path.join(getConfig().outputDir, this.apiName, "_queue.json");

    if (!pathExists(this.queueFile)) {
      ensureOutputPath([this.apiName]);
      writeFile(this.queueFile, "[]");
      this.queue = [];
    } else {
      const queueContents = readFile(this.queueFile);
      this.queue = JSON.parse(queueContents) as QueueEntry[];
    }

    this.handledEndpoints = [];
    this.handlerDict = {};
    for (const endpointHandler of this.apiHandler.endpointsPrimary) {
      this.handledEndpoints.push(endpointHandler.getEndpoint());
      this.handlerDict[endpointHandler.getEndpoint()] = endpointHandler;
    }
  }

  static entryHasParams(entry: { params?: object }) {
    return !!(entry.params && Object.keys(entry.params).length);
  }

  getQueue() {
    return this.queue;
  }

  processQueue(logger: RunLog): RunEntry[] {
    const runQueue: RunEntry[] = [];
    const runDate = runDateUtc();

    for (const [index, entry] of this.queue.entries()) {
      const endpoint = entry.endpoint;

      // If an endpoint was removed from the handler, remove from the queue
      if (!this.handledEndpoints.includes(endpoint)) {
        logger.info({
          stage: "queue_management",
          message: "Removing unknown endpoint",
          endpoint,
        });
        delete this.queue[index];
        continue;
      }

      // If we're too early for an entry to run, add back as-is
      if (entry.runAfter > runDate.seconds) {
        const waitMinutes = Math.ceil((entry.runAfter - runDate.seconds) / 60);
        logger.info({
          stage: "queue_management",
          message: `Skipping for ${waitMinutes} minutes`,
          endpoint,
        });
        continue;
      }

      const entryHasParams = Queue.entryHasParams(entry);
      runQueue.push({
        endpoint,
        historic: !entryHasParams ? false : !!entry.historic,
        params: entryHasParams ? entry.params : {},
      });
    }

    // Find any new endpoints that don't have a queue entry
    for (const endpoint of this.handledEndpoints) {
      if (!this.hasStandardEntryFor(endpoint)) {
        logger.info({
          stage: "queue_management",
          message: `Adding standard entry for unhandled endpoint`,
          endpoint,
        });
        this.addEntry({
          endpoint,
          runAfter: this.handlerDict[endpoint].getDelay() + runDate.seconds,
        });
        runQueue.push({ endpoint, historic: false, params: {} });
      }
    }
    this.queue = this.queue.filter((entry) => entry);
    this.writeQueue();
    return runQueue;
  }

  addEntry({
    runAfter,
    endpoint,
    params = {},
    historic = false,
  }: {
    runAfter: number;
    endpoint: string;
    params?: object;
    historic?: boolean;
  }) {
    this.queue.push({ historic, runAfter, endpoint, params });
    this.writeQueue();
  }

  hasStandardEntryFor(endpoint: string) {
    return (
      this.queue.filter((entry: QueueEntry) => {
        const sameEndpoint = entry.endpoint === endpoint;
        const hasParams = Queue.entryHasParams(entry);
        return sameEndpoint && !hasParams && !entry.historic;
      }).length > 0
    );
  }

  hasHistoricEntryFor(endpoint: string) {
    return this.getStandardEntriesFor(endpoint).length > 0;
  }

  updateStandardEntryFor(endpoint: string) {
    const runDate = runDateUtc();
    for (const [index, entry] of this.queue.entries()) {
      if (entry.endpoint !== endpoint || !this.isStandardEntry(entry)) {
        console.log(`Skipping ${entry.endpoint} when updating ${endpoint}`);
        continue;
      }

      // TODO: Remove duplicate standard entries

      const runAfter = this.handlerDict[endpoint].getDelay() + runDate.seconds;
      console.log(`Updating ${endpoint} to ${runAfter}`);
      this.queue[index].runAfter = runAfter;
    }
    this.writeQueue();
  }

  private isStandardEntry(entry: QueueEntry) {
    const hasParams = Queue.entryHasParams(entry);
    return !hasParams && !entry.historic;
  }

  private getStandardEntriesFor(endpoint: string): QueueEntry[] {
    return this.queue.filter((entry: QueueEntry) => {
      const sameEndpoint = entry.endpoint === endpoint;
      return sameEndpoint && this.isStandardEntry(entry);
    });
  }

  private writeQueue() {
    ensureOutputPath([this.apiName]);
    writeFile(this.queueFile, JSON.stringify(this.queue, null, 2));
  }
}
