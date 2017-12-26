// TODO: This is a quick and dirty copy paste.
// Need to refactor this to avoid duplication with upload_docs.js script.
var git = require('gitty')
var _ = require('lodash')
var wrench = require('wrench')
var path = require('path')

var myRepo = git(path.join(__dirname, '../'))
var status = myRepo.statusSync()
if (!_.isEmpty(status.staged) || !_.isEmpty(status.unstaged) || !_.isEmpty(status.untracked)) {
    console.error('Error: git working directory must be clean in order to upload the website')
    process.exit(-1)
}

var branchesInfo = myRepo.getBranchesSync()

if (branchesInfo.current !== 'gh-pages') {
    console.error('Error: can only perform website upload job from gh-pages branch')
    process.exit(-1)
}

var targetWebsiteDir = path.join(__dirname, '../website/')
var orgWebsiteLocation = path.join(__dirname, '../../chevrotain/dev/website')
wrench.copyDirSyncRecursive(orgWebsiteLocation, targetWebsiteDir)

myRepo.addSync(targetWebsiteDir)
myRepo.commitSync("docs for release " + version)
myRepo.push("origin", "gh-pages", function () {
    console.log("finished push to branch")
})