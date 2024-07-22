import type { Mock } from "vitest";

import { readFileSync, writeFileSync } from "fs";
import { envWrite } from "./fs.js";
import { DEFAULT_CONFIG_DIR } from "./constants.js";
import path from "path";

////
/// Mocks
//

vi.mock("./fs.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./fs.js")>()),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

////
/// Helpers
//

const envPath = path.join(DEFAULT_CONFIG_DIR, ".env");

////
/// Tests
//

describe("File system", () => {
  beforeEach(() => {});

  describe("envWrite", () => {
    beforeEach(() => {});

    it("appends the value", () => {
      (readFileSync as Mock).mockImplementation(() => "");
      envWrite("ENV_VAR_NAME_1", "ENV_VAR_VALUE_1");
      expect(writeFileSync).toBeCalledWith(envPath, '\nENV_VAR_NAME_1="ENV_VAR_VALUE_1"');
    });

    it("keeps existing content", () => {
      (readFileSync as Mock).mockImplementation(() => 'ENV_VAR_NAME_1="ENV_VAR_VALUE_1"');
      envWrite("ENV_VAR_NAME_2", "ENV_VAR_VALUE_2");
      expect(writeFileSync).toBeCalledWith(
        envPath,
        'ENV_VAR_NAME_1="ENV_VAR_VALUE_1"\nENV_VAR_NAME_2="ENV_VAR_VALUE_2"'
      );
    });

    it("replaces existing values with double quotes", () => {
      (readFileSync as Mock).mockImplementation(
        () => 'ENV_VAR_NAME_1="REPLACE_ME_VALUE"'
      );
      envWrite("ENV_VAR_NAME_1", "ENV_VAR_VALUE_2", "REPLACE_ME_VALUE");
      expect(writeFileSync).toBeCalledWith(envPath, 'ENV_VAR_NAME_1="ENV_VAR_VALUE_2"');
    });

    it("replaces existing values with single quotes", () => {
      (readFileSync as Mock).mockImplementation(
        () => "ENV_VAR_NAME_1='REPLACE_ME_VALUE'"
      );
      envWrite("ENV_VAR_NAME_1", "ENV_VAR_VALUE_2", "REPLACE_ME_VALUE");
      expect(writeFileSync).toBeCalledWith(envPath, 'ENV_VAR_NAME_1="ENV_VAR_VALUE_2"');
    });

    it("replaces existing values with no quotes", () => {
      (readFileSync as Mock).mockImplementation(() => "ENV_VAR_NAME_1=REPLACE_ME_VALUE");
      envWrite("ENV_VAR_NAME_1", "ENV_VAR_VALUE_2", "REPLACE_ME_VALUE");
      expect(writeFileSync).toBeCalledWith(envPath, 'ENV_VAR_NAME_1="ENV_VAR_VALUE_2"');
    });
  });
});
