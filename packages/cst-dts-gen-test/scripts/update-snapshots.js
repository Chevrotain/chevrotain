import fs from "fs-extra"
import path, { dirname } from "path"
import glob from "glob"
import { generateCstDts } from "@chevrotain/cst-dts-gen"
import { getOutputFileForSnapshot } from "../lib/test/sample_test.js"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const inputFiles = glob.sync("../lib/test/snapshots/**/input.js", {
  cwd: __dirname,
  absolute: true
})

for (const inputFile of inputFiles) {
  const module = await import(inputFile)
  const parser = module.parser
  const result = generateCstDts(parser.getGAstProductions())

  const libSnapshotDir = path.dirname(inputFile)
  const expectedOutputPath = getOutputFileForSnapshot(libSnapshotDir)

  fs.writeFileSync(expectedOutputPath, result)
}
