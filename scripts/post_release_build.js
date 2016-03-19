var config = require('./release_config')
var git = require('gitty')
var fs = require('fs')
var path = require('path')

var chevrotainJSPath_dev = path.join(__dirname, '../dev/chevrotain.js')
var chevrotainJSPath_dev_min = path.join(__dirname, '../dev/chevrotain.min.js')
var chevrotainDTSPath_dev = path.join(__dirname, '../dev/chevrotain.d.ts')

// copy resources for bower + npm release
var chevrotainJSPath_lib = path.join(__dirname, '../lib/chevrotain.js')
var chevrotainJSPath_release_lib = path.join(__dirname, '../lib/chevrotain.min.js')
var chevrotainDTSPath_lib = path.join(__dirname, '../lib/chevrotain.d.ts')

fs.writeFileSync(chevrotainJSPath_lib, fs.readFileSync(chevrotainJSPath_dev))
fs.writeFileSync(chevrotainJSPath_release_lib, fs.readFileSync(chevrotainJSPath_dev_min))
fs.writeFileSync(chevrotainDTSPath_lib, fs.readFileSync(chevrotainDTSPath_dev))

var newTagName = config.tagPrefix + config.currVersion

var myRepo = git('')
myRepo.addSync([
    config.apiPath,
    config.packagePath,
    config.bowerPath,
    config.changeLogPath,
    chevrotainJSPath_lib,
    chevrotainJSPath_release_lib,
    chevrotainDTSPath_lib
].concat(config.docFilesPaths))

myRepo.commitSync("release " + config.currVersion) // version has already been increased...
myRepo.createTagSync(newTagName)
myRepo.push("origin", "master", function() {
    console.log("finished push to branch")
})
myRepo.push("origin", newTagName, function() {
    console.log("finished push tag")
})
