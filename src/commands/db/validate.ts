import yaml from "js-yaml";

import { DbBaseCommand } from "./_base.js";
import { validateTable } from "../../utils/validate-table.js";
import { readDirectory, readFile } from "../../utils/fs.js";
import getConfig from "../../utils/config.js";
import { Flags } from "@oclif/core";
import path from "path";

export default class TablesValidate extends DbBaseCommand<typeof DbBaseCommand> {
  static override summary = "Run validations for table transforms";

  static override examples = [
    "<%= config.bin %> <%= command.id %> API_NAME",
    "<%= config.bin %> <%= command.id %> API_NAME --table API_NAME",
  ];

  static override flags = {
    table: Flags.string({
      char: "t",
      summary: "Only validate a specific table",
    }),
  };

  public async run(): Promise<void> {
    const { tablesInputDir } = getConfig();
    const { table: tableFlag }: Record<string, string> = this.flags;
    const tables = readDirectory(getConfig().tablesInputDir)
      .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
      .filter(
        (file) => !tableFlag || file.split(".").slice(0, -1).join(".") === tableFlag
      );

    if (!tables.length) {
      throw new Error(
        `No tables to process from ${tablesInputDir}${tableFlag ? ` > ${tableFlag}` : ""}`
      );
    }

    for (const table of tables) {
      const tablePath = path.join(tablesInputDir, table);
      const tableRaw = readFile(tablePath);
      await validateTable(yaml.load(tableRaw) as object, this.conf);
    }
    this.log("✅ Validation complete");
  }
}
