const fs = require("fs")
const jf = require("jsonfile")
const path = require("path")

const versionPath = path.join(__dirname, "../src/version.ts")
const packagePath = path.join(__dirname, "../package.json")

const mainReadmePath = path.join(__dirname, "../../../README.md")

const pkgJson = jf.readFileSync(packagePath)
const apiString = fs.readFileSync(versionPath, "utf8").toString()

module.exports = {
  versionPath: versionPath,
  packagePath: packagePath,
  readmePath: mainReadmePath,
  pkgJson: pkgJson,
  apiString: apiString,
  currVersion: pkgJson.version
}
