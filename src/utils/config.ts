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
}

////
/// Helpers
//

const config: Config = {
  timezone: "America/Los_Angeles",
  outputDir: "/Users/joshcanhelp/Documents/tapestry",
  compressJson: true,
  debug: false,
};

if (DEBUG === "true") {
  config.outputDir = "/Users/joshcanhelp/Code/tapestry/_data_debuggg";
  config.compressJson = false;
  config.debug = true;
}

////
/// Export
//

process.env.TZ = config.timezone;

if (!existsSync(config.outputDir)) {
  console.log(`❌ Output dir ${config.outputDir} does not exist`);
  process.exit();
}

export default (): Config => {
  return config;
};
