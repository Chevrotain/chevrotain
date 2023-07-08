import fs from "fs"
import jf from "jsonfile"
import path, { dirname } from "path"
import _ from "lodash"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const packagePath = path.join(__dirname, "../package.json")
export const changeLogPath = path.join(
  __dirname,
  "../docs/changes/CHANGELOG.md"
)

const docsDirPath = path.join(__dirname, "../docs")
const docFiles = fs.readdirSync(docsDirPath)

const allDocFilesPaths = _.map(docFiles, function (file) {
  return path.join(docsDirPath, file)
})

function notChangesDocs(path) {
  return !_.includes(path, "changes/")
}

export const markdownDocsFiles = _.reduce(
  allDocFilesPaths,
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
export const currVersion = pkgJson.version

export const changeLogString = fs.readFileSync(changeLogPath, "utf8").toString()
