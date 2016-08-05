var oldVersionParseJson = require("./parsers/oldJsonParser")
var _ = require("lodash")
var jsonSample = require("./sampes/json10k")

var oldVersion = require("../examples/grammars/node_modules/chevrotain/lib/chevrotain").VERSION
var devVersionParseJson = require("./parsers/devJsonParser")

var times = 100
var warmupTimes = 10

// warmup
for (var z = 0; z < warmupTimes; z++) {
    devVersionParseJson(jsonSample)
    oldVersionParseJson(jsonSample)
}

// Dev version
console.log("testing with dev version of chevrotain")


var startDev = _.now()
for (var i = 0; i < times; i++) {
    devVersionParseJson(jsonSample)
}
var endDev = _.now()
var averageDev = (endDev - startDev) / times
console.log("average with dev version: " + averageDev)

// Old version
console.log("\n")
console.log("testing with old version of chevrotain: " + oldVersion)
var startOld = _.now()
for (var j = 0; j < times; j++) {
    oldVersionParseJson(jsonSample)
}
var endOld = _.now()
var averageOld = (endOld - startOld) / times
console.log("average with old version: " + averageOld)


// reporting
if (averageDev < averageOld) {
    console.log("Dev is faster by: " + (averageOld / averageDev).toFixed(3))
}
else {
    console.log("Old is faster by: " + ((averageDev /averageOld)).toFixed(3))
}
