var wrench = require('wrench')
var _ = require('lodash')


module.exports = function(prefix, base) {
    var testFolderContents = wrench.readdirSyncRecursive(base);

    var testFolderJSContents = _.map(testFolderContents, function(currItem) {
        var tsToJs = currItem.replace(".ts", ".js")
        var toLinuxSlash = tsToJs.replace(/\\/g, "/")
        return toLinuxSlash
    })

    var testFolderFiles = _.filter(testFolderJSContents, function(currItem) {
        return _.endsWith(currItem, ".js")
    })

    var specs = _.filter(testFolderJSContents, function(currFileOrDir) {
        return _.endsWith(currFileOrDir, 'Spec.js')
    })
    var utilsAndExamples = _.difference(testFolderFiles, specs)

    var allSpecsAndExamples = utilsAndExamples.concat(specs)
    return _.map(allSpecsAndExamples, function(currFile) {
        return prefix + currFile;
    })
}