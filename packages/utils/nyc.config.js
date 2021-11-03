const baseConfig = require("../nyc.config")

module.exports = {
  ...baseConfig,
  exclude: [
    ...baseConfig.exclude,
    // possible to test using mocks but not worth it.
    "src/print.ts",
    // not possible to test without diving into V8 internals
    "src/to-fast-properties.ts"
  ]
}
