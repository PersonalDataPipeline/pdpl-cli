const path = require("path");
const { writeFileSync } = require("fs");

const { fileNameDateTime } = require("./date");
const { ensureOutputPath } = require("./fs");
const getConfig = require("./config");

class Stats {
  constructor() {
    this.log = {
      dateTime: fileNameDateTime(),
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
    this.log.endTimeMs = Date.now();
    this.log.runDurationMs = Math.floor(this.log.endTimeMs - this.log.startTimeMs);
    const savePath = path.join(
      getConfig().outputDir,
      "_runs",
      this.log.dateTime + ".json"
    );
    ensureOutputPath("_runs");
    writeFileSync(savePath, JSON.stringify(this.log, null, 2));
  }
}

module.exports = Stats;
