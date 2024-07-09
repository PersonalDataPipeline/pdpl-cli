import { Command, Flags } from "@oclif/core";

import getConfig from "../../utils/config.js";

export default class ConfigGet extends Command {
  static override summary = "Get configuration";

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  static override flags = {
    json: Flags.boolean(),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConfigGet);
    const config: { [key: string]: any } = Object.assign({}, getConfig());
    console.log(
      "\nConfig file: " + (config["configFile"] ? config["configFile"] : "<none>") + "\n"
    );
    for (const option of ["configFile", "apisSupported", "importsSupported"]) {
      delete config[option];
    }
    console.log(flags.json ? JSON.stringify(config, null, 2) : config);
  }
}
