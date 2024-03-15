import path from "path";

import { runDateUtc } from "../utils/date.js";
import { ensureOutputPath, writeFile } from "./fs.js";
import getConfig from "./config.js";

////
/// Types
//

export interface RunData {
  dateTime: string;
  filesWritten: number;
  filesSkipped: number;
  importFile?: string;
  total?: number;
  days?: number;
  enrichUrls?: string[];
}

interface RunLogEntry extends RunData {
  endpoint: string;
}

interface ErrorData {
  type: "startup" | "http" | "parsing_response" | "other";
  message: string;
  data?: object;
}

interface ErrorLogEntry extends ErrorData {
  endpoint: string;
}

interface LogEntry {
  name: string;
  dateTime: string;
  startTimeMs: number;
  endTimeMs?: number;
  runDurationMs?: number;
  runs: RunLogEntry[];
  errors: ErrorLogEntry[];
}

////
/// Export
//

export default class RunLog {
  log: LogEntry;

  constructor(name: string) {
    this.log = {
      name,
      dateTime: runDateUtc().dateTime,
      startTimeMs: Date.now(),
      runs: [],
      errors: [],
    };
  }

  addRun(endpoint: string, runData: RunData) {
    this.log.runs.push({ endpoint, ...runData });
  }

  addError(endpoint: string, errorData: ErrorData) {
    this.log.errors.push({ endpoint, ...errorData });
  }

  shutdown() {
    this.log.endTimeMs = Date.now();
    this.log.runDurationMs = Math.floor(this.log.endTimeMs - this.log.startTimeMs);
    const savePath = [this.log.name, "_runs"];
    const logContent = JSON.stringify(this.log, null, 2);
    ensureOutputPath(savePath);
    writeFile(
      path.join(getConfig().outputDir, ...savePath, this.log.dateTime + ".json"),
      JSON.stringify(this.log, null, 2)
    );

    if (getConfig().debugLogOutput) {
      console.log(logContent);
    }
  }
}
