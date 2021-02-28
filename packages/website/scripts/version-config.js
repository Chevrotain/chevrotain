const fs = require("fs")
const jf = require("jsonfile")
const path = require("path")
const _ = require("lodash")

const packagePath = path.join(__dirname, "../package.json")
const changeLogPath = path.join(__dirname, "../docs/changes/CHANGELOG.md")

const docsDirPath = path.join(__dirname, "../docs")
const docFiles = fs.readdirSync(docsDirPath)

const docFilesPaths = _.map(docFiles, function (file) {
  return path.join(docsDirPath, file)
})

function notChangesDocs(path) {
  return !_.includes(path, "changes/")
}

const markdownDocsFiles = _.reduce(
  docFilesPaths,
  (result, currPath) => {
    // Only scan 2 directories deep.
    if (fs.lstatSync(currPath).isDirectory()) {
      const nestedFiles = fs.readdirSync(currPath)
      const nestedPaths = _.map(nestedFiles, (currFile) =>
        path.join(currPath, currFile)
      )
      const newMarkdowns = _.filter(
        nestedPaths,
        (currPath) => _.endsWith(currPath, ".md") && notChangesDocs(currPath)
      )

      result = result.concat(newMarkdowns)
    } else if (
      fs.lstatSync(currPath).isFile() &&
      _.endsWith(currPath, ".md") &&
      notChangesDocs(currPath)
    ) {
      result.push(currPath)
    }

    return result
  },
  []
)

const pkgJson = jf.readFileSync(packagePath)
const changeLogString = fs.readFileSync(changeLogPath, "utf8").toString()

module.exports = {
  changeLogPath: changeLogPath,
  docFilesPaths: markdownDocsFiles,
  changeLogString: changeLogString,
  currVersion: pkgJson.version
}
