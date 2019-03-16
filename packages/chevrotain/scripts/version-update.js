const config = require("./version-config")
const git = require("gitty")
const _ = require("lodash")
const fs = require("fs")

const myRepo = git("")

const newVersion = config.currVersion

const dateTemplateRegExp = /^(## X\.Y\.Z )\(INSERT_DATE_HERE\)/
if (!dateTemplateRegExp.test(config.changeLogString)) {
    console.log(
        "CHANGELOG.md must have first line in the format '## X.Y.Z (INSERT_DATE_HERE)'"
    )
    process.exit(-1)
}

// updating CHANGELOG.md date
const nowDate = new Date()
const nowDateString = nowDate.toLocaleDateString("en-US").replace(/\//g, "-")
const changeLogDate = config.changeLogString.replace(
    dateTemplateRegExp,
    "## " + newVersion + " " + "(" + nowDateString + ")"
)
fs.writeFileSync(config.changeLogPath, changeLogDate)

_.forEach(config.docFilesPaths, function(currDocPath) {
    console.log("bumping file: <" + currDocPath + ">")
    const currItemContents = fs.readFileSync(currDocPath, "utf8").toString()
    const bumpedItemContents = currItemContents.replace(
        /\d+_\d+_\d+/,
        newVersion.replace(/\./g, "_")
    )
    fs.writeFileSync(currDocPath, bumpedItemContents)
})

console.log("bumping unpkg link in: <" + config.readmePath + ">")
console.log("bumping version on <" + config.versionPath + ">")

const oldVersion = require("../lib/src/version").VERSION
const oldVersionRegExpGlobal = new RegExp(oldVersion, "g")
const bumpedVersionTsFileContents = config.apiString.replace(
    /\d+\.\d+\.\d+/g,
    newVersion
)
fs.writeFileSync(config.versionPath, bumpedVersionTsFileContents)

const readmeContents = fs.readFileSync(config.readmePath, "utf8").toString()
const bumpedReadmeContents = readmeContents.replace(
    oldVersionRegExpGlobal,
    newVersion
)
fs.writeFileSync(config.readmePath, bumpedReadmeContents)

// Just adding to the current commit is sufficient as lerna does the commit + tag + push
myRepo.addSync(
    [config.versionPath, config.changeLogPath].concat(config.docFilesPaths)
)
