import CliTable3 from "cli-table3";
import { ApiHandler } from "../../utils/types.js";
import { BaseCommand } from "./_base.js";

export default class Logs extends BaseCommand<typeof Logs> {
  static override summary = "Output all APIs";

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public override async run(): Promise<void> {
    const table = new CliTable3({
      head: ["Name", "URL", "Ready?", "Conf?", "Ep #", "Ep conf"],
    });

    for (const apiName of this.conf.apisSupported) {
      const { default: handler } = (await import(`../../apis/${apiName}/index.js`)) as {
        default: ApiHandler;
      };

      const isConfigured = Object.keys(this.conf.apis).includes(apiName);
      table.push([
        handler.getApiName(),
        handler.getApiBaseUrl(),
        handler.isReady() ? "yes" : "no",
        isConfigured ? "yes" : "no",
        handler.endpointsPrimary.length,
        !isConfigured
          ? "-"
          : this.conf.apis[apiName] === true
            ? handler.endpointsPrimary.length
            : (this.conf.apis[apiName] as []).length,
      ]);
    }

    console.log(table.toString());
  }
}
