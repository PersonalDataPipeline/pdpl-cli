const {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync
} = require("fs");
const path = require("path");

const getConfig = require("./config");

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
  let basePath = getConfig().outputDir;
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
 * @returns {boolean} - False if skipped as duplicate, true if written.
 */
const writeOutputFile = (writePath, fileContents) => {
  const fullSavePath = path.join(getConfig().outputDir, writePath);

  const fileContentsString = getConfig().compressJson
    ? JSON.stringify(fileContents)
    : JSON.stringify(fileContents, null, 2);

  const latestDayFileContents = getLatestFileContents(writePath);
  if (fileContentsString === latestDayFileContents) {
    console.log(`Skipping duplicate ${writePath}`);
    rmSync(fullSavePath, { force: true });
    return false;
  }

  console.log(`Writing ${writePath}`);
  writeFileSync(fullSavePath, fileContentsString);
  return true;
};

const getLatestFileContents = (writePath) => {
  const pathParts = writePath.split(path.sep);
  const fileName = pathParts.pop();
  const day = fileName.includes("--") ? fileName.split("--")[0] : null;

  const fullPath = path.join(getConfig().outputDir, ...pathParts);
  const latestDayFile = readdirSync(fullPath)
    // Exclude current file
    .filter((file) => file !== fileName)
    // Look for a specific day, if not a snapshot file
    .filter((file) => (day ? file.startsWith(day) : true))
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

const makeOutputPath = (apiPath, day, run) => path.join(
  apiPath, 
  (day ? `${day}--run-${run}` : run) + ".json"
);

module.exports = {
  envWrite,
  ensureOutputPath,
  getLatestFileContents,
  writeOutputFile,
  makeOutputPath
};
