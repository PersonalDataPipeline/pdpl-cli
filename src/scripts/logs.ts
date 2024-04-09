import path from "path";

import { readDirectory, __dirname, readFile } from "../utils/fs.js";
import logger, { RunLogFile, RunLogger } from "../utils/logger.js";
import getConfig from "../utils/config.js";
import { getFormattedDate, getFormattedTime } from "../utils/date-time.js";

export const run = (cliArgs: string[], logger: RunLogger) => {
  const apisSupported = readDirectory(path.join(__dirname, "..", "apis"));
  const apiName = cliArgs[2];

  if (!apiName) {
    logger.error({ stage: "startup", error: "No API name in command" });
    logger.shutdown();
    return;
  }

  if (!apisSupported.includes(apiName)) {
    logger.error({ stage: "startup", error: `Unknown API name "${apiName}"` });
    logger.shutdown();
    return;
  }

  const numberToDisplay = parseInt(cliArgs[3], 10) || 20;

  const apiLogsPath = path.join(getConfig().outputDir, apiName, "_runs");
  const logFiles = readDirectory(apiLogsPath)
    .sort((a, b) => (a > b ? -1 : b > a ? 1 : 0))
    .slice(0, numberToDisplay);

  console.log("");
  console.log("Date       | Time     | Err | Suc | Filename");
  console.log("-----------|----------|-----|-----|---------");

  for (const logFile of logFiles) {
    const log = readFile(path.join(apiLogsPath, logFile));

    const { dateTime, entries } = JSON.parse(log) as RunLogFile;
    const dateLocal = new Date(dateTime);
    const date = getFormattedDate(0, dateLocal);
    const time = getFormattedTime(dateLocal);

    const errorCount = entries.filter((entry) => entry.type === "error").length;
    const errorPad = errorCount < 10 ? "  " : " ";
    const successCount = entries.filter((entry) => entry.type === "success").length;
    const successPad = successCount < 10 ? "  " : " ";
    console.log(
      date,
      "|",
      time,
      "|",
      errorCount,
      `${errorPad}|`,
      successCount,
      `${successPad}|`,
      logFile
    );
  }
  console.log("");
};

try {
  run(process.argv, logger);
} catch (error) {
  logger.error({ stage: "other", error });
}
logger.shutdown();
