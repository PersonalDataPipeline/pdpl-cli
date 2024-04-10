import { Args, Command, Flags, Interfaces } from "@oclif/core";

import logger from "../../utils/logger.js";
import getConfig, { Config } from "../../utils/config.js";

////
/// Types
//

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)["baseFlags"] & T["flags"]
>;

export type Args<T extends typeof Command> = Interfaces.InferredArgs<T["args"]>;

////
/// Exports
//

export const apiNameArg = {
  apiName: Args.string({
    required: true,
    name: "APINAME",
  }),
};

export abstract class BaseCommand<T extends typeof Command> extends Command {
  static override baseFlags = {};

  static override args = {
    apiName: Args.string({
      required: true,
      name: "APINAME",
    }),
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;
  protected conf!: Config;

  public override async init(): Promise<void> {
    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      args: this.ctor.args,
      strict: true,
    });

    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;
    this.conf = getConfig();

    if (!this.conf.apisSupported.includes(args["apiName"] as string)) {
      throw new Error(`API "${args["apiName"]}" is not supported`);
    }

    const configuredApis = Object.keys(this.conf.apis);
    if (!configuredApis.includes(args["apiName"] as string)) {
      throw new Error(`API "${args["apiName"]}" is not configured to be run`);
    }
  }

  protected override async catch(err: Error & { exitCode?: number }) {
    await super.catch(err);
    logger.error({ stage: "startup", error: err.message });
  }

  protected override async finally(_: Error | undefined) {
    await super.finally(_);
    logger.shutdown();
  }
}
