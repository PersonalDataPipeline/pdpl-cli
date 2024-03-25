import { homedir } from "os";

import { pathExists } from "./fs.js";
import path, { dirname } from "path";
import runLogger from "./logger.js";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const {
  DEBUG_OUTPUT = "false",
  DEBUG_USE_MOCKS = "false",
  DEBUG_LOG_OUTPUT = "false",
  DEBUG_SAVE_MOCKS = "false",
  DEBUG_ALL = "false",
  PATH_TO_CONFIG,
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
  debugOutputDir: string;
  debugCompressJson: boolean;
}

interface ConfigFile extends Partial<Config> {}

////
/// Helpers
//

const config: Config = {
  timezone: "GMT",
  outputDir: path.join(homedir(), "api-data"),
  originDate: "1900-01-01",
  compressJson: true,
  debugUseMocks: false,
  debugLogOutput: false,
  debugSaveMocks: false,
  debugOutputDir: path.join(homedir(), "api-data-DEBUG"),
  debugCompressJson: false,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = PATH_TO_CONFIG
  ? PATH_TO_CONFIG
  : path.join(__dirname, "..", "..", ".config.js");

let configImport: null | ConfigFile = null;
let attemptedImport = false;
if (!attemptedImport && existsSync(configPath)) {
  try {
    configImport = (await import(configPath)) as object;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "<unknown error>";
    console.log(
      `❌ Config file ${configPath} exists but could not be loaded: ${errorMessage}`
    );
    process.exit(1);
  }
  attemptedImport = true;
}

////
/// Export
//

let processedConfig: Config | null = null;
export default (): Config => {
  if (processedConfig !== null) {
    return processedConfig;
  }

  let localConfig: ConfigFile = {};
  if (configImport !== null) {
    localConfig = (configImport as { default: object }).default as ConfigFile;
    runLogger.info({
      stage: "startup",
      message: `Using local config file ${configPath}`,
    });
  }

  processedConfig = Object.assign({}, config, localConfig);

  if (DEBUG_OUTPUT === "true" || DEBUG_ALL === "true") {
    processedConfig.outputDir = localConfig.debugOutputDir || config.debugOutputDir;
    processedConfig.compressJson =
      localConfig.debugCompressJson || config.debugCompressJson;
  }

  if (DEBUG_USE_MOCKS === "true" || DEBUG_ALL === "true") {
    processedConfig.debugUseMocks = true;
  }

  if (DEBUG_LOG_OUTPUT === "true" || DEBUG_ALL === "true") {
    processedConfig.debugLogOutput = true;
  }

  if (DEBUG_SAVE_MOCKS === "true" || DEBUG_ALL === "true") {
    processedConfig.debugSaveMocks = true;
  }

  if (!pathExists(processedConfig.outputDir)) {
    console.log(`❌ Output dir ${processedConfig.outputDir} does not exist`);
    process.exit(1);
  }

  process.env.TZ = processedConfig.timezone;

  return processedConfig;
};
