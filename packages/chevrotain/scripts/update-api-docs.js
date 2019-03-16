const _ = require("lodash")
const fs = require("fs-extra")
const path = require("path")

pkgPath = path.join(__dirname, "../package.json")
const pkg = fs.readJsonSync(pkgPath)

console.log("updating api docs re-direct")

const version = pkg.version
const noDotsVersion = version.replace(/\./g, "_")
const newVersionApiDocsDir = path.join(
    __dirname,
    "../gh-pages/documentation/" + noDotsVersion
)

try {
    stats = fs.lstatSync(newVersionApiDocsDir)

    if (stats.isDirectory()) {
        console.error("docs directory for " + noDotsVersion + " already exists")
        process.exit(-1)
    }
} catch (e) {
    // no issues it does not exist
}

// Update redirect to latest docs
const docsIndexHtmlPath = path.join(
    __dirname,
    "../gh-pages/documentation/index.html"
)
const docsIndexHtmlString = fs
    .readFileSync(docsIndexHtmlPath, "utf8")
    .toString()
const bumpedDocsIndexHtmlString = docsIndexHtmlString.replace(
    /\d+_\d+_\d+/,
    noDotsVersion
)
fs.writeFileSync(docsIndexHtmlPath, bumpedDocsIndexHtmlString)

const orgDocsLocation = path.join(__dirname, "../dev/docs")
fs.copySync(orgDocsLocation, newVersionApiDocsDir)
