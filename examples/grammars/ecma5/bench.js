const acorn = require("acorn")
const Benchmark = require("benchmark")
const fs = require("fs")
const path = require("path")
const adapterLex = require("./ecma5_lexer")
const chevParse = require("./ecma5_api").parse
const babylonParse = require("babylon").parse
const antlrParse = require("./antlr/antlr_api").parse
const pegParse = require("./peg/javascript_peg").parse
// TODO: cant really use the "ohm-grammar-ecmascript" package as it is broken and requires manual fixing.
const es5 = require("ohm-grammar-ecmascript")

const bigSample = fs
    .readFileSync(
        path.join(__dirname, "../node_modules/lodash/lodash.js"),
        "utf8"
    )
    .toString()

const smallSample = fs
    .readFileSync(
        path.join(__dirname, "../node_modules/antlr4/Token.js"),
        "utf8"
    )
    .toString()

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

// This Lexer benchmark shows the adapter to convert to Chevrotain tokens has a substantial overhead.
// The performance of the ECMA5 parser implemented using Chevrotain could be increased using a dedicated tokenizer.
// Farther optimizations may be possible if that lexer would "Just in time" (scannerless) as was implemented in
// https://github.com/SAP/chevrotain/blob/master/test/full_flow/ecma_quirks/ecma_quirks.ts
newSuite("lexer")
    .add("Acorn", () => acornLex(bigSample))
    .add("Acorn To Chevrotain Adapter", () =>
        acornLexAndConvertToChev(bigSample)
    )
    .run({
        async: false
    })

// We are only using a very small ~150lines input as it seems some of these example grammars have performance issues:
// See: https://github.com/pegjs/pegjs/issues/259
//      https://github.com/antlr/antlr4/issues/1243 (Same grammmar but python runtime.
// This suite is also a bit apples vs oranges:
// * Chevrotain and Antlr grammars don't handle binary expressions precedence (left to post processing)
// * Chevrotain uses Acorn as the tokenizer.
// However, the multiple orders of magnitudes differences in the results cannot be explained by these factors.
// My guess is that Antlr and peg.js have issues (possibly specific to their ECMA5 grammars with deep expression hierarchies).
newSuite("Versus Generic Parsing Libraries - small input")
    .add("Chevrotain", () => chevParse(smallSample))
    .add("antlr", () => antlrParse(smallSample))
    .add("peg", () => pegParse(smallSample))
    .add("ohm", () => {
        es5.grammar.match(smallSample)
    })
    .run({
        async: false
    })

// This benchmark suite is a bit of apples versus oranges
// The Chevrotain grammar in particular does less work as there is no output data structure (ast) yet.
// The interim conclusions are:
// 1. If you want the fastest possible parser, write one by hand and invest the effort into optimizations.
// 2. Chevrotain seems potentially able to compete with the less optimized / slower hand built parsers.
//    - Assuming the missing AST building phase does not consume MOST of the CPU resources of the whole flow.
newSuite(
    "Versus hand crafted ECMAScript parsers - lodash.js as the input source"
)
    .add("Chevrotain", () => chevParse(bigSample))
    .add("Acorn", () => acorn.parse(bigSample, { ecmaVersion: 5 }))
    .add("Babylon", () =>
        babylonParse(bigSample, { ranges: true, tokens: false })
    )
    .run({
        async: false
    })
