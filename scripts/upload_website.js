// TODO: This is a quick and dirty copy paste.
// Need to refactor this to avoid duplication with upload_docs.js script.
const git = require('gitty');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');

const myRepo = git(path.join(__dirname, '../'));
const status = myRepo.statusSync();
if (!_.isEmpty(status.staged) || !_.isEmpty(status.unstaged) || !_.isEmpty(status.untracked)) {
    console.error('Error: git working directory must be clean in order to upload the website')
    process.exit(-1)
}

const branchesInfo = myRepo.getBranchesSync();

if (branchesInfo.current !== 'gh-pages') {
    console.error('Error: can only perform website upload job from gh-pages branch')
    process.exit(-1)
}

const targetWebsiteDir = path.join(__dirname, '../docs/');
fs
const orgWebsiteLocation = path.join(__dirname, '../../chevrotain/docs/.vuepress/dist');
fs.moveSync(orgWebsiteLocation, targetWebsiteDir, {overwrite: true})

myRepo.addSync([targetWebsiteDir])
myRepo.commitSync("Updating Website")
myRepo.push("origin", "gh-pages", function () {
    console.log("finished push to branch")
})
