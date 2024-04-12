import { Args } from "@oclif/core";
import path from "path";
import { parse } from "csv-parse/sync";

import { ImportBaseCommand, importNameArg } from "./_base.js";
import { DailyData, ImportHandler } from "../../utils/types.js";
import logger from "../../utils/logger.js";
import { runDateUtc } from "../../utils/date-time.js";
import { makeOutputPath, readFile, writeOutputFile } from "../../utils/fs.js";

export default class Import extends ImportBaseCommand<typeof Import> {
  static override summary = "Import a file or directory";

  static override examples = ["<%= config.bin %> <%= command.id %> IMPORT_NAME"];

  static override args = {
    ...importNameArg,
    importPath: Args.directory({
      required: true,
      name: "PATH_NAME",
    }),
  };

  public override async run(): Promise<void> {
    const runDateTime = runDateUtc().dateTime;
    const { importName, importPath } = this.args;

    logger.setApiName(importName);

    const { default: importHandler } = (await import(
      `../../imports/${importName}/index.js`
    )) as {
      default: ImportHandler;
    };

    for (const fileHandler of importHandler.importFiles) {
      const filePath = path.join(importPath, fileHandler.getImportPath());
      const fileContents = readFile(filePath);
      const dailyData: DailyData = {};
      const runMetadata = {
        dateTime: runDateTime,
        filesWritten: 0,
        filesSkipped: 0,
        total: 0,
        days: 0,
        importFile: fileHandler.getImportPath(),
      };

      const entities = (await parse(fileContents, { columns: true, bom: true })) as [];

      const savePath = [importName, fileHandler.getDirName()];

      for (const entity of entities) {
        const transformedEntity: object | null = fileHandler.transformEntity(entity);

        if (transformedEntity === null) {
          continue;
        }

        const day = fileHandler.parseDayFromEntity(transformedEntity);
        if (!dailyData[day]) {
          dailyData[day] = [];
        }
        dailyData[day].push(entity);
      }

      runMetadata.total = entities.length;
      runMetadata.days = Object.keys(dailyData).length;
      for (const day in dailyData) {
        const outputPath = makeOutputPath(savePath, day);
        writeOutputFile(outputPath, dailyData[day])
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;
      }
    }
  }
}
