const { DEBUG = false } = process.env;

////
/// Types
//

interface Config {
  outputDir: string;
  compressJson: boolean;
  debug?: boolean;
}

////
/// Helpers
//

const config: Config = {
  outputDir: "/Users/joshcanhelp/Scripts/cortex/_data",
  compressJson: true,
};

if (DEBUG === "true") {
  config.debug = true;
  config.compressJson = false;
  config.outputDir = "/Users/joshcanhelp/Scripts/cortex/_data_debug";
}

export default (): Config => {
  return config;
};
