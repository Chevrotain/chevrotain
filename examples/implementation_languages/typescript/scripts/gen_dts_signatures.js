/**
 * This is a minimal script that generates TypeScript definitions
 * from a Chevrotain parser.
 */
const { writeFileSync } = require("fs")
const { resolve } = require("path")
const { generateCstDts } = require("chevrotain")
const { productions } = require("../typescript_json")

const dtsString = generateCstDts(productions)
const dtsPath = resolve(__dirname, "..", "json_cst.d.ts")
writeFileSync(dtsPath, dtsString)
