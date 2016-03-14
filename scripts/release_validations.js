var fs = require("fs")
var path = require("path")

var chevrotainJSPath_bin = path.join(__dirname, '../bin/chevrotain.js')
var chevrotainJSPath_bin_min = path.join(__dirname, '../bin/chevrotain.min.js')
var chevrotainDTSPath_bin = path.join(__dirname, '../bin/chevrotain.d.ts')

var chevrotainJSPath_release = path.join(__dirname, '../release/chevrotain.js')
var chevrotainJSPath_release_min = path.join(__dirname, '../release/chevrotain.min.js')
var chevrotainDTSPath_release = path.join(__dirname, '../release/chevrotain.d.ts')

/**
 * Ignores line terminator differences
 */
function compareFileContents(path1, path2) {
    var path1Contents = fs.readFileSync(path1, 'utf8').toString().replace(/\r\n/g, "\n")
    var path2Contents = fs.readFileSync(path2, 'utf8').toString().replace(/\r\n/g, "\n")

    if (path1Contents !== path2Contents) {
        throw Error("Expecting:  " + path1 + " to equal: " + path2)
    }
}

/**
 * The files released to bower have to be submitted to the source control
 * But the aggregated files released to NPM are generated during the release build.
 *
 * This makes sure they are identical.
 */
function verifyBowerReleaseFile() {
    console.log("verifying bower release files.")
    compareFileContents(chevrotainJSPath_bin, chevrotainJSPath_release)
    compareFileContents(chevrotainJSPath_bin_min, chevrotainJSPath_release_min)
    compareFileContents(chevrotainDTSPath_bin, chevrotainDTSPath_release)
}

module.exports = {
    verifyBowerRelease: verifyBowerReleaseFile
}