var fs = require("fs")
var jsonParser = require("./parsers/devJsonParser")
var cssParser = require("./parsers/cssDevParser")

var jsonSample = require("./samples/json10k")
var cssSample = fs.readFileSync("./samples/large_css.css", "utf8")

var _ = require("lodash")

var times = 100
var warmupTimes = 10

function performBenchmark(name, input, regularParse, autoCompleteParse) {
    console.log("----------------------------------------------")
    console.log(
        name + ": Testing Regular Parsing Speed vs AutoComplete Parsing Speed"
    )

    // warmup
    for (var z = 0; z < warmupTimes; z++) {
        regularParse(input, false)
        autoCompleteParse(input)
    }

    var totalRegularParse = 0
    var totalAutoComplete = 0

    for (var i = 0; i < times; i++) {
        var startDev = _.now()
        regularParse(input, false)
        var endDev = _.now()
        totalRegularParse += endDev - startDev

        var startAutoComplete = _.now()
        autoCompleteParse(input)
        var endAutoComplete = _.now()
        totalAutoComplete += endAutoComplete - startAutoComplete
    }

    var averageDev = totalRegularParse / times
    console.log("average with Regular Parser: " + averageDev)

    var averageOld = totalAutoComplete / times
    console.log("average with AutoComplete Parser: " + averageOld)

    // reporting
    if (averageDev < averageOld) {
        console.log(
            "Regular is faster by: " + (averageOld / averageDev).toFixed(3)
        )
    } else {
        console.log(
            "AutoComplete is faster by: " + (averageDev / averageOld).toFixed(3)
        )
    }

    console.log("----------------------------------------------\n")
}

performBenchmark(
    "JSON",
    jsonSample,
    jsonParser.parseFunc,
    jsonParser.autoComplete
)
performBenchmark("CSS", cssSample, cssParser.parseFunc, cssParser.autoComplete)
