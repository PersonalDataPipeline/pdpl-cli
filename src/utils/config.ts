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
  outputDir: "/Users/joshcanhelp/Scripts/cortex/_data",
  compressJson: true,
  debug: false,
};

if (DEBUG === "true") {
  config.outputDir = "/Users/joshcanhelp/Scripts/cortex/_data_debug";
  config.compressJson = false;
  config.debug = true;
}

////
/// Export
//

process.env.TZ = config.timezone;

export default (): Config => {
  return config;
};
