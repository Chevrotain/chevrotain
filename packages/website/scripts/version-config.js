const fs = require("fs")
const jf = require("jsonfile")
const path = require("path")
const { reduce, map, filter } = require("remeda")

const packagePath = path.join(__dirname, "../package.json")
const changeLogPath = path.join(__dirname, "../docs/changes/CHANGELOG.md")

const docsDirPath = path.join(__dirname, "../docs")
const docFiles = fs.readdirSync(docsDirPath)

const docFilesPaths = map(docFiles, function (file) {
  return path.join(docsDirPath, file)
})

function notChangesDocs(path) {
  return !path.includes("changes/")
}

const markdownDocsFiles = reduce(
  docFilesPaths,
  (result, currPath) => {
    // Only scan 2 directories deep.
    if (fs.lstatSync(currPath).isDirectory()) {
      const nestedFiles = fs.readdirSync(currPath)
      const nestedPaths = map(nestedFiles, (currFile) =>
        path.join(currPath, currFile)
      )
      const newMarkdowns = filter(
        nestedPaths,
        (currPath) => currPath.endsWith(".md") && notChangesDocs(currPath)
      )

      result = result.concat(newMarkdowns)
    } else if (
      fs.lstatSync(currPath).isFile() &&
      currPath.endsWith(".md") &&
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
