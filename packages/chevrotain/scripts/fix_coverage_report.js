/**
 * this script adds istanbul ignore comments to the compiled JS sources.
 * For some strange reason this is only needed for interpreter.js
 * In other compiled files there are no issues.
 * TODO: Try to remove this script in the future, perhaps it is a bug in TS source maps or nyc instrumentation.
 */
const fs = require("fs-extra")
const path = require("path")

const interPath = path.resolve(
    __dirname,
    "../lib/src/parse/grammar/interpreter.js"
)

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
