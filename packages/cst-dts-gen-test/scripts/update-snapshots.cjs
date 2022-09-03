const fs = require("fs-extra")
const path = require("path")
const glob = require("glob")
const api = require("@chevrotain/cst-dts-gen")
const sample_test = require("../lib/test/sample_test")

const inputFiles = glob.sync("../lib/test/snapshots/**/input.js", {
  cwd: __dirname,
  absolute: true
})

for (const inputFile of inputFiles) {
  const parser = require(inputFile).parser
  const result = api.generateCstDts(parser.getGAstProductions())

  const libSnapshotDir = path.dirname(inputFile)
  const expectedOutputPath =
    sample_test.getOutputFileForSnapshot(libSnapshotDir)

  fs.writeFileSync(expectedOutputPath, result)
}
