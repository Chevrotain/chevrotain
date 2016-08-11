var fs = require("fs")
var oldVersion = require("../examples/grammars/node_modules/chevrotain/lib/chevrotain").VERSION
var oldVersionParseJson = require("./parsers/oldJsonParser")
var devVersionParseJson = require("./parsers/devJsonParser")

var devVersionParseCss = require("./parsers/cssDevParser")
var oldVersionParseCss = require("./parsers/cssOldParser")

var jsonSample = require("./samples/json10k")
var cssSample = fs.readFileSync('./samples/large_css.css', 'utf8')

var _ = require("lodash")

var times = 100
var warmupTimes = 10

function performBenchmark(name, input, devParse, oldParse) {

    console.log("----------------------------------------------")
    console.log("Benchmarking: " + name + " Dev Vs Old")
    // warmup
    for (var z = 0; z < warmupTimes; z++) {
        devParse(input)
        oldParse(input)
    }

    // Dev version
    console.log("testing with dev version of chevrotain")

    // dev version
    var startDev = _.now()
    for (var i = 0; i < times; i++) {
        devParse(input)
    }
    var endDev = _.now()
    var averageDev = (endDev - startDev) / times
    console.log("average with dev version: " + averageDev)

    // Old version
    console.log("\n")
    console.log("testing with old version of chevrotain: " + oldVersion)
    var startOld = _.now()
    for (var j = 0; j < times; j++) {
        oldParse(input)
    }
    var endOld = _.now()
    var averageOld = (endOld - startOld) / times
    console.log("average with old version: " + averageOld)


    // reporting
    if (averageDev < averageOld) {
        console.log("Dev is faster by: " + (averageOld / averageDev).toFixed(3))
    }
    else {
        console.log("Old is faster by: " + ((averageDev / averageOld)).toFixed(3))
    }
}

performBenchmark("JSON", jsonSample, devVersionParseJson, oldVersionParseJson)
performBenchmark("CSS", cssSample, devVersionParseCss, oldVersionParseCss)
