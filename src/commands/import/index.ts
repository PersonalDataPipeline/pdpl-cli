import { Args } from "@oclif/core";
import path from "path";
import { parse } from "csv-parse/sync";

import { ImportBaseCommand, importNameArg } from "./_base.js";
import { DailyData, ImportHandler } from "../../utils/types.js";
import { runDateUtc } from "../../utils/date-time.js";
import { makeOutputPath, readFile, writeOutputFile } from "../../utils/fs.js";
import logger from "../../utils/logger.js";

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

    const { default: importHandler } = (await import(
      `../../imports/${importName}/index.js`
    )) as {
      default: ImportHandler;
    };

    for (const originalHandler of importHandler.importFiles) {
      const fileHandler = Object.assign(
        {
          transformEntity: (entity: object) => entity,
          transformFileContents: (content: string) => content,
          transformParsedData: (data: object | []) => data as [],
          handleEntityFiles: () => {},
        },
        originalHandler
      );

      const dailyData: DailyData = {};
      const runMetadata = {
        dateTime: runDateTime,
        filesWritten: 0,
        filesSkipped: 0,
        total: 0,
        days: 0,
        endpoint: fileHandler.getImportPath(),
      };

      const filePath = path.join(importPath, fileHandler.getImportPath());
      const fileContents = fileHandler.transformFileContents(readFile(filePath));

      let entities: [];
      switch (fileHandler.parsingStrategy()) {
        case "csv":
          entities = (await parse(fileContents, { columns: true, bom: true })) as [];
          break;
        case "json":
          entities = JSON.parse(fileContents) as [];
          break;
        default:
          throw new Error("Invalid parsing strategy");
      }

      entities = fileHandler.transformParsedData(entities);

      for (const entity of entities) {
        const transformedEntity: object | null = fileHandler.transformEntity(entity);

        if (transformedEntity === null) {
          continue;
        }

        const day = fileHandler.parseDayFromEntity(transformedEntity);
        if (!dailyData[day]) {
          dailyData[day] = [];
        }
        dailyData[day].push(transformedEntity);

        fileHandler.handleEntityFiles(entity, importPath);
      }

      runMetadata.total = entities.length;
      runMetadata.days = Object.keys(dailyData).length;

      const savePath = [importName, fileHandler.getDirName()];
      for (const day in dailyData) {
        const outputPath = makeOutputPath(savePath, day);
        writeOutputFile(outputPath, dailyData[day])
          ? runMetadata.filesWritten++
          : runMetadata.filesSkipped++;
      }

      logger.success({
        ...runMetadata,
      });
    }
  }
}
