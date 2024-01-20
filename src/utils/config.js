const config = {
  outputDir: "/Users/joshcanhelp/Scripts/cortex/_data",
  compressJson: true,
};

const getConfig = () => {
  if (process.env.DEBUG === "true") {
    config.debug = true;
    config.compressJson = false;
    config.outputDir = "/Users/joshcanhelp/Scripts/cortex/_data_debug";
  }
  return config;
};

module.exports = getConfig;
