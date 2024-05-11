import { ApiHandler, EpHistoric } from "../../utils/types.js";
import { ApiBaseCommand, apiNameArg } from "./_base.js";
import path from "path";

export default class ApiInfo extends ApiBaseCommand<typeof ApiInfo> {
  static override summary = "Display info for a specific API";
  static override examples = ["<%= config.bin %> <%= command.id %> API_NAME"];

  static override args = {
    ...apiNameArg,
  };

  public override async run(): Promise<void> {
    const { default: apiHandler } = (await import(
      `../../apis/${this.args.apiName}/index.js`
    )) as {
      default: ApiHandler;
    };

    console.log(`API handler for ${apiHandler.getApiName()}`);
    console.log(`Base URL: ${apiHandler.getApiBaseUrl()}`);

    console.log(`Primary endpoints:`);
    for (const endpoint of apiHandler.endpointsPrimary) {
      const params = typeof endpoint.getParams === "function" ? endpoint.getParams() : {};
      const histParams = endpoint.isHistoric()
        ? (endpoint as EpHistoric).getHistoricParams()
        : params;
      const histDelay = endpoint.isHistoric()
        ? (endpoint as EpHistoric).getHistoricDelay()
        : endpoint.getDelay();
      console.log(``);
      console.log(`  | Endpoint: ${endpoint.getEndpoint()}`);
      console.log(
        `  | Standard params: ${new URLSearchParams(params as Record<string, string>).toString()}`
      );
      console.log(`  | Standard delay in seconds: ${endpoint.getDelay()}`);
      console.log(
        `  | Historic params: ${new URLSearchParams(histParams as Record<string, string>).toString()}`
      );
      console.log(`  | Historic delay in seconds: ${histDelay}`);
      console.log(
        `  | Directory: ${path.join(this.conf.outputDir, this.args.apiName, endpoint.getDirName())}`
      );
    }
  }
}
