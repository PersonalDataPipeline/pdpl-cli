import { existsSync } from "fs";

const { DEBUG = false } = process.env;

////
/// Types
//

interface Config {
  outputDir: string;
  compressJson: boolean;
  timezone: string;
  debug: boolean;
  originDate: string;
}

////
/// Helpers
//

const config: Config = {
  timezone: "America/Los_Angeles",
  outputDir: "/Users/joshcanhelp/Documents/tapestry",
  compressJson: true,
  debug: false,
  originDate: "1980-05-07",
};

if (DEBUG === "true") {
  config.outputDir = "/Users/joshcanhelp/Code/tapestry/_data_debug";
  config.compressJson = false;
  config.debug = true;
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
