var config = require("./release_config")
var git = require("gitty")

var newTagName = config.tagPrefix + config.currVersion
var myRepo = git("")

myRepo.addSync(
    [config.versionPath, config.packagePath, config.changeLogPath].concat(
        config.docFilesPaths
    )
)

myRepo.commitSync("release " + config.currVersion) // version has already been increased...
myRepo.createTagSync(newTagName)
myRepo.push("origin", "master", function() {
    console.log("finished push to branch")
})
myRepo.push("origin", newTagName, function() {
    console.log("finished push tag")
})
