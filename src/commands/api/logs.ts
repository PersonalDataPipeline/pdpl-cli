import { Flags } from "@oclif/core";
import path from "path";

import { BaseCommand } from "./_base.js";
import getConfig from "../../utils/config.js";
import { readDirectory, readFile } from "../../utils/fs.js";
import { getFormattedDate, getFormattedTime } from "../../utils/date-time.js";
import { RunLogFile } from "../../utils/logger.js";

export default class Logs extends BaseCommand<typeof Logs> {
  static override summary = "child class that extends BaseCommand";

  static override flags = {
    "number": Flags.integer({
      char: "n",
      summary: "Number of logs to print",
      description:
        `Indicates the number of log files to process and count. ` +
        `Log file are sorted descending by date, starting with the most recent. `,
      default: 25,
    }),
    "errors-only": Flags.boolean({
      aliases: ["error-only"],
      summary: "Only show logs with errors",
      description: `Pulls the number of logs, then filters out all logs that do not have an error. `,
      default: false,
    }),
  };

  static override examples = [
    "<%= config.bin %> <%= command.id %> API_NAME",
    "<%= config.bin %> <%= command.id %> API_NAME --errors-only",
    "<%= config.bin %> <%= command.id %> API_NAME -n 50",
  ];

  public override async run(): Promise<void> {
    const { apiName } = this.args;
    const { "number": numberToDisplay, "errors-only": errOnly } = this.flags;
    const apiLogsPath = path.join(getConfig().outputDir, apiName, "_runs");

    const logFiles = readDirectory(apiLogsPath)
      .sort((a, b) => (a > b ? -1 : b > a ? 1 : 0))
      .slice(0, numberToDisplay);

    console.log("");
    console.log(`Date       | Time     | Err |${errOnly ? "" : " Suc |"} Filename`);
    console.log(`-----------|----------|-----|${errOnly ? "" : "-----|"}---------`);

    for (const logFile of logFiles) {
      const log = readFile(path.join(apiLogsPath, logFile));

      const { dateTime, entries } = JSON.parse(log) as RunLogFile;
      const dateLocal = new Date(dateTime);
      const date = getFormattedDate(0, dateLocal);
      const time = getFormattedTime(dateLocal);

      const errCount = entries.filter((entry) => entry.type === "error").length;

      if (errOnly && !errCount) {
        continue;
      }

      const errPad = errCount < 10 ? "  " : " ";
      const sucCount = entries.filter((entry) => entry.type === "success").length;
      const sucPad = sucCount < 10 ? "  " : " ";
      console.log(
        date,
        "|",
        time,
        "|",
        `${errCount} ${errPad}|`,
        errOnly ? "" : `${sucCount} ${sucPad}|`,
        logFile
      );
    }
    console.log("");
  }
}
