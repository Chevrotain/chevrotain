var fs = require("fs")
var jf = require("jsonfile")
var path = require("path")
var _ = require("lodash")
var wrench = require("wrench")

var versionPath = path.join(__dirname, "../src/version.ts")
var packagePath = path.join(__dirname, "../package.json")
var changeLogPath = path.join(__dirname, "../CHANGELOG.md")

// docs (.md files for bumping versions)
var docsDirPath = path.join(__dirname, "../docs")
var docFiles = wrench.readdirSyncRecursive(docsDirPath)

var docFilesPaths = _.map(docFiles, function(currDocFile) {
    return path.join(docsDirPath, currDocFile)
})
docFilesPaths = _.filter(docFilesPaths, function(currDocEntry) {
    return /\.md$/.test(currDocEntry)
})
var readmePath = path.join(__dirname, "../readme.md")
docFilesPaths.push(readmePath)

var readmeDiagramsPath = path.join(__dirname, "../diagrams/README.md")
docFilesPaths.push(readmeDiagramsPath)

var pkgJson = jf.readFileSync(packagePath)
var apiString = fs.readFileSync(versionPath, "utf8").toString()
var changeLogString = fs.readFileSync(changeLogPath, "utf8").toString()

var mode = ""
if (_.includes(process.argv, "patch")) {
    mode = "patch"
} else if (_.includes(process.argv, "minor")) {
    mode = "minor"
} else {
    console.log("release mode (patch|minor) not provided")
    process.exit(-1)
}

module.exports = {
    versionPath: versionPath,
    packagePath: packagePath,
    changeLogPath: changeLogPath,
    docFilesPaths: docFilesPaths,
    readmePath: readmePath,
    pkgJson: pkgJson,
    apiString: apiString,
    changeLogString: changeLogString,
    currVersion: pkgJson.version,
    mode: mode,
    tagPrefix: "v"
}
