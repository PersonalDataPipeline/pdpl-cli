const { readFileSync, writeFileSync } = require("fs");
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

module.exports = {
  envStringReplace
}