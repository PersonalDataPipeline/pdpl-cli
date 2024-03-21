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
    const handledEndpoints: string[] = [];
    const handlerDict: { [key: string]: ApiPrimaryEndpoint } = {};

    for (const endpointHandler of this.apiHandler.endpointsPrimary) {
      handledEndpoints.push(endpointHandler.getEndpoint());
      handlerDict[endpointHandler.getEndpoint()] = endpointHandler;
    }

    for (const [index, entry] of this.queue.entries()) {
      const endpoint = entry.endpoint;

      // If an endpoint was removed from the handler, remove from the queue
      if (!handledEndpoints.includes(endpoint)) {
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
        endpoint: entry.endpoint,
        historic: !entryHasParams ? false : !!entry.historic,
        params: entryHasParams ? entry.params : {},
      });
    }

    // Find any new endpoints that don't have a queue entry
    for (const endpoint of handledEndpoints) {
      if (!this.hasStandardEntryFor(endpoint)) {
        logger.info({
          stage: "queue_management",
          message: `Adding standard entry for unhandled endpoint`,
          endpoint,
        });
        this.addEntry({
          endpoint,
          runAfter: handlerDict[endpoint].getDelay() + runDate.seconds,
        });
        runQueue.push({ endpoint, historic: false, params: {} });
      }
    }

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

  hasHistoricEntryFor(endpoint: string) {
    return (
      this.queue.filter((entry: QueueEntry) => {
        const sameEndpoint = entry.endpoint === endpoint;
        const hasParams = Queue.entryHasParams(entry);
        return sameEndpoint && entry.historic && hasParams;
      }).length > 0
    );
  }

  private writeQueue() {
    ensureOutputPath([this.apiName]);
    writeFile(this.queueFile, JSON.stringify(this.queue, null, 2));
  }
}
