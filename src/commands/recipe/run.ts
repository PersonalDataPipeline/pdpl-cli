import yaml from "js-yaml";
import { Database } from "duckdb-async";

import { BaseCommand } from "./_base.js";
import { RecipeObject, validateRecipe } from "../../utils/validate-recipe.js";
import transformations from "../../utils/transformations.js";
import { KeyVal } from "../../utils/types.js";

const { EXPORT_DB_PATH } = process.env;

export default class RecipeRun extends BaseCommand<typeof RecipeRun> {
  static override summary = "Process data using recipes";

  public async run(): Promise<void> {
    const recipe: RecipeObject = await validateRecipe(
      yaml.load(this.recipe) as object,
      this.conf
    );

    const duckDb = await Database.create(":memory:");
    const dbConn = await duckDb.connect();

    ////
    /// Load input data
    //
    const describeTables: { [key: string]: KeyVal } = {};
    for (const source in recipe.sources) {
      const [inputName, inputData] = source.split(".");
      const dataPath = recipe.sources[source];
      const inputFields = recipe.input[inputName][inputData];

      const select = [];
      for (const sourceName in inputFields) {
        const columnName = inputFields[sourceName];

        if (sourceName.includes("[]")) {
          const sourceParts = sourceName.split("[]");
          select.push(
            `list_transform(${sourceParts.shift()}, x -> x${sourceParts.join(".")}) AS ${columnName}`
          );
          continue;
        }

        if (sourceName.includes(".")) {
          const sourceParts = sourceName.split(".");
          select.push(
            `${sourceParts.shift()}->>'${sourceParts.join("'->>'")}' AS ${columnName}`
          );
          continue;
        }

        select.push(`${sourceName} AS ${columnName}`);
      }

      const readJsonOptions = [
        "union_by_name = true",
        "convert_strings_to_integers = true",
        "format = 'array'",
        "records = true",
      ].join(", ");

      // TODO: Need to filter out the list of files to just the most recent
      await duckDb.all(`
        CREATE TABLE '${source}' AS
        SELECT ${select.join(",")}
        FROM read_json_auto('${dataPath}/*.json', ${readJsonOptions});
        
        CREATE SEQUENCE IF NOT EXISTS seq_id START WITH 1;

        ALTER TABLE '${source}' 
        ADD COLUMN _id INTEGER DEFAULT nextval('seq_id');
      `);

      const description = await duckDb.all(`DESCRIBE TABLE '${source}'`);
      describeTables[source] = {
        ...Object.fromEntries([
          ...description.map((table) => [
            table["column_name"] as string,
            table["column_type"] as string,
          ]),
        ]),
      } as KeyVal;
    }

    ////
    /// Process pipeline
    //
    for (const action of recipe.pipeline || []) {
      const {
        field: fromField,
        transform = [],
        toField = fromField,
        linkTo,
        toFieldUpdateIfEmpty,
      } = action;
      const source = recipe.fields[fromField];
      const fieldType = describeTables[source][fromField];

      const results = await duckDb.all(`
        SELECT _id, ${fromField} FROM '${source}'
      `);

      if (linkTo) {
        const linkSource = recipe.fields[linkTo];
        const linkToType = describeTables[linkSource][linkTo];
        const linkFields = Object.keys(describeTables[linkSource]).filter(
          (field) => field !== "_id"
        );

        let onStatement = "";
        if (linkToType === fieldType) {
          if (fieldType.slice(-2) === "[]") {
            // Intersection (value in one list appears in the other list)
            onStatement = `len(list_intersect(${fromField}, ${linkTo})) > 0`;
          } else {
            // Equality (columns are the same type)
            onStatement = `${fromField} = ${linkTo}`;
          }
        } else if (fieldType.slice(-2) === "[]" && linkToType.slice(-2) !== "[]") {
          // Inclusion (value in linkTo appears in fromField list)
          onStatement = `list_contains(${fromField}, ${linkTo})`;
        } else if (fieldType.slice(-2) !== "[]" && linkToType.slice(-2) === "[]") {
          // Inclusion (value in fromField appears in linkTo list)
          onStatement = `list_contains(${linkTo}, ${fromField})`;
        } else {
          throw new Error(
            `Pipeline execution: Cannot link ${fieldType} to ${linkToType}`
          );
        }

        for (const linkField of linkFields) {
          const newColumnType = describeTables[linkSource][linkField];
          const newFieldColumn = linkField + "__LINKED";

          await duckDb.all(`
            ALTER TABLE '${source}' 
            ADD COLUMN ${newFieldColumn} ${newColumnType}[];
          `);

          describeTables[source][newFieldColumn] = newColumnType;
          recipe.fields[newFieldColumn] = source;

          await duckDb.all(`
            UPDATE "${source}"
            SET ${newFieldColumn} = (
              SELECT list(${linkField})
              FROM "${linkSource}"
              WHERE ${onStatement}
            );
          `);
        }
        continue;
      }

      // Adding a new column instead of transforming in place
      if (toField !== fromField) {
        // TODO: Need to account for types
        await duckDb.all(`
          ALTER TABLE '${source}'
          ADD COLUMN ${toField} VARCHAR DEFAULT NULL
        `);
      }

      for (const result of results) {
        let value = result[fromField] as string;
        for (const tranf of transform) {
          value = transformations[tranf](value);
        }

        let statement;
        if (toFieldUpdateIfEmpty) {
          // TODO: Need to account for types
          statement = await dbConn.prepare(`
            UPDATE '${source}'
            SET ${toFieldUpdateIfEmpty} = ?::STRING
            WHERE _id = ?::INTEGER
              AND (${toFieldUpdateIfEmpty} = '') IS NOT FALSE
          `);
        } else {
          // TODO: Need to account for types
          statement = await dbConn.prepare(`
            UPDATE '${source}'
            SET ${toField} = ?::STRING
            WHERE _id = ?::INTEGER
          `);
        }

        await statement.all(value, result["_id"]);
      }
    }

    for (const handler of recipe.handlers) {
      await handler.handler(duckDb, recipe.fields, handler.data);
    }

    if (EXPORT_DB_PATH) {
      await duckDb.all(`EXPORT DATABASE '${EXPORT_DB_PATH}' (FORMAT CSV)`);
    }
  }
}
