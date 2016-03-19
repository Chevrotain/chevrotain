var fs = require("fs")
var path = require("path")

// TODO: duplicate code regarding paths, also appears in one of the other scripts
var chevrotainJSPath_dev = path.join(__dirname, '../dev/chevrotain.js')
var chevrotainJSPath_bin_dev = path.join(__dirname, '../dev/chevrotain.min.js')
var chevrotainDTSPath_dev = path.join(__dirname, '../dev/chevrotain.d.ts')

var chevrotainJSPath_lib = path.join(__dirname, '../lib/chevrotain.js')
var chevrotainJSPath_lib_min = path.join(__dirname, '../lib/chevrotain.min.js')
var chevrotainDTSPath_lib = path.join(__dirname, '../lib/chevrotain.d.ts')

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
 * The files released to bower have to be submitted to the source control.
 * In addition to avoid issues with modified tracked files and to keep the folder structure for npm and bower release identical
 * The NPM aggregated files are the same as the bower ones (submitted in source control)
 * 
 * This will verify that the released aggregated files are identical to the generated files during the central(travis) release build.
 */
function verifyAggregatedReleaseFile() {
    console.log("verifying aggregated release files.")
    compareFileContents(chevrotainJSPath_dev, chevrotainJSPath_lib)
    compareFileContents(chevrotainJSPath_bin_dev, chevrotainJSPath_lib_min)
    compareFileContents(chevrotainDTSPath_dev, chevrotainDTSPath_lib)
}

module.exports = {
    verifyAggregatedReleaseFile: verifyAggregatedReleaseFile
}