import { parse } from "csv-parse/sync";
import path from "path";

import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: path.join(__dirname, "..", "..", ".env") });

import { runDateUtc } from "../utils/date-time.js";
import {
  makeOutputPath,
  writeOutputFile,
  readDirectory,
  pathExists,
  readFile,
} from "../utils/fs.js";
import logger, { RunLogger } from "../utils/logger.js";
import { DailyData } from "../utils/types.js";

////
/// Helpers
//

export const run = async (cliArgs: string[], logger: RunLogger) => {
  const importsSupported = readDirectory("src/imports");

  const importName = cliArgs[2];
  const importType = cliArgs[3] || "";
  const importFile = cliArgs[4];

  if (!importName) {
    logger.error({ stage: "startup", error: "No import name in command" });
    logger.shutdown();
    process.exit();
  }

  if (!importsSupported.includes(importName)) {
    logger.error({ stage: "startup", error: `Unknown import name "${importName}"` });
    logger.shutdown();
    process.exit();
  }

  if (!importFile || !pathExists(importFile)) {
    logger.error({ stage: "startup", error: `Import file "${importFile}" not found` });
    logger.shutdown();
    process.exit();
  }

  const importHandler = await import(`../imports/${importName}/index.js`);
  const allImportTypes = Object.keys(importHandler.importTypes);

  if (!importType && !allImportTypes.includes(importType)) {
    logger.error({
      stage: "startup",
      error: `Unsupported import type "${importType}" for import "${importName}"`,
    });
    logger.shutdown();
    process.exit();
  }

  logger.setApiName(importName);
  const fileContents = readFile(importFile);
  const runDateTime = runDateUtc().dateTime;

  const entities = await parse(fileContents, { columns: true, bom: true });
  const thisHandler = importHandler.importTypes[importType];

  const savePath = [importName, thisHandler.getDirName()];

  const dailyData: DailyData = {};
  const runMetadata = {
    dateTime: runDateTime,
    filesWritten: 0,
    filesSkipped: 0,
    total: 0,
    days: 0,
    importFile,
  };

  for (const entity of entities) {
    const transformedEntity = thisHandler.transformEntity(entity);

    if (!transformedEntity) {
      continue;
    }

    if (!dailyData[transformedEntity.day]) {
      dailyData[transformedEntity.day] = [];
    }
    dailyData[transformedEntity.day].push(entity);
  }

  runMetadata.total = entities.length;
  runMetadata.days = Object.keys(dailyData).length;
  for (const day in dailyData) {
    const outputPath = makeOutputPath(savePath, day);
    writeOutputFile(outputPath, dailyData[day])
      ? runMetadata.filesWritten++
      : runMetadata.filesSkipped++;
  }

  logger.success({
    endpoint: `import-${importName}`,
    ...runMetadata,
  });
};

try {
  await run(process.argv, logger);
} catch (error) {
  logger.error({ stage: "other", error });
}
logger.shutdown();
