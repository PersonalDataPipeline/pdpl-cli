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
  createPath.forEach((pathpart) => {
    basePath = path.join(basePath, pathpart);
    if (!existsSync(basePath)) {
      mkdirSync(basePath);
    }
  });
}

const writeOutputFile = (createPathParts, fileContents) => {
  const fullSavePath = config.outputDir + path.sep + createPathParts.join(path.sep);
  const fileContentsString = config.compressJson ? 
    JSON.stringify(fileContents) : 
    JSON.stringify(fileContents, null, 2);

  writeFileSync(fullSavePath, fileContentsString);
}

module.exports = {
  envStringReplace,
  ensureOutputPath,
  getLatestDayFile,
  writeOutputFile,
}