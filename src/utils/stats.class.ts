import path from "path";

import { runDateUtc } from "../utils/date.js";
import { ensureOutputPath, writeFile } from "./fs.js";
import getConfig from "./config.js";

////
/// Types
//

export interface StatsRunData {
  dateTime: string;
  filesWritten: number;
  filesSkipped: number;
  importFile?: string;
  total?: number;
  days?: number;
  enrichUrls?: string[];
}

interface StatsRunLog extends StatsRunData {
  endpoint: string;
}

interface StatsErrorData {
  type: "http" | "parsing_response" | "other";
  message: string;
  data?: object;
}

interface StatsErrorLog extends StatsErrorData {
  endpoint: string;
}

interface StatsLog {
  name: string;
  dateTime: string;
  startTimeMs: number;
  endTimeMs?: number;
  runDurationMs?: number;
  runs: StatsRunLog[];
  errors: StatsErrorLog[];
}

////
/// Export
//

export default class Stats {
  log: StatsLog;

  constructor(name: string) {
    this.log = {
      name,
      dateTime: runDateUtc().dateTime,
      startTimeMs: Date.now(),
      runs: [],
      errors: [],
    };
  }

  addRun(endpoint: string, runData: StatsRunData) {
    this.log.runs.push({ endpoint, ...runData });
  }

  addError(endpoint: string, errorData: StatsErrorData) {
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

    if (getConfig().debug) {
      console.log(logContent);
    }
  }
}
