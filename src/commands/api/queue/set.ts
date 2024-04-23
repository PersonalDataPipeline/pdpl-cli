import { ApiHandler, EpHistoric } from "../../../utils/types.js";
import { ApiBaseCommand, apiNameArg } from "../_base.js";
import * as queue from "../../../utils/queue.js";
import { getEpochNow } from "../../../utils/date-time.js";
import { Flags } from "@oclif/core";

export default class ApiQueueSet extends ApiBaseCommand<typeof ApiQueueSet> {
  static override summary = "Initialize the queue for an API";

  static override examples = [
    "<%= config.bin %> <%= command.id %> API_NAME",
    "<%= config.bin %> <%= command.id %> API_NAME --standard-only",
    "<%= config.bin %> <%= command.id %> API_NAME --historic-only",
    "<%= config.bin %> <%= command.id %> API_NAME --endpoint --run-now",
  ];

  static override args = {
    ...apiNameArg,
  };

  static override flags = {
    "standard-only": Flags.boolean({
      char: "s",
      summary: "Only initialize standard entries",
      default: false,
      exclusive: ["historic-only"],
    }),
    "historic-only": Flags.boolean({
      char: "h",
      summary: "Only initialize historic entries",
      default: false,
      exclusive: ["standard-only"],
    }),
    "run-now": Flags.boolean({
      summary: "Set the run after time to now",
      default: false,
    }),
    "endpoint": Flags.string({
      char: "e",
      summary: "Only initialize a specific endpoint",
    }),
  };

  public override async run(): Promise<void> {
    const {
      "endpoint": endpointFlag,
      "historic-only": historicOnly,
      "standard-only": standardOnly,
      "run-now": runNow,
    } = this.flags;

    const { default: handler } = (await import(
      `../../../apis/${this.args.apiName}/index.js`
    )) as {
      default: ApiHandler;
    };

    queue.loadQueue(handler);

    const allEndpoints = handler.endpointsPrimary.map((ep) => ep.getEndpoint());
    
    if (endpointFlag && !allEndpoints.includes(endpointFlag)) {
      throw new Error(`Unsupported API endpoint "${endpointFlag}"`);
    }
    
    for (const endpointHandler of handler.endpointsPrimary) {
      const endpointName = endpointHandler.getEndpoint();
      
      if (endpointFlag && endpointFlag !== endpointName) {
        continue;
      }
      
      if (!historicOnly) {
        const hasStandard = queue.hasStandardEntryFor(endpointName);
        if (hasStandard) {
          if (runNow) {
            queue.updateStandardEntry(endpointHandler, getEpochNow());
            console.log(`Updated existing standard entry for ${endpointName} to run now`);
          } else {
            console.log(`Standard entry for ${endpointName} already exists`);
          }
        } else {
          console.log(`Adding initial standard entry for ${endpointName}`);
          queue.addEntry({
            endpoint: endpointName,
            runAfter: getEpochNow(),
            historic: false,
            params: endpointHandler.getParams ? endpointHandler.getParams() : {},
          });
        }
      }

      if (!standardOnly) {
        const hasHistoric = queue.hasHistoricEntryFor(endpointName);
        if (hasHistoric) {
          if (runNow) {
            queue.updateHistoricEntry({
              endpoint: endpointName,
              runAfter: getEpochNow(),
            });
            console.log(`Updated existing historic entry for ${endpointName} to run now`);
          } else {
            console.log(`Historic entry for ${endpointName} already exists`);
          }
        } else if (endpointHandler.isHistoric()) {
          console.log(`Adding initial historic entry for ${endpointName}`);
          queue.addEntry({
            endpoint: endpointName,
            runAfter: getEpochNow(),
            historic: true,
            params: (endpointHandler as EpHistoric).getHistoricParams(),
          });
        }
      }
    }
  }
}
