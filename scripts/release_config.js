var fs = require("fs")
var jf = require("jsonfile")
var path = require("path")
var _ = require("lodash")

var versionPath = path.join(__dirname, "../src/version.ts")
var packagePath = path.join(__dirname, "../package.json")
var changeLogPath = path.join(__dirname, "../CHANGELOG.md")

// docs (.md files for bumping versions)
// TODO: have to manually add new subfolders here.
// TODO: implement something recursive that will not crash due to symlinks of "npm link"
var docsDirPath = path.join(__dirname, "../docs")
var docTutorialPath = docsDirPath + "/tutorial"
var docFiles = fs.readdirSync(docsDirPath)
var docTutorialFiles = fs.readdirSync(docTutorialPath)

var docFilesPaths = _.map(docFiles, function(file) {
	return path.join(docsDirPath, file)
})

var docTutorialFilesPaths = _.map(docTutorialFiles, function(file) {
	return path.join(docTutorialPath, file)
})

docFilesPaths = docFilesPaths.concat(docTutorialFilesPaths)

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
} else if (_.includes(process.argv, "major")) {
	mode = "major"
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
