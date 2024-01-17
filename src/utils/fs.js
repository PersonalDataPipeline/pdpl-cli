const {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} = require("fs");
const path = require("path");

const config = require("./config");

const envWrite = (key, newValue, replaceValue) => {
  const envPath = path.join(__dirname, "../../.env");
  const currentContents = readFileSync(envPath, "utf8");

  let newContents;
  if (typeof replaceValue === "string") {
    newContents = currentContents.replace(
      `${key}="${replaceValue}"`,
      `${key}="${newValue}"`
    );
  } else {
    newContents = currentContents + `\n${key}="${newValue}"`;
  }
  
  writeFileSync(envPath, newContents);
};

const ensureOutputPath = (createPath) => {
  let basePath = config.outputDir;
  createPath.split(path.sep).forEach((pathpart) => {
    basePath = path.join(basePath, pathpart);
    if (!existsSync(basePath)) {
      mkdirSync(basePath);
    }
  });
};

/**
 * 
 * @param {string} writePath
 * @param {string} fileContents
 * @param {object} options 
 * @returns {boolean} - False if skipped as duplicate, true if written.
 */
const writeOutputFile = (writePath, fileContents, options = {}) => {
  const fullSavePath = path.join(config.outputDir, writePath);

  const fileContentsString = config.compressJson
    ? JSON.stringify(fileContents)
    : JSON.stringify(fileContents, null, 2);

  if (options.checkDuplicate) {
    const latestDayFileContents = getLatestDayFileContents(writePath);
    if (fileContentsString === latestDayFileContents) {
      console.log(`Skipping duplicate ${writePath}`);
      return false;
    }
  }

  console.log(`Writing ${writePath}`);
  writeFileSync(fullSavePath, fileContentsString);
  return true;
};

const getLatestDayFileContents = (writePath) => {
  const pathParts = writePath.split(path.sep);
  const day = pathParts.pop().split("--")[0];

  const fullPath = path.join(config.outputDir, ...pathParts);
  const latestDayFile = readdirSync(fullPath)
    .filter((file) => {
      return file.startsWith(day) && file.split(".")[1] === "json";
    })
    .sort((a, b) => (a > b ? -1 : b > a ? 1 : 0))
    .at(0);

  return latestDayFile
    ? readFileSync(path.join(fullPath, latestDayFile), "utf8")
    : "";
};

module.exports = {
  envWrite,
  ensureOutputPath,
  getLatestDayFileContents,
  writeOutputFile,
};
