import { ApiHandler } from "../../utils/types.js";
import { BaseCommand, apiNameArg } from "./_base.js";

export default class ApiCurl extends BaseCommand<typeof ApiCurl> {
  static override summary = "Build cURL commands for all API endpoints";

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

    let curlCommand = "curl";

    const authHeaders: { [key: string]: string } = await apiHandler.getApiAuthHeaders();
    for (const header in authHeaders) {
      curlCommand += ` -H "${header}: ${authHeaders[header]}"`;
    }

    for (const epHandler of apiHandler.endpointsPrimary) {
      console.log(
        `${curlCommand} ${apiHandler.getApiBaseUrl() + epHandler.getEndpoint()}`
      );
    }
  }
}
