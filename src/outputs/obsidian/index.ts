import { Database } from "duckdb-async";
import mustache from "mustache";
mustache.escape = (text) => text;

import { KeyVal, OutputHandler } from "../../utils/types.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const { OBSIDIAN_PATH_TO_NOTES = "" } = process.env;

////
/// Types
//

interface StrategyData {
  date?: string;
  template?: string;
}

interface DailyNotesSettings {
  folder: string;
  template: string;
}

////
/// Helpers
//

const getTemplateFields = (template: string): string[] => {
  const templateFields = [];
  for (const token of mustache.parse(template) as string[][]) {
    if (["#", "name"].includes(token[0])) {
      templateFields.push(token[1]);
    }
  }
  return templateFields;
};

////
/// Export
//

const handler: OutputHandler = {
  isReady: () => !!OBSIDIAN_PATH_TO_NOTES,
  handlers: [
    {
      name: () => "daily_notes_append",
      isReady: (fields: object, strategyData?: StrategyData) => {
        const errors: string[] = [];

        if (!strategyData || typeof strategyData !== "object") {
          errors.push("Missing output data fields: date, template");
          return errors;
        }

        if (!strategyData.date) {
          errors.push("Missing date field");
        }

        if (strategyData.date && !Object.keys(fields).includes(strategyData.date)) {
          errors.push(`Date field ${strategyData.date} does not exist in input data.`);
        }

        if (!strategyData.template) {
          errors.push("Missing template");
        }

        // TODO: Add this back when linked fields can be checked
        // const maybeMissingField = arrayMissingValue(
        //   Object.keys(fields),
        //   getTemplateFields(strategyData.template || "")
        // );

        // if (maybeMissingField) {
        //   errors.push(`Found unknown field ${maybeMissingField} in template.`);
        // }

        return errors;
      },
      handle: async (db: Database, fields: KeyVal, data?: StrategyData) => {
        const { date: dateField, template = "" } = data as StrategyData;
        const templateFields = getTemplateFields(template);
        const errorPrefix = "obsidian.daily_notes_append handler: ";
        const yearToken = "{{ year }}";

        const fieldSources = [];
        for (const templateField of templateFields) {
          fieldSources.push(fields[templateField]);
        }

        // TODO: Move this check to isReady()
        if ([...new Set(Object.values(fieldSources))].length > 1) {
          throw new Error(
            `${errorPrefix}Multiple tables found for template fields: ${fieldSources.join(", ")}`
          );
        }

        const settingsPath = path.join(
          OBSIDIAN_PATH_TO_NOTES,
          ".obsidian",
          "daily-notes.json"
        );

        let noteSettings: DailyNotesSettings;
        try {
          noteSettings = JSON.parse(
            readFileSync(settingsPath, { encoding: "utf8" })
          ) as DailyNotesSettings;
        } catch (error) {
          throw new Error(
            `${errorPrefix}Could not read Obsidian settings at ${settingsPath}`
          );
        }

        let { folder: dailyFolder } = noteSettings;

        // TODO: Add this back as recipe option
        // const { template: dailyTemplate } = noteSettings;
        // const templateContent = readFileSync(
        //   path.join(OBSIDIAN_PATH_TO_NOTES, dailyTemplate) + ".md",
        //   { encoding: "utf8" }
        // );

        const dailyFolderParts = dailyFolder.split(path.sep);
        const maybeYearFolder = dailyFolderParts[dailyFolderParts.length - 1];
        const thisYear = new Date().getFullYear();

        // Looking for daily notes under yearly folders
        if ([thisYear, thisYear - 1].includes(parseInt(maybeYearFolder, 10))) {
          dailyFolderParts.pop();
          dailyFolderParts.push(yearToken);
          dailyFolder = path.join(OBSIDIAN_PATH_TO_NOTES, ...dailyFolderParts);
        }

        const results = await db.all(`
          SELECT ${dateField} ${templateFields.length ? `, ${templateFields.join(", ")}` : ""}
          FROM '${fieldSources[0]}'
          WHERE ${dateField} IS NOT NULL
        `);

        const dailyFiles: { [key: string]: string[] } = {};
        for (const result of results) {
          const thisDate = result[dateField as string];

          if (!thisDate) {
            // TODO: Need to populate date from dateTime
            continue;
          }

          const templateObject: { [key: string]: string | string[] } = {};
          templateFields.forEach((field) => {
            templateObject[field] = Array.isArray(result[field])
              ? // TODO: Move this logic to the pipeline
                // TODO: Why are the names duplicated?
                [...new Set((result[field] as []).flat(Infinity))]
              : (result[field] as string);
          });

          // TODO: Does not take into account date format setting in Obsidian
          const thisYear = thisDate.split("-")[0];
          mkdirSync(dailyFolder.replace(yearToken, thisYear), { recursive: true });
          const dailyNotePath = path.join(
            dailyFolder.replace(yearToken, thisYear),
            `${thisDate}.md`
          );

          if (!dailyFiles[dailyNotePath]) {
            dailyFiles[dailyNotePath] = [];
          }

          dailyFiles[dailyNotePath].push(
            mustache.render(template || "", templateObject) + " #pdpl"
          );
        }

        for (const dailyNotePath in dailyFiles) {
          const appendLines = [...new Set(dailyFiles[dailyNotePath])];

          let existingDailyContent = "";
          if (existsSync(dailyNotePath)) {
            existingDailyContent = readFileSync(dailyNotePath, { encoding: "utf8" });
          }
          // TODO: Add this back as recipe option, see above
          // else {
          //   existingDailyContent = `${templateContent}`;
          // }

          // TODO: Can't use #pdpl for everything
          const contentLines = existingDailyContent
            .split("\n")
            .filter((line) => !line.includes("#pdpl"));

          const addLine = !contentLines.length || contentLines.at(-1) === "" ? "" : "\n";

          writeFileSync(
            dailyNotePath,
            [
              ...contentLines,
              `${addLine}**Google Calendar events** #pdpl`,
              ...appendLines,
            ].join("\n")
          );
        }
      },
    },
  ],
};

export default handler;
