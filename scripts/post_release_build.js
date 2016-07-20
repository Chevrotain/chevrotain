var config = require('./release_config')
var git = require('gitty')
var fs = require('fs')
var path = require('path')

var chevrotainJSPath_lib = path.join(__dirname, '../lib/chevrotain.js')
var chevrotainJSPath_release_lib = path.join(__dirname, '../lib/chevrotain.min.js')
var chevrotainDTSPath_lib = path.join(__dirname, '../lib/chevrotain.d.ts')

var newTagName = config.tagPrefix + config.currVersion

var myRepo = git('')

myRepo.addSync([
    config.apiPath,
    config.packagePath,
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
