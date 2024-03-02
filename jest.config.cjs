const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["./src"],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    "**/?(*.)+(spec).ts?(x)" 
  ],
  watchPathIgnorePatterns: [
    "src/scripts/test.ts"
  ]
};

module.exports = config;