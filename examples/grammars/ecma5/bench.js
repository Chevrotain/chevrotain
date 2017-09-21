const acorn = require("acorn")
const Benchmark = require("benchmark")
const fs = require("fs")
const path = require("path")
const adapterLex = require("./ecma5_lexer")
const chevParse = require("./ecma5_api").parse
const pegParse = require("./other_libs/peg/peg_ecma").parse
const ohmParse = require("ohm-grammar-ecmascript")

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

function acornLexAndConvertToChev(input) {
    return adapterLex.tokenize(input)
}

var samplePath = path.join(__dirname, "../node_modules/lodash/lodash.js")
// var samplePath = path.join(__dirname, "../node_modules/commander/index.js")

var sampleString = fs.readFileSync(samplePath, "utf8").toString()

// newSuite("lexer")
//     .add("Acorn", () => acornLex(sampleString))
//     .add("Acorn To Chevrotain Adapter", () =>
//         acornLexAndConvertToChev(sampleString)
//     )
//     // .add("Acorne full", () => acorn.parse(sampleString))
//     .run({
//         async: false
//     })

chevParse(sampleString)

// const result = ohmParse.grammar.match(sampleString)
// console.log(result.succeeded())

// pegParse(sampleString)

newSuite("parser")
    .add("Acorn", () => acorn.parse(sampleString, { ecmaVersion: 5 }))
    .add("Chevrotain", () => chevParse(sampleString))
    // .add("ohm", () => {
    //     const result = ohmParse.grammar.match(sampleString)
    //     assert(result.succeeded())
    // })
    // .add("peg", () => pegParse(sampleString))
    .run({
        async: false
    })
