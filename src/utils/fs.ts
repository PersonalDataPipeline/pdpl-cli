import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  cpSync,
} from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import getConfig from "./config.js";
import { runDateUtc } from "./date-time.js";
import { DEFAULT_CONFIG_DIR } from "./constants.js";

export const __filename = fileURLToPath(import.meta.url);

export const __dirname = dirname(__filename);

export const pathExists = (filePath: string) => {
  // TODO: Update this to accessSync
  // https://nodejs.org/docs/latest-v20.x/api/fs.html#fsaccesssyncpath-mode
  return existsSync(filePath);
};

export const readFile = (filePath: string) => {
  return readFileSync(filePath, { encoding: "utf8" });
};

export const writeFile = (filePath: string, contents: string) => {
  writeFileSync(filePath, contents);
};

export const copyFile = (source: string, destination: string) => {
  cpSync(source, destination, { recursive: true, preserveTimestamps: true });
};

export const readDirectory = (dirPath: string) => {
  return readdirSync(dirPath);
};

export const makeDirectory = (dirPath: string) => {
  return mkdirSync(dirPath, { recursive: true });
};

export const envWrite = (key: string, newValue: string, replaceValue: string): void => {
  const envPath = path.join(DEFAULT_CONFIG_DIR, ".env");
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

export const writeOutputFile = (writePath: string, fileContents: unknown): boolean => {
  const fileContentsString = getConfig().compressJson
    ? JSON.stringify(fileContents)
    : JSON.stringify(fileContents, null, 2);

  const latestDayFileContents = getLatestFileContents(writePath);
  if (fileContentsString === latestDayFileContents) {
    return false;
  }

  writeFileSync(writePath, fileContentsString);
  return true;
};

export const getLatestFileContents = (writePath: string) => {
  const pathParts = writePath.split(path.sep);
  const fileName = pathParts.pop() || "";
  const day = fileName.includes("--") ? fileName.split("--")[0] : null;

  const fullPath = path.sep + path.join(...pathParts);
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

  return latestDayFile ? readFileSync(path.join(fullPath, latestDayFile), "utf8") : "";
};

export const makeOutputPath = (apiPath: string[], identifier?: string) => {
  const run = runDateUtc().fileName;
  const fileName = (identifier ? `${identifier}--run-${run}` : run) + ".json";
  const outputPath = path.join(getConfig().outputDir, ...apiPath);
  makeDirectory(outputPath);
  return path.join(outputPath, fileName);
};
