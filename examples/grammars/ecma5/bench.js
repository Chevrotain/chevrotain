const acorn = require("acorn")
const Benchmark = require("benchmark")
const fs = require("fs")
const path = require("path")
const adapterLex = require("./ecma5_lexer")
const chevParse = require("./ecma5_api").parse
const babylonParse = require("babylon").parse
const antlrParse = require("./antlr/antlr_api").parse

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

const benchmarkSample = fs
    .readFileSync(
        path.join(__dirname, "../node_modules/minimist/index.js"),
        "utf8"
    )
    .toString()
const lodashSample = fs
    .readFileSync(
        path.join(__dirname, "../node_modules/lodash/lodash.js"),
        "utf8"
    )
    .toString()

acorn.parse("for ([] in x) {}")
// This Lexer benchmark shows the adapter to convert to Chevrotain tokens has a substantial overhead.
// The performance of the ECMA5 parser implemented using Chevrotain could be increased using a dedicated tokenizer.
// Farther optimizations may be possible if that lexer would "Just in time" as was implemented in
// https://github.com/SAP/chevrotain/blob/master/test/full_flow/ecma_quirks/ecma_quirks.ts
// newSuite("lexer")
//     .add("Acorn", () => acornLex(lodashSample))
//     .add("Acorn To Chevrotain Adapter", () =>
//         acornLexAndConvertToChev(lodashSample)
//     )
//     .run({
//         async: false
//     })

chevParse(lodashSample)
// This parser benchmark is a bit of apples versus oranges
// The Chevrotain grammar in particular does less work as there is no output data structure (ast) yet.
// The interim conclusions are:
// 1. If you want the fastest possible parser, write one by hand...
// 2. Chevrotain seems able to compete with the less optimized hand built parsers.
//    - Assuming the AST building phase does not consume most of the CPU resources of the whole flow.
antlrParse(benchmarkSample)
// newSuite("parser - lodash.js")
//     .add("Chevrotain", () => chevParse(lodashSample))
//     .add("antlr", () => antlrParse(lodashSample))
//     // .add("Acorn", () => acorn.parse(lodashSample, { ecmaVersion: 5 }))
//     // .add("Babylon", () =>
//     //     babylonParse(lodashSample, { ranges: true, tokens: false })
//     // )
//     .run({
//         async: false
//     })

newSuite("parser - benchmark.js")
    .add("Chevrotain", () => chevParse(benchmarkSample))
    .add("antlr", () => antlrParse(benchmarkSample))
    .add("Acorn", () => acorn.parse(benchmarkSample, { ecmaVersion: 5 }))
    // .add("Babylon", () =>
    //     babylonParse(benchmarkSample, { ranges: true, tokens: false })
    // )
    .run({
        async: false
    })
