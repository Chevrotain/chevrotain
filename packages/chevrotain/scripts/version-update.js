const config = require("./version-config")
const git = require("gitty")
const fs = require("fs")

const myRepo = git("../../")

const newVersion = config.currVersion
const oldVersion = require("../lib/src/version").VERSION
const oldVersionRegExpGlobal = new RegExp(oldVersion.replace(/\./g, "\\."), "g")

console.log("bumping version on <" + config.versionPath + ">")

const bumpedVersionTsFileContents = config.apiString.replace(
  oldVersionRegExpGlobal,
  newVersion
)
fs.writeFileSync(config.versionPath, bumpedVersionTsFileContents)

console.log("bumping unpkg link in: <" + config.readmePath + ">")
const readmeContents = fs.readFileSync(config.readmePath, "utf8").toString()
const bumpedReadmeContents = readmeContents.replace(
  oldVersionRegExpGlobal,
  newVersion
)
fs.writeFileSync(config.readmePath, bumpedReadmeContents)

// Just adding to the current commit is sufficient as lerna does the commit + tag + push
myRepo.addSync([config.versionPath, config.readmePath])
