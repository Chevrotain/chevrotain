const baseConfig = require("../nyc.config")

module.exports = Object.assign(baseConfig, {
  // coverage was reduced due to the extraction from the main chevrotain package.
  // consider writing additional tests
  branches: 63,
  lines: 70,
  functions: 59,
  statements: 70
})
