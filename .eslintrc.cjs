/* globals module, __dirname */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  root: true,
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-floating-promises": "warn",
    "@typescript-eslint/no-misused-promises": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
  },
  overrides: [
    {
      files: ["*.spec.*"],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    }
  ]
};