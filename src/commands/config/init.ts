import { Command } from "@oclif/core";
import { existsSync, mkdirSync, writeFileSync } from "fs";

import getConfig from "../../utils/config.js";
import { DEFAULT_CONFIG_DIR, DEFAULT_CONFIG_PATH } from "../../utils/constants.js";

export default class ConfigInit extends Command {
  static override summary = "Initialize configuration file";

  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    if (!existsSync(DEFAULT_CONFIG_DIR)) {
      mkdirSync(DEFAULT_CONFIG_DIR);
    }
    if (!existsSync(DEFAULT_CONFIG_PATH)) {
      writeFileSync(DEFAULT_CONFIG_PATH, "export default {}", { encoding: "utf8" });
      console.log(`Created config file ${DEFAULT_CONFIG_PATH}`);
    } else {
      console.log(`Config file ${DEFAULT_CONFIG_PATH} already exists`);
    }

    getConfig();
  }
}
