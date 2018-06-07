/**
 * This script copies api.d.ts to the lib folder and modifies
 * the access level of some class methods to "protected"
 *
 * This is because the concept of "protected" interface methods
 * Is not supported in TypeScript as it does not make sense...
 */
const fs = require("fs-extra")
const path = require("path")

const apiPath = path.resolve(__dirname, "../api.d.ts")
const apiString = fs.readFileSync(apiPath, "utf8").toString()

let fixedApiString = apiString.replace(/\/\* protected \*\//g, "protected")
fixedApiString = fixedApiString.replace(
    /\/\* protected \* static\//g,
    "protected static"
)

const apiLibPath = path.resolve(__dirname, "../lib/chevrotain.d.ts")
fs.writeFileSync(apiLibPath, fixedApiString)
