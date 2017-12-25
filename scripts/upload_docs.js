var git = require('gitty')
var _ = require('lodash')
var jf = require('jsonfile')
var fs = require('fs')
var wrench = require('wrench')
var path = require('path')

var myRepo = git(path.join(__dirname, '../'))
var status = myRepo.statusSync()
if (!_.isEmpty(status.staged) || !_.isEmpty(status.unstaged) || !_.isEmpty(status.untracked)) {
    console.error('Error: git working directory must be clean in order to perform a release')
    process.exit(-1)
}

var branchesInfo = myRepo.getBranchesSync()

if (branchesInfo.current !== 'gh-pages') {
    console.error('Error: can only perform docs release job from gh-pages branch')
    process.exit(-1)
}

chevrotainPkgPath = path.join(__dirname, '../../chevrotain/package.json')
var chevrotainPkg = jf.readFileSync(chevrotainPkgPath)

var version = chevrotainPkg.version
var noDotsVersion = version.replace(/\./g, '_')
var targetDocsDir = path.join(__dirname, '../documentation/' + noDotsVersion)

try {
    stats = fs.lstatSync(targetDocsDir)

    if (stats.isDirectory()) {
        console.error('docs directory for ' + noDotsVersion + ' already exists')
        process.exit(-1)
    }
}
catch (e) {
    // no issues it does not exist
}

var docsIndexHtmlPath = path.join(__dirname, '../documentation/index.html')
var docsIndexHtmlString = fs.readFileSync(docsIndexHtmlPath, 'utf8').toString()
var bumpedDocsIndexHtmlString = docsIndexHtmlString.replace(/\d+_\d+_\d+/, noDotsVersion)
fs.writeFileSync(docsIndexHtmlPath, bumpedDocsIndexHtmlString)

var orgDocsLocation = path.join(__dirname, '../../chevrotain/dev/docs')
wrench.copyDirSyncRecursive(orgDocsLocation, targetDocsDir)

var targetWebsiteDir = path.join(__dirname, '../website/')
var orgWebsiteLocation = path.join(__dirname, '../../chevrotain/dev/website')
wrench.copyDirSyncRecursive(orgWebsiteLocation, targetWebsiteDir)

myRepo.addSync([targetDocsDir].concat([docsIndexHtmlPath, targetWebsiteDir]))
myRepo.commitSync("docs for release " + version)
myRepo.push("origin", "gh-pages", function () {
    console.log("finished push to branch")
})