/**
 * nyc config for merged whole mono-repo coverage report
 */
const { dirname, resolve } = require("path")
const glob = require("glob")
const defaultsExcludes = require("@istanbuljs/schema").defaults.nyc.exclude

let allExcludes = []
// read all the exclusion from the sub-packages to avoid duplication
glob.sync("packages/*/nyc.config.js").forEach((nycConfigPath) => {
  const packageDir = dirname(nycConfigPath)
  const configVal = require(resolve(__dirname, nycConfigPath))
  const customExcludes = configVal.exclude.filter(
    (_) => !defaultsExcludes.includes(_)
  )
  const customExcludesAdjusted = customExcludes.map((_) => packageDir + "/" + _)
  allExcludes = [...allExcludes, ...customExcludesAdjusted]
})

module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  include: "**/src/**",
  exclude: allExcludes,
  // - https://reflectoring.io/100-percent-test-coverage/
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  // To enable **merged** coverage report all relevant file extensions must be listed.
  extension: [".js", ".ts"]
}
