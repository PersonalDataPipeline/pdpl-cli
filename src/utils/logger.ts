import { AxiosError } from "axios";

import { runDateUtc } from "./date-time.js";
import { makeOutputPath, writeFile } from "./fs.js";
import getConfig from "./config.js";

////
/// Types
//

export interface RunLogger {
  info: (entry: InfoEntry) => void;
  error: (entry: ErrorEntry) => void;
  success: (entry: SuccessEntry) => void;
  shutdown: (apiName?: string) => void;
}

export interface InfoEntry {
  message: string;
  stage: string;
  endpoint?: string;
}

export interface ErrorEntry {
  stage: string;
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
  stage: "startup" | "http" | "parsing_response" | "queue_management" | "other";
  type: "info" | "error" | "success";
  timeMs: number;
  message: string;
  endpoint?: string;
}

export interface RunLogErrorEntry extends RunLogInfoEntry {
  data: object;
}

export interface RunLogSuccessEntry
  extends Omit<RunLogInfoEntry, "endpoint" | "message" | "stage"> {
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
  entries: (RunLogInfoEntry | RunLogErrorEntry | RunLogSuccessEntry)[];
  endTimeMs?: number;
  runDurationMs?: number;
}

////
/// Helpers
//

const runLog: RunLogFile = {
  dateTime: runDateUtc().dateTime,
  startTimeMs: Date.now(),
  entries: [],
};

////
/// Export
//

const info = ({ message, stage, endpoint }: InfoEntry) => {
  runLog.entries.push({
    type: "info",
    timeMs: Date.now(),
    message,
    stage,
    endpoint,
  } as RunLogInfoEntry);
};

const success = ({ endpoint, filesWritten, filesSkipped, total, days }: SuccessEntry) => {
  runLog.entries.push({
    type: "success",
    timeMs: Date.now(),
    endpoint,
    filesWritten,
    filesSkipped,
    total,
    days,
  } as RunLogSuccessEntry);
};

const error = ({ stage, endpoint, error }: ErrorEntry) => {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "Unknown error";

  const data =
    error instanceof AxiosError && error.response ? (error.response.data as object) : {};

  runLog.entries.push({
    type: "error",
    timeMs: Date.now(),
    stage,
    endpoint,
    message,
    data,
  } as RunLogErrorEntry);
};

const shutdown = (apiName?: string) => {
  const savePath = [...(apiName ? [apiName, "_runs"] : ["_runs"])];
  const outputPath = makeOutputPath(savePath);

  runLog.endTimeMs = Date.now();
  runLog.runDurationMs = Math.floor(runLog.endTimeMs - runLog.startTimeMs);
  const logContent = JSON.stringify(runLog, null, 2);

  writeFile(outputPath, JSON.stringify(runLog, null, 2));

  if (getConfig().debugLogOutput) {
    console.log(logContent);
  }

  runLog.entries = [];
};

const runLogger: RunLogger = {
  info,
  success,
  error,
  shutdown,
};

export default runLogger;
