var config = require('./release_config')
var git = require('gitty')
var fs = require('fs')
var path = require('path')

var chevrotainJSPath_bin = path.join(__dirname, '../bin/chevrotain.js')
var chevrotainDTSPath_bin = path.join(__dirname, '../bin/chevrotain.d.ts')
var chevrotainJSPath_release = path.join(__dirname, '../release/chevrotain.js')
var chevrotainDTSPath_release = path.join(__dirname, '../release/chevrotain.d.ts')

fs.writeFileSync(chevrotainJSPath_release, fs.readFileSync(chevrotainJSPath_bin))
fs.writeFileSync(chevrotainDTSPath_release, fs.readFileSync(chevrotainDTSPath_bin))

var newTagName = config.tagPrefix + config.currVersion

var myRepo = git('')
myRepo.addSync([config.apiPath, config.travisPath, config.packagePath, config.bowerPath, chevrotainJSPath_release, chevrotainDTSPath_release])
myRepo.commitSync("release " + config.currVersion) // version has already been increased...
myRepo.createTagSync(newTagName)
myRepo.push("origin", "master", function() {
    console.log("finished push to branch")
})
myRepo.push("origin", newTagName, function() {
    console.log("finished push tag")
})


