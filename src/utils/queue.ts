import * as path from "path";
import getConfig from "./config.js";
import { ensureOutputPath, pathExists, readFile, writeFile } from "./fs.js";
import { RunLogger } from "./logger.js";
import { runDateUtc } from "./date-time.js";
import { ApiHandler, EpHistoric, EpSnapshot } from "./types.js";

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
/// Helpers
//

const getStandardEntriesFor = (endpoint: string): QueueEntry[] => {
  return queue.filter((entry: QueueEntry) => {
    const sameEndpoint = entry.endpoint === endpoint;
    return sameEndpoint && isStandardEntry(entry);
  });
};

const isStandardEntry = (entry: QueueEntry) => {
  const hasParams = entryHasParams(entry);
  return !hasParams && !entry.historic;
};

const writeQueue = () => {
  if (!queueFile) {
    throw new Error("Trying to write to a queue that has not been initialized");
  }
  queue = queue.filter((entry) => entry);
  writeFile(queueFile, JSON.stringify(queue, null, 2));
};

////
/// Export
//

let queue: QueueEntry[] = [];
let queueFile = "";

export const loadQueue = (apiHandler: ApiHandler) => {
  const apiName = apiHandler.getApiName();
  queueFile = path.join(getConfig().outputDir, apiName, "_queue.json");

  if (!pathExists(queueFile)) {
    ensureOutputPath([apiName]);
    writeFile(queueFile, "[]");
    queue = [];
  } else {
    const queueContents = readFile(queueFile);
    queue = JSON.parse(queueContents) as QueueEntry[];
  }
};

export const entryHasParams = (entry: { params?: object }) => {
  return !!(entry.params && Object.keys(entry.params).length);
};

export const getQueue = () => {
  return queue;
};

export const hasStandardEntryFor = (endpoint: string) => {
  return getStandardEntriesFor(endpoint).length > 0;
};

export const addEntry = ({
  runAfter,
  endpoint,
  params = {},
  historic = false,
}: {
  runAfter: number;
  endpoint: string;
  params?: object;
  historic?: boolean;
}) => {
  queue.push({ historic, runAfter, endpoint, params });
  writeQueue();
};

export const processQueue = (apiHandler: ApiHandler, logger: RunLogger): RunEntry[] => {
  if (!queueFile) {
    loadQueue(apiHandler);
  }

  const runQueue: RunEntry[] = [];
  const runDate = runDateUtc();
  const handledEndpoints: string[] = [];
  const handlerDict: { [key: string]: EpHistoric | EpSnapshot } = {};
  for (const endpointHandler of apiHandler.endpointsPrimary) {
    handledEndpoints.push(endpointHandler.getEndpoint());
    handlerDict[endpointHandler.getEndpoint()] = endpointHandler;
  }

  for (const [index, entry] of queue.entries()) {
    const endpoint = entry.endpoint;

    // If an endpoint was removed from the handler, remove from the queue
    if (!handledEndpoints.includes(endpoint)) {
      logger.info({
        stage: "queue_management",
        message: "Removing unknown endpoint",
        endpoint,
      });
      delete queue[index];
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

    const hasParams = entryHasParams(entry);
    runQueue.push({
      endpoint,
      historic: !hasParams ? false : !!entry.historic,
      params: hasParams ? entry.params : {},
    });
  }

  // Find any new endpoints that don't have a queue entry
  for (const endpoint of handledEndpoints) {
    if (!hasStandardEntryFor(endpoint)) {
      logger.info({
        stage: "queue_management",
        message: `Adding standard entry for unhandled endpoint`,
        endpoint,
      });
      addEntry({
        endpoint,
        runAfter: handlerDict[endpoint].getDelay() + runDate.seconds,
      });
      runQueue.push({ endpoint, historic: false, params: {} });
    }
  }
  writeQueue();
  return runQueue;
};

export const hasHistoricEntryFor = (endpoint: string) => {
  return (
    queue.filter((entry: QueueEntry) => {
      const sameEndpoint = entry.endpoint === endpoint;
      return sameEndpoint && entry.historic;
    }).length > 0
  );
};

export const updateStandardEntry = (
  epHandler: EpHistoric | EpSnapshot,
  runAfter?: number
) => {
  const runDate = runDateUtc();
  const endpoint = epHandler.getEndpoint();
  let seenStandard = false;
  for (const [index, entry] of queue.entries()) {
    if (entry.endpoint !== endpoint || !isStandardEntry(entry)) {
      continue;
    }

    if (seenStandard) {
      delete queue[index];
      continue;
    }

    queue[index].runAfter = runAfter || epHandler.getDelay() + runDate.seconds;
    seenStandard = true;
  }
  writeQueue();
};

export const updateHistoricEntry = ({
  endpoint,
  runAfter,
  params,
}: {
  endpoint: string;
  runAfter: number;
  params?: object;
}) => {
  let seenHistoric = false;
  for (const [index, entry] of queue.entries()) {
    if (entry.endpoint !== endpoint || !entry.historic) {
      continue;
    }

    if (seenHistoric) {
      delete queue[index];
      continue;
    }

    queue[index].runAfter = runAfter;
    queue[index].params = params || queue[index].params;
    seenHistoric = true;
  }
  writeQueue();
};
