import { Flags } from "@oclif/core";

import { ApiHandler } from "../../../utils/types.js";
import { ApiBaseCommand, apiNameArg } from "../_base.js";
import { getEpochNow } from "../../../utils/date-time.js";
import * as queue from "../../../utils/queue.js";
import logger from "../../../utils/logger.js";

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
      const logEntry = {
        apiName: this.args.apiName,
        endpoint: endpointName,
      };

      if (endpointFlag && endpointFlag !== endpointName) {
        continue;
      }

      if (!historicOnly && !endpointHandler.isHistoric()) {
        if (queue.hasStandardEntryFor(endpointName)) {
          let message = `Standard entry already exists`;
          if (runNow) {
            queue.updateStandardEntry(endpointHandler, getEpochNow());
            message = `Updated existing standard entry to run now`;
          }
          logger.info({ ...logEntry, message });
        } else {
          queue.addEntry({
            endpoint: endpointName,
            runAfter: getEpochNow(),
            historic: false,
          });
          logger.info({
            ...logEntry,
            message: `Added standard entry`,
          });
        }
      }

      if (!standardOnly && endpointHandler.isHistoric()) {
        if (queue.hasHistoricEntryFor(endpointName)) {
          let message = `Historic entry already exists`;
          if (runNow) {
            queue.updateHistoricEntry({
              endpoint: endpointName,
              runAfter: getEpochNow(),
            });
            message = `Updated existing historic entry to run now`;
          }
          logger.info({ ...logEntry, message });
        } else {
          queue.addEntry({
            endpoint: endpointName,
            runAfter: getEpochNow(),
            historic: true,
          });
          logger.info({
            ...logEntry,
            message: `Added historic entry`,
          });
        }
      }
    }
  }
}
