import { ApiHandler } from "../../utils/types.js";
import { BaseCommand } from "./_base.js";

export default class Logs extends BaseCommand<typeof Logs> {
  static override summary = "Output all APIs";

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public override async run(): Promise<void> {
    console.log("Name", "URL", "Ready?", "Conf?", "Ep #", "Ep conf");

    for (const apiName of this.conf.apisSupported) {
      const { default: handler } = (await import(`../../apis/${apiName}/index.js`)) as {
        default: ApiHandler;
      };

      const isConfigured = Object.keys(this.conf.apis).includes(apiName);

      console.log(
        handler.getApiName(),
        handler.getApiBaseUrl(),
        handler.isReady() ? "yes" : "no",
        isConfigured ? "yes" : "no",
        handler.endpointsPrimary.length,
        !isConfigured
          ? "-"
          : this.conf.apis[apiName] === true
            ? handler.endpointsPrimary.length
            : (this.conf.apis[apiName] as []).length
      );
    }
  }
}
