import CliTable3 from "cli-table3";
import { ApiHandler } from "../../utils/types.js";
import { BaseCommand, apiNameArg } from "./_base.js";
import * as queue from "../../utils/queue.js";

export default class Logs extends BaseCommand<typeof Logs> {
  static override summary = "Show the queue for an API";

  static override examples = ["<%= config.bin %> <%= command.id %> API_NAME"];

  static override args = {
    ...apiNameArg,
  };

  public override async run(): Promise<void> {
    const table = new CliTable3({
      head: ["Endpoint", "Next run (your time)", "Historic", "Params"],
    });

    const { default: handler } = (await import(
      `../../apis/${this.args.apiName}/index.js`
    )) as {
      default: ApiHandler;
    };

    queue.loadQueue(handler);

    for (const entry of queue.getQueue()) {
      table.push([
        entry.endpoint,
        new Date(entry.runAfter * 1000).toLocaleString(),
        entry.historic ? "yes" : "no",
        JSON.stringify(entry.params)
          .replaceAll(",", "\n")
          .replaceAll('":', " = ")
          .replaceAll('"', "")
          .replace("{}", "None")
          .replaceAll("{", "")
          .replaceAll("}", ""),
      ]);
    }

    console.log(table.toString());
  }
}
