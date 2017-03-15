var fs = require("fs")
var oldVersion = require("../examples/grammars/node_modules/chevrotain/lib/chevrotain").VERSION
var oldVersionParseJson = require("./parsers/oldJsonParser").parseFunc
var devVersionParseJson = require("./parsers/devJsonParser").parseFunc

var devVersionParseCss = require("./parsers/cssDevParser").parseFunc
var oldVersionParseCss = require("./parsers/cssOldParser").parseFunc

var jsonSample = require("./samples/json10k")
var cssSample = fs.readFileSync('./samples/large_css.css', 'utf8')
var isBenchmarkOnlyLexer = false

var _ = require("lodash")

var times = 400
var warmupTimes = 50

function performBenchmark(name, input, devParse, oldParse) {

    console.log("----------------------------------------------")
    console.log("Benchmarking: " + name + " Dev Vs Old: (" + oldVersion + ")")
    // warmup
    for (var z = 0; z < warmupTimes; z++) {
        devParse(input, isBenchmarkOnlyLexer)
        oldParse(input, isBenchmarkOnlyLexer)
    }

    var totalDev = 0
    var totalOld = 0

    for (var i = 0; i < times; i++) {
        var startDev = _.now()
        devParse(input, isBenchmarkOnlyLexer)
        var endDev = _.now()
        totalDev += endDev - startDev

        var startOld = _.now()
        oldParse(input, isBenchmarkOnlyLexer)
        var endOld = _.now()
        totalOld += endOld - startOld
    }

    var averageDev = totalDev / times
    console.log("average with dev version: " + averageDev)

    var averageOld = totalOld / times
    console.log("average with old version: " + averageOld)

    // reporting
    if (averageDev < averageOld) {
        console.log("Dev is faster by: " + (averageOld / averageDev).toFixed(3))
    }
    else {
        console.log("Old is faster by: " + ((averageDev / averageOld)).toFixed(3))
    }
}

// performBenchmark("CSS", cssSample, devVersionParseCss, oldVersionParseCss)
performBenchmark("JSON", jsonSample, devVersionParseJson, oldVersionParseJson)
