const path = require("path");
const { writeFileSync } = require("fs");

const { fileNameDateTime } = require("./date");
const { ensureOutputPath } = require("./fs");
const getConfig = require("./config");

class Stats {
  constructor(name) {
    this.log = {
      name,
      dateTime: fileNameDateTime(),
      startTimeMs: Date.now(),
      runs: [],
      errors: [],
    };
  }

  addRun(endpoint, runData) {
    runData.endpoint = endpoint;
    this.log.runs.push(runData);
  }

  addError(endpoint, errorData) {
    errorData.endpoint = endpoint;
    this.log.errors.push(errorData);
  }

  shutdown() {
    this.log.endTimeMs = Date.now();
    this.log.runDurationMs = Math.floor(this.log.endTimeMs - this.log.startTimeMs);
    const savePath = [this.log.name, "_runs"];
    ensureOutputPath(savePath);
    writeFileSync(
      path.join(
        getConfig().outputDir,
        ...savePath,
        this.log.dateTime + ".json"
      ), 
      JSON.stringify(this.log, null, 2)
    );
  }
}

module.exports = Stats;
