const fs = require("fs")
const jf = require("jsonfile")
const path = require("path")
const _ = require("lodash")

const versionPath = path.join(__dirname, "../src/version.ts")
const packagePath = path.join(__dirname, "../package.json")
const changeLogPath = path.join(__dirname, "../docs/changes/CHANGELOG.md")

const docsDirPath = path.join(__dirname, "../docs")
const docFiles = fs.readdirSync(docsDirPath)

const docFilesPaths = _.map(docFiles, function(file) {
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
            const nestedPaths = _.map(nestedFiles, currFile =>
                path.join(currPath, currFile)
            )
            const newMarkdowns = _.filter(
                nestedPaths,
                currPath =>
                    _.endsWith(currPath, ".md") && notChangesDocs(currPath)
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

const mainReadmePath = path.join(__dirname, "../readme.md")
markdownDocsFiles.push(mainReadmePath)

const pkgJson = jf.readFileSync(packagePath)
const apiString = fs.readFileSync(versionPath, "utf8").toString()
const changeLogString = fs.readFileSync(changeLogPath, "utf8").toString()

let mode = ""
if (_.includes(process.argv, "patch")) {
    mode = "patch"
} else if (_.includes(process.argv, "minor")) {
    mode = "minor"
} else if (_.includes(process.argv, "major")) {
    mode = "major"
} else {
    console.log("release mode (patch|minor) not provided")
    process.exit(-1)
}

module.exports = {
    versionPath: versionPath,
    packagePath: packagePath,
    changeLogPath: changeLogPath,
    docFilesPaths: markdownDocsFiles,
    readmePath: mainReadmePath,
    pkgJson: pkgJson,
    apiString: apiString,
    changeLogString: changeLogString,
    currVersion: pkgJson.version,
    mode: mode,
    tagPrefix: "v"
}
