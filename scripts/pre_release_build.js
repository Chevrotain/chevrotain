var config = require('./release_config')
var git = require('gitty')
var _ = require('lodash')
var semver = require('semver')
var jf = require('jsonfile')
var fs = require('fs')


var myRepo = git('')
var status = myRepo.statusSync()

if (!_.isEmpty(status.staged) || !_.isEmpty(status.unstaged) || !_.isEmpty(status.untracked)) {
    console.log("Error: git working directory must be clean in order to perform a release")
    process.exit(-1)
}

var branchesInfo = myRepo.getBranchesSync()

if (branchesInfo.current !== "master") {
    console.log("Error: can only perform release job from master branch")
    process.exit(-1)
}

var versionRegExp = /\d+\.\d+\.\d+/
var pkgVersion = config.pkgJson.version
var bowerVersion = config.bowerJson.version
var travisVersion = versionRegExp.exec(config.travisString)[0]

if (_.uniq([pkgVersion, bowerVersion, travisVersion]).length !== 1) {
    console.log("Error: package.json / bower.json / .travis.yml versions must be identical")
    process.exit(-1)
}

var oldVersion = config.currVersion
var newVersion = semver.inc(config.currVersion, config.mode)

// bump versions
var bumpedPkgJson = _.clone(config.pkgJson)
var bumpBowerJson = _.clone(config.bowerJson)
bumpedPkgJson.version = newVersion
bumpBowerJson.version = newVersion
var oldVersionRegExpGlobal = new RegExp(oldVersion, "g")
var bumpedTravisString = config.travisString.replace(oldVersionRegExpGlobal, newVersion)
var bumpedApiString = config.apiString.replace(oldVersionRegExpGlobal, newVersion)

var docsOldVersionRegExp = new RegExp(oldVersion.replace(/\./g, "_"), "g")
var bumpedReadmeString = config.readmeString.replace(docsOldVersionRegExp, newVersion.replace(/\./g, "_"))

jf.spaces = 2

jf.writeFileSync(config.packagePath, bumpedPkgJson)
jf.writeFileSync(config.bowerPath, bumpBowerJson)
fs.writeFileSync(config.travisPath, bumpedTravisString)
fs.writeFileSync(config.apiPath, bumpedApiString)
fs.writeFileSync(config.readmePath, bumpedReadmeString)