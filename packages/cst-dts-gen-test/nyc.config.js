const baseConfig = require("../nyc.config")
module.exports = {
  ...baseConfig,
  // hack to make nyc include coverage report from another package
  // this is needed because the tests here would create cyclic dependencies
  // if they would be part of `cst-dts-gen` as they import `chevrotain` and `chevrotain`
  // imports `cst-dts-gen`
  cwd: "..",
  include: ["cst-dts-gen/**"],
  exclude: ["cst-dts-gen/scripts"],
  all: true,
  extension: [".js", ".ts"]
}
