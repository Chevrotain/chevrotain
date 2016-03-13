var fs = require('fs')
var jf = require('jsonfile')
var path = require('path')
var _ = require('lodash')
var wrench = require('wrench')

var apiPath = path.join(__dirname, '../src/api.ts')
var travisPath = path.join(__dirname, '../.travis.yml')
var packagePath = path.join(__dirname, '../package.json')
var bowerPath = path.join(__dirname, '../bower.json')
var changeLogPath = path.join(__dirname, '../CHANGELOG.md')

// docs (.md files for bumping versions)
var docsDirPath = path.join(__dirname, '../docs')
var docFiles = wrench.readdirSyncRecursive(docsDirPath)
var docFilesPaths = _.map(docFiles, function(currDocFile) {
    return path.join(docsDirPath, currDocFile)
})
docFilesPaths = _.filter(docFilesPaths, function(currDocEntry) {
    return /\.md$/.test(currDocEntry)
})
var readmePath = path.join(__dirname, '../readme.md')
docFilesPaths.push(readmePath)

var pkgJson = jf.readFileSync(packagePath)
var bowerJson = jf.readFileSync(bowerPath)
var travisString = fs.readFileSync(travisPath, 'utf8').toString()
var apiString = fs.readFileSync(apiPath, 'utf8').toString()
var changeLogString = fs.readFileSync(changeLogPath, 'utf8').toString()

var mode = ""
if (_.includes(process.argv, "patch")) {
    mode = "patch"
}
else if (_.includes(process.argv, "minor")) {
    mode = "minor"
}
else {
    console.log("release mode (patch|minor) not provided")
    process.exit(-1)
}

module.exports = {
    apiPath:         apiPath,
    travisPath:      travisPath,
    packagePath:     packagePath,
    bowerPath:       bowerPath,
    changeLogPath:   changeLogPath,
    docFilesPaths:   docFilesPaths,
    pkgJson:         pkgJson,
    bowerJson:       bowerJson,
    travisString:    travisString,
    apiString:       apiString,
    changeLogString: changeLogString,
    currVersion:     pkgJson.version,
    mode:            mode,
    tagPrefix:       "v"
}
