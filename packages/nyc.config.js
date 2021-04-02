const defaults = require("@istanbuljs/schema").defaults

module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  // https://reflectoring.io/100-percent-test-coverage/
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  exclude: ["scripts/**"].concat(defaults.nyc.exclude)
}
