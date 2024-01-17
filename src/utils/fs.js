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
    const latestDayFileContents = getLatestFileContents(writePath);
    if (fileContentsString === latestDayFileContents) {
      console.log(`Skipping duplicate ${writePath}`);
      return false;
    }
  }

  console.log(`Writing ${writePath}`);
  writeFileSync(fullSavePath, fileContentsString);
  return true;
};

const getLatestFileContents = (writePath) => {
  const pathParts = writePath.split(path.sep);
  const fileName = pathParts.pop();
  const day = fileName.includes("--") ? fileName.split("--")[0] : null;

  const fullPath = path.join(config.outputDir, ...pathParts);
  const latestDayFile = readdirSync(fullPath)
    // Look for a specific day, if not a snapshot file
    .filter((file) => day ? file.startsWith(day) : true)
    // JSON files only
    .filter((file) => file.split(".")[1] === "json")
    // Sort file names descending
    .sort((a, b) => (a > b ? -1 : b > a ? 1 : 0))
    // Get the first one
    .at(0);

  return latestDayFile
    ? readFileSync(path.join(fullPath, latestDayFile), "utf8")
    : "";
};

module.exports = {
  envWrite,
  ensureOutputPath,
  getLatestFileContents,
  writeOutputFile,
};
