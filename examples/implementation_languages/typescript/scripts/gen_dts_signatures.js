/**
 * This is a minimal script that generates TypeScript definitions
 * from a Chevrotain parser.
 */
import { writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { generateCstDts } from "chevrotain"
import { productions } from "../typescript_json.js"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const dtsString = generateCstDts(productions)
const dtsPath = resolve(__dirname, "..", "json_cst.d.ts")
writeFileSync(dtsPath, dtsString)
