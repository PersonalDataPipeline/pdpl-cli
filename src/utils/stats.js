const path = require("path");

const { fileNameDateTime } = require("./date");
const { ensureOutputPath, writeOutputFile } = require("./fs");

class Stats {
  constructor() {
    const date = new Date();
    this.log = {
      dateTime: date.toISOString(),
      startTimeMs: Date.now(),
      runs: [],
      errors: [],
    };
  }

  addRun(apiName, endpoint, runData) {
    runData.apiName = apiName;
    runData.endpoint = endpoint;
    this.log.runs.push(runData);
  }

  addError(apiName, endpoint, errorData) {
    errorData.apiName = apiName;
    errorData.endpoint = endpoint;
    this.log.errors.push(errorData);
  }

  shutdown() {
    const date = new Date();
    this.log.endTimeMs = Date.now();
    this.log.runDurationMs = Math.floor(this.log.endTimeMs - this.log.startTimeMs);
    ensureOutputPath("_runs");
    writeOutputFile(path.join("_runs", fileNameDateTime() + ".json"), this.log);
    console.log(JSON.stringify(this.log, null, 2));
  }
}

module.exports = Stats;
