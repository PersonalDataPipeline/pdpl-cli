import { Args, Command, Flags, Interfaces } from "@oclif/core";

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

export const importNameArg = {
  importName: Args.string({
    required: true,
    name: "APINAME",
  }),
};

export abstract class BaseCommand<T extends typeof Command> extends Command {
  static override baseFlags = {};

  protected flags!: Flags<T>;
  protected args!: Args<T>;
  protected conf!: Config;
  protected startMs!: number;

  public override async init(): Promise<void> {
    this.startMs = Date.now();
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
  }

  protected override async catch(err: Error & { exitCode?: number }) {
    await super.catch(err);
  }

  protected override async finally(_: Error | undefined) {
    this.log(`Run took ${Math.round(Date.now() - this.startMs) / 1000} seconds`);
    await super.finally(_);
  }
}
