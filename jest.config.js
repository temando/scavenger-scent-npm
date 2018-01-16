module.exports = {
  "collectCoverageFrom": [
    "src/**/*",
    "!src/types*"
  ],
  "logHeapUsage": true,
  "mapCoverage": true,
  "moduleDirectories": [
    "node_modules"
  ],
  "moduleFileExtensions": [
    "ts",
    "js",
    "json"
  ],
  "testRegex": "\\.test\\.ts$",
  "testEnvironment": "node",
  "transform": {
    ".(ts)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
  },
  "verbose": true
}
