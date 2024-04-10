import { Command, Flags } from "@oclif/core";

import getConfig from "../utils/config.js";

export default class Config extends Command {
  static override summary = "Output log stats";

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  static override flags = {
    json: Flags.boolean(),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Config);
    const config = getConfig();
    console.log(flags.json ? JSON.stringify(config, null, 2) : config);
  }
}
