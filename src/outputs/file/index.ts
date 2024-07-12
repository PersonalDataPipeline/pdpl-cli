import { Database } from "duckdb-async";
import { writeFileSync } from "fs";
import path from "path";
import { stringify } from "csv-stringify/sync";

import { KeyVal, OutputHandler } from "../../utils/types.js";
import { arrayMissingValue } from "../../utils/array.js";
import { runDateUtc } from "../../utils/date-time.js";

const { DEFAULT_FILE_PATH = "" } = process.env;

////
/// Types
//

interface StrategyData {
  path?: string;
  filename?: string;
  fields?: string[];
}

////
/// Utilities
//
const strategyIsReady = (fields: object, data?: StrategyData) => {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Missing output data");
    return errors;
  }

  if (!data.fields || !Object.values(data.fields).length) {
    errors.push("Missing output fields");
    return errors;
  }

  if (!data.path && !DEFAULT_FILE_PATH) {
    errors.push("No file path to use");
  }

  const maybeMissingField = arrayMissingValue(Object.keys(fields), data.fields);
  if (maybeMissingField) {
    errors.push(`Found unknown field ${maybeMissingField}.`);
  }

  return errors;
};

////
/// Exports
//
const handler: OutputHandler = {
  isReady: () => true,
  handlers: [
    {
      name: () => "csv",
      isReady: strategyIsReady,
      handle: async (db: Database, fields: KeyVal, data?: StrategyData) => {
        const {
          path: outputPath = "",
          filename = `${runDateUtc().fileName}.csv`,
          fields: outputFields = [],
        } = data as StrategyData;

        const errorPrefix = "file.csv handler: ";

        const fieldSources = [];
        for (const templateField of outputFields) {
          fieldSources.push(fields[templateField]);
        }

        // TODO: Move this check to isReady()
        if ([...new Set(Object.values(fieldSources))].length > 1) {
          throw new Error(
            `${errorPrefix}Multiple tables found for template fields: ${fieldSources.join(", ")}`
          );
        }

        const results = await db.all(`
          SELECT ${outputFields.join(", ")}
          FROM '${fieldSources[0]}'
        `);

        const outputCsv = stringify(results);
        writeFileSync(path.join(outputPath, filename), outputCsv, { encoding: "utf8" });
      },
    },
  ],
};

export default handler;