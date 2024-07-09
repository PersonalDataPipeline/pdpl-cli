import { homedir } from "os";
import path from "path";

export const DEFAULT_CONFIG_DIR = path.join(homedir(), ".pdpl");

export const DEFAULT_CONFIG_PATH = path.join(DEFAULT_CONFIG_DIR, "get.config.mjs");
