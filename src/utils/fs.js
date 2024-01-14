const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const path = require("path");

const envStringReplace = (key, currentValue, newValue) => {
  const envPath = path.join(__dirname, "../../.env");
  const currentContents = readFileSync(envPath, "utf8");
  const newContents = currentContents.replace(
    `${key}="${currentValue}"`,
    `${key}="${newValue}"`
  );
  writeFileSync(envPath, newContents);
}

const ensurePath = (basePath, createPath) => {
  createPath.forEach((pathpart) => {
    basePath = path.join(basePath, pathpart);
    if (!existsSync(basePath)) {
      mkdirSync(basePath);
    }
  });
}

module.exports = {
  envStringReplace,
  ensurePath,
}