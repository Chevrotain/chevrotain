/**
 * this script adds istanbul ignore comments to the compiled JS sources.
 * For some strange reason this is only needed for interpreter.js
 * In other compiled files there are no issues.
 * TODO: Try to remove this script in the future, perhaps it is a bug in TS source maps or nyc instrumentation.
 *      - 23/02/19 still broken with TypeScript 3.3.0
 */
const fs = require("fs-extra")
const path = require("path")

// call to ignore errors introduced by TS downleveling class inheritance to ES5
function fixClassConstructorSuperCalls(filePath) {
  const interPath = path.resolve(__dirname, filePath)

  const interString = fs.readFileSync(interPath, "utf8").toString()
  let fixedInterString = interString.replace(
    "var __extends =",
    "/* istanbul ignore next */ var __extends ="
  )

  fixedInterString = fixedInterString.replace(
    /\|\| this/g,
    "/* istanbul ignore next */ || this"
  )

  fs.writeFileSync(interPath, fixedInterString)
}

fixClassConstructorSuperCalls("../lib/src/parse/exceptions_public.js")
fixClassConstructorSuperCalls("../lib/src/parse/grammar/interpreter.js")
