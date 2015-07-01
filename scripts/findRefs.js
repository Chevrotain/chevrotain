var _ = require('lodash')
var fs = require('fs')

var tsRefRegex = /path\s*=\s*["']\.\.\/(.+\.ts)/g;

function getCapturingGroups(targetStr, regex, i) {
    var references = [];
    var matched;
    while (matched = regex.exec(targetStr)) {
        var currRef = matched[i];
        references.push(currRef);
    }
    return references;
}

module.exports = function getIncludesFromTsRefsFile(fileName) {
    var contents = fs.readFileSync(fileName).toString();
    var refs = getCapturingGroups(contents, tsRefRegex, 1);
    return refs;
}
