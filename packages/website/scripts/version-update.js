const config = require("./version-config")
const git = require("gitty")
const { forEach } = require("remeda")
const fs = require("fs")

const myRepo = git("")

const newVersion = config.currVersion
const dateTemplateRegExp = /(## X\.Y\.Z )\(INSERT_DATE_HERE\)/
if (!dateTemplateRegExp.test(config.changeLogString)) {
  console.log("CHANGELOG.md must contain '## X.Y.Z (INSERT_DATE_HERE)'")
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

forEach(config.docFilesPaths, function (currDocPath) {
  if (currDocPath.includes("changes")) {
    console.log("SKIPPING bumping file: <" + currDocPath + ">")
    return
  }
  console.log("bumping file: <" + currDocPath + ">")
  const currItemContents = fs.readFileSync(currDocPath, "utf8").toString()
  const bumpedItemContents = currItemContents.replace(
    /\d+_\d+_\d+/g,
    newVersion.replace(/\./g, "_")
  )
  fs.writeFileSync(currDocPath, bumpedItemContents)
})

// Just adding to the current commit is sufficient as lerna does the commit + tag + push
myRepo.addSync([config.changeLogPath].concat(config.docFilesPaths))
