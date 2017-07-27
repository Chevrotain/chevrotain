const acorn = require("acorn")
const mindoro = require("./lib/src/scanner/parser")
const Benchmark = require("benchmark")
const fs = require("fs")
const path = require("path")

function newSuite(name) {
    return new Benchmark.Suite(name, {
        onStart: () => console.log(`\n\n${name}`),
        onCycle: event => console.log(String(event.target)),
        onComplete: function() {
            console.log("Fastest is " + this.filter("fastest").map("name"))
        }
    })
}

function acornLex(input) {
    for (let token of acorn.tokenizer(input)) {
        // iterate over the tokens
    }
}

var samplePath = path.join(__dirname, "../node_modules/benchmark/benchmark.js")
var sampleString = fs.readFileSync(samplePath, "utf8").toString()

newSuite("let")
    .add("Acorn", () => acornLex(sampleString))
    // .add("Acorne full", () => acorn.parse(sampleString))
    .run({
        async: false
    })
