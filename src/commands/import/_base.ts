import { Args, Command, Flags, Interfaces } from "@oclif/core";

import logger from "../../utils/logger.js";
import getConfig, { Config } from "../../utils/config.js";

////
/// Types
//

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof ImportBaseCommand)["baseFlags"] & T["flags"]
>;

export type Args<T extends typeof Command> = Interfaces.InferredArgs<T["args"]>;

////
/// Exports
//

export const importNameArg = {
  importName: Args.string({
    required: true,
    name: "APINAME",
  }),
};

export abstract class ImportBaseCommand<T extends typeof Command> extends Command {
  static override baseFlags = {};

  protected flags!: Flags<T>;
  protected args!: Args<T>;
  protected conf!: Config;

  public override async init(): Promise<void> {
    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof ImportBaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      args: this.ctor.args,
      strict: true,
    });

    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;
    this.conf = getConfig();

    // This arg is required when included, see above for definition
    if (args["importName"]) {
      if (!this.conf.importsSupported.includes(args["importName"] as string)) {
        throw new Error(`Import "${args["importName"]}" is not supported`);
      }

      if (!this.conf.imports.includes(args["importName"] as string)) {
        throw new Error(
          `Import "${args["importName"]}" is ready but could not be found in local configuration`
        );
      }
    }
  }

  protected override async catch(err: Error & { exitCode?: number }) {
    await super.catch(err);
    logger.error({ error: err.message });
  }

  protected override async finally(_: Error | undefined) {
    await super.finally(_);
    logger.shutdown(this.args["importName"] as string);
  }
}
