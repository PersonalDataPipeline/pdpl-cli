import path from "path";

import { runDateUtc } from "../utils/date.js";
import { ensureOutputPath, writeFile } from "./fs.js";
import getConfig from "./config.js";
import { AxiosError } from "axios";

////
/// Types
//

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

interface RunLogFile {
  dateTime: string;
  startTimeMs: number;
  endTimeMs?: number;
  runDurationMs?: number;
  entries: (RunLogInfoEntry | RunLogErrorEntry | RunLogSuccessEntry)[];
}

////
/// Export
//

export default class RunLog {
  name: string;
  log: RunLogFile;

  constructor(name: string) {
    this.name = name;
    this.log = {
      dateTime: runDateUtc().dateTime,
      startTimeMs: Date.now(),
      entries: [],
    };
  }

  info({
    message,
    stage,
    endpoint,
  }: {
    message: string;
    stage: string;
    endpoint?: string;
  }): RunLog {
    this.log.entries.push({
      type: "info",
      message,
      stage,
      timeMs: Date.now(),
      endpoint,
    } as RunLogInfoEntry);
    return this;
  }

  error({
    stage,
    endpoint,
    error,
  }: {
    stage: string;
    error: unknown;
    endpoint?: string;
  }): RunLog {
    this.log.entries.push({
      type: "error",
      stage,
      endpoint,
      message:
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Unknown error",
      data:
        error instanceof AxiosError && error.response
          ? (error.response.data as object)
          : {},
      timeMs: Date.now(),
    } as RunLogErrorEntry);
    return this;
  }

  success({
    endpoint,
    filesWritten,
    filesSkipped,
    total,
    days,
  }: {
    endpoint: string;
    filesWritten?: number;
    filesSkipped?: number;
    total?: number;
    days?: number;
  }): RunLog {
    this.log.entries.push({
      type: "success",
      endpoint,
      filesWritten,
      filesSkipped,
      total,
      days,
      timeMs: Date.now(),
    } as RunLogSuccessEntry);
    return this;
  }

  shutdown() {
    this.log.endTimeMs = Date.now();
    this.log.runDurationMs = Math.floor(this.log.endTimeMs - this.log.startTimeMs);
    const savePath = [this.name, "_runs"];
    const logContent = JSON.stringify(this.log, null, 2);
    ensureOutputPath(savePath);
    writeFile(
      path.join(getConfig().outputDir, ...savePath, runDateUtc().fileName + ".json"),
      JSON.stringify(this.log, null, 2)
    );

    if (getConfig().debugLogOutput) {
      console.log(logContent);
    }
  }
}
