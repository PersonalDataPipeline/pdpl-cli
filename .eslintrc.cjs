/* globals module, __dirname */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  root: true,
  overrides: [
    {
      files: ["*.spec.*"],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    }
  ]
};
