const { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } = require("fs");
const path = require("path");

const config = require("./config");

const envStringReplace = (key, currentValue, newValue) => {
  const envPath = path.join(__dirname, "../../.env");
  const currentContents = readFileSync(envPath, "utf8");
  const newContents = currentContents.replace(
    `${key}="${currentValue}"`,
    `${key}="${newValue}"`
  );
  writeFileSync(envPath, newContents);
}

const ensureOutputPath = (createPath) => {
  let basePath = config.outputDir;
  createPath.split(path.sep).forEach((pathpart) => {
    basePath = path.join(basePath, pathpart);
    if (!existsSync(basePath)) {
      mkdirSync(basePath);
    }
  });
}

const writeOutputFile = (writePath, fileContents, options = {}) => {
  const fullSavePath = path.join(config.outputDir, writePath);

  const fileContentsString = config.compressJson ? 
    JSON.stringify(fileContents) : 
    JSON.stringify(fileContents, null, 2);

  if (options.checkDuplicate) {
    const latestDayFileContents = getLatestDayFileContents(writePath);
    if (fileContentsString === latestDayFileContents) {
      console.log(`Skipping duplicate ${writePath}`);
      return;
    }
  }

  console.log(`Writing ${writePath}`);
  writeFileSync(fullSavePath, fileContentsString);
}

const getLatestDayFileContents = (writePath) => {
  const pathParts = writePath.split(path.sep);
  const day = pathParts.pop().split("--")[0];

  const fullPath = path.join(config.outputDir, ...pathParts);
  const latestDayFile = readdirSync(fullPath)
    .filter(file => {
      return file.startsWith(day) && file.split(".")[1] === "json";
    })
    .sort((a, b) => a > b ? -1 : b > a ? 1 : 0)
    .at(0);

  return latestDayFile ? readFileSync(path.join(fullPath, latestDayFile), "utf8") : "";
}

module.exports = {
  envStringReplace,
  ensureOutputPath,
  getLatestDayFileContents,
  writeOutputFile,
}