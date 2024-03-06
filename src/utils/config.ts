const { DEBUG = false } = process.env;

////
/// Types
//

interface Config {
  outputDir: string;
  compressJson: boolean;
  timezone: string;
  debug?: boolean;
}

////
/// Helpers
//

const config: Config = {
  outputDir: "/Users/joshcanhelp/Scripts/cortex/_data",
  timezone: "America/Los_Angeles",
  compressJson: true,
};

if (DEBUG === "true") {
  config.debug = true;
  config.compressJson = false;
  config.outputDir = "/Users/joshcanhelp/Scripts/cortex/_data_debug";
}

////
/// Export
//

process.env.TZ = config.timezone;

export default (): Config => {
  return config;
};
