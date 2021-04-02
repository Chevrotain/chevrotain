import { generateCstDts } from "../src/api"
import { BaseParser } from "chevrotain"
import { expect } from "chai"
import { readFileSync } from "fs"
import { resolve, relative, basename } from "path"

export function executeSampleTest(dirPath: string, parser: BaseParser) {
  it("Can generate type definition", () => {
    const result = generateCstDts(parser)
    const expectedOutputPath = getOutputFileForSnapshot(dirPath)
    const expectedOutput = readFileSync(expectedOutputPath).toString("utf8")
    const simpleNewLinesOutput = expectedOutput.replace(/\r\n/g, "\n")
    expect(result).to.equal(simpleNewLinesOutput)
  })
}

export function testNameFromDir(dirPath: string) {
  return basename(dirPath)
}

export function getOutputFileForSnapshot(libSnapshotDir: string) {
  const srcSnapshotDir = getSourceFilePath(libSnapshotDir)
  return resolve(srcSnapshotDir, "output.d.ts")
}

// paths are for compiled typescript
const packageDir = resolve(__dirname, "../..")
const libDir = resolve(packageDir, "lib")

function getSourceFilePath(libFilePath: string) {
  const relativeDirPath = relative(libDir, libFilePath)
  return resolve(packageDir, relativeDirPath)
}
