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
  ]
};

module.exports = config;