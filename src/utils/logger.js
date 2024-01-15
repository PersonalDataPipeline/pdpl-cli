const { writeFileSync } = require("fs");
const path = require("path");

const { fileNameDateTime } = require("./date");
const { ensurePath } = require("./fs");

class Logger {

  constructor(config) {
    const date = new Date();
    this.config = config;
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
    this.log.runs.push(runData)
  }

  addError(apiName, endpoint, errorData) {
    runData.apiName = apiName;
    runData.endpoint = endpoint;
    this.log.errors.push(runData)
  }

  shutdown() {
    const date = new Date();
    this.log.endTimeMs = Date.now();
    this.log.runDurationMs = Math.floor(this.log.endTimeMs - this.log.startTimeMs);
    ensurePath(this.config.outputDir, ["_runs"]);
    writeFileSync(
      path.join(this.config.outputDir, "_runs", fileNameDateTime() + ".json"), 
      JSON.stringify(this.log, null, 2)
    );
  }
}

module.exports = Logger;