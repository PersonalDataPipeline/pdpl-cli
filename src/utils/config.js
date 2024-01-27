const { existsSync } = require("fs");

const config = {
  outputDir: "/Users/joshcanhelp/Scripts/cortex/_data",
  compressJson: true,
};

if (process.env.DEBUG === "true") {
  config.debug = true;
  config.compressJson = false;
  config.outputDir = "/Users/joshcanhelp/Scripts/cortex/_data_debug";
}

if (!existsSync(config.outputDir)) {
  console.log(`❌ Output path "${config.outputDir}" does not exist`);
  process.exit();
}

const getConfig = () => {
  return config;
};

module.exports = getConfig;
