import { Command } from "@oclif/core";
import { existsSync, mkdirSync, writeFileSync } from "fs";

import getConfig, { defaultConfigDir, defaultConfigPath } from "../../utils/config.js";

export default class ConfigInit extends Command {
  static override summary = "Initialize configuration file";

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    if (!existsSync(defaultConfigDir)) {
      mkdirSync(defaultConfigDir);
    }
    if (!existsSync(defaultConfigPath)) {
      writeFileSync(defaultConfigPath, "export default {}", { encoding: "utf8" });
      console.log(`Created config file ${defaultConfigPath}`);
    } else {
      console.log(`Config file ${defaultConfigPath} already exists`);
    }

    getConfig();
  }
}
