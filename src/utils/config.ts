import { existsSync } from "fs";

const {
  DEBUG_OUTPUT = "false",
  DEBUG_USE_MOCKS = "false",
  DEBUG_LOG_OUTPUT = "false",
  DEBUG_SAVE_MOCKS = "false",
  DEBUG_ALL = "false",
} = process.env;

////
/// Types
//

interface Config {
  outputDir: string;
  compressJson: boolean;
  timezone: string;
  originDate: string;
  debugUseMocks: boolean;
  debugLogOutput: boolean;
  debugSaveMocks: boolean;
}

////
/// Helpers
//

const config: Config = {
  timezone: "America/Los_Angeles",
  outputDir: "/Users/joshcanhelp/Documents/tapestry",
  compressJson: true,
  debugUseMocks: false,
  debugLogOutput: false,
  debugSaveMocks: false,
  originDate: "1980-05-07",
};

if (DEBUG_OUTPUT === "true" || DEBUG_ALL === "true") {
  config.outputDir = "/Users/joshcanhelp/Code/tapestry/_data_debug";
  config.compressJson = false;
}

if (DEBUG_USE_MOCKS === "true" || DEBUG_ALL === "true") {
  config.debugUseMocks = true;
}

if (DEBUG_LOG_OUTPUT === "true" || DEBUG_ALL === "true") {
  config.debugLogOutput = true;
}

if (DEBUG_SAVE_MOCKS === "true" || DEBUG_ALL === "true") {
  config.debugSaveMocks = true;
}

////
/// Export
//

process.env.TZ = config.timezone;

// TODO: Investigate error when using pathExists from local fs:
// "Cannot access 'pathExists' before initialization"
if (!existsSync(config.outputDir)) {
  console.log(`❌ Output dir ${config.outputDir} does not exist`);
  process.exit();
}

export default (): Config => {
  return config;
};
