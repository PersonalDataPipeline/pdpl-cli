import { AxiosError } from "axios";

import { getFormattedDate, getFormattedTime, runDateUtc } from "./date-time.js";
import { makeOutputPath, writeFile } from "./fs.js";
import { ApiHandler } from "./types.js";
import getConfig from "./config.js";

////
/// Types
//

export type ValidLogLevels = "debug" | "info" | "warn" | "success" | "error" | "none";

export interface RunLogger {
  info: (entry: InfoEntry) => void;
  error: (entry: ErrorEntry) => void;
  success: (entry: SuccessEntry) => void;
  shutdown: (apiName?: string) => void;
  printDebug: (data: object, apiHandler?: ApiHandler) => void;
  LOG_LEVELS: { [Level in ValidLogLevels]: number };
}

export interface InfoEntry {
  message: string;
  endpoint?: string;
}

export interface ErrorEntry {
  error: unknown;
  endpoint?: string;
}

export interface SuccessEntry {
  endpoint: string;
  filesWritten?: number;
  filesSkipped?: number;
  total?: number;
  days?: number;
}

export interface RunLogInfoEntry {
  type: ValidLogLevels;
  timeMs: number;
  message: string;
  endpoint?: string;
}

export interface RunLogErrorEntry extends RunLogInfoEntry {
  data: object;
}

export interface RunLogSuccessEntry
  extends Omit<RunLogInfoEntry, "endpoint" | "message"> {
  endpoint: string;
  filesWritten?: number;
  filesSkipped?: number;
  importFile?: string;
  total?: number;
  days?: number;
}

export interface RunLogFile {
  dateTime: string;
  startTimeMs: number;
  entries: AnyLogEntry[];
  endTimeMs?: number;
  runDurationMs?: number;
}

interface PrintLogEntry {
  type: ValidLogLevels;
  apiName?: string;
  endpoint?: string;
  message?: string;
}

type AnyLogEntry = RunLogInfoEntry | RunLogSuccessEntry | RunLogErrorEntry;

////
/// Helpers
//

const logLevel = getConfig().logLevel;

const runLog: RunLogFile = {
  dateTime: runDateUtc().dateTime,
  startTimeMs: Date.now(),
  entries: [],
};

const print = (entry: PrintLogEntry) => {
  console.log(
    "%s %s [LEVEL: %s] %s%s",
    getFormattedDate(),
    getFormattedTime(),
    entry.type,
    "apiName" in entry && entry.apiName ? `[API: ${entry.apiName}] ` : "",
    "endpoint" in entry && entry.endpoint ? `[ENDPOINT: ${entry.endpoint}] ` : "",
    "message" in entry ? entry.message : ""
  );
};

////
/// Export
//

const LOG_LEVELS = {
  debug: 0,
  info: 10,
  warn: 20,
  success: 30,
  error: 40,
  none: 100,
};

const printDebug = (data: object) => {
  if (LOG_LEVELS[logLevel] === LOG_LEVELS["debug"]) {
    console.log(data);
  }
};

const info = ({ message, endpoint }: InfoEntry) => {
  if (LOG_LEVELS["info"] < LOG_LEVELS[logLevel]) {
    return;
  }
  const entry = {
    type: "info",
    timeMs: Date.now(),
    message,
    endpoint,
  } as RunLogInfoEntry;
  runLog.entries.push(entry);
  print(entry);
};

const success = ({ endpoint, filesWritten, filesSkipped, total, days }: SuccessEntry) => {
  if (LOG_LEVELS[logLevel] > LOG_LEVELS["success"]) {
    return;
  }
  const entry = {
    type: "success",
    timeMs: Date.now(),
    endpoint,
    filesWritten,
    filesSkipped,
    total,
    days,
  } as RunLogSuccessEntry;
  runLog.entries.push(entry);
  print({
    ...entry,
    message: `Got ${total} total${
      typeof days === "number" ? ` for ${days} days` : ""
    }; ${filesWritten} files written and ${filesSkipped} files skipped.`,
  });
};

const error = ({ endpoint, error }: ErrorEntry) => {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "Unknown error";

  const data =
    error instanceof AxiosError && error.response ? (error.response.data as object) : {};

  const entry = {
    type: "error",
    timeMs: Date.now(),
    endpoint,
    message,
    data,
  } as RunLogErrorEntry;
  runLog.entries.push(entry);
  print(entry);
};

const shutdown = (apiName?: string) => {
  if (!getConfig().saveEmptyLogs && !runLog.entries.length) {
    return;
  }
  runLog.endTimeMs = Date.now();
  runLog.runDurationMs = Math.floor(runLog.endTimeMs - runLog.startTimeMs);

  const savePath = [...(apiName ? [apiName, "_runs"] : ["_runs"])];
  writeFile(makeOutputPath(savePath), JSON.stringify(runLog, null, 2));

  runLog.entries = [];
};

const runLogger: RunLogger = {
  printDebug,
  info,
  success,
  error,
  shutdown,
  LOG_LEVELS,
};

export default runLogger;
