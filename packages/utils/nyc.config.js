const baseConfig = require("../nyc.config")

module.exports = Object.assign(baseConfig, {
  // TODO: evaluate effort to hit 100%* coverage
  branches: 0,
  lines: 0,
  functions: 0,
  statements: 0
})
