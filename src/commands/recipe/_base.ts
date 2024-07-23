import { Args, Command, Flags, Interfaces } from "@oclif/core";

import getConfig, { Config } from "../../utils/config.js";
import { accessSync, constants, readFileSync } from "fs";
import path from "path";
import { DEFAULT_CONFIG_DIR } from "../../utils/constants.js";

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

export abstract class BaseCommand<T extends typeof Command> extends Command {
  static override baseFlags = {};

  protected flags!: Flags<T>;
  protected args!: Args<T>;
  protected conf!: Config;
  protected startMs!: number;
  protected recipe!: string;

  static override args = {
    RECIPE_NAME: Args.string({
      summary:
        "Direct path to a recipe or a recipe name used in the local or global recipe store",
      required: true,
    }),
  };

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

    const recipeName = this.args["RECIPE_NAME"] as string;

    let recipePath = "";
    try {
      // Treat the argument as a direct path to a recipe
      accessSync(recipeName, constants.R_OK);
      recipePath = recipeName;
    } catch (error) {
      // Check the local recipe store
      recipePath = path.join(DEFAULT_CONFIG_DIR, "recipes", `${recipeName}.yml`);
      try {
        accessSync(recipePath, constants.R_OK);
      } catch (error) {
        // Check the glocal recipe store
        recipePath = path.join(
          __dirname,
          "..",
          "..",
          "..",
          "recipes",
          `${recipeName}.yml`
        );
        try {
          accessSync(recipePath, constants.R_OK);
        } catch (error) {
          throw new Error("Recipe not found");
        }
      }
    }

    let recipeContent = "";
    try {
      recipeContent = readFileSync(recipePath, { encoding: "utf8" });
    } catch (error) {
      throw new Error(`Unknown recipe: ${recipeName}`);
    }

    this.recipe = recipeContent;
  }

  protected override async catch(err: Error & { exitCode?: number }) {
    await super.catch(err);
  }

  protected override async finally(_: Error | undefined) {
    this.log(`Run took ${Math.round(Date.now() - this.startMs) / 1000} seconds`);
    await super.finally(_);
  }
}
