let chevrotain = require("chevrotain")

// ----------------- lexer -----------------
let createToken = chevrotain.createToken
let Lexer = chevrotain.Lexer
let Parser = chevrotain.Parser

let True = createToken({ name: "True", pattern: /true/ })
let False = createToken({ name: "False", pattern: /false/ })
let Null = createToken({ name: "Null", pattern: /null/ })
let LCurly = createToken({ name: "LCurly", pattern: /{/ })
let RCurly = createToken({ name: "RCurly", pattern: /}/ })
let LSquare = createToken({ name: "LSquare", pattern: /\[/ })
let RSquare = createToken({ name: "RSquare", pattern: /]/ })
let Comma = createToken({ name: "Comma", pattern: /,/ })
let Colon = createToken({ name: "Colon", pattern: /:/ })
let StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
})
let NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
})
let WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED
})

let allTokens = [
    WhiteSpace,
    NumberLiteral,
    StringLiteral,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    Comma,
    Colon,
    True,
    False,
    Null
]
let JsonLexer = new Lexer(allTokens, {
    // Less verbose tokens will make the test's assertions easier to understand
    positionTracking: "onlyOffset"
})

// ----------------- parser -----------------

class JsonParser extends Parser {
    constructor(input) {
        super(input, allTokens, {
            // by default the error recovery / fault tolerance capabilities are disabled
            recoveryEnabled: true,
            // enable CST Output so we can test the recovery capabilities
            outputCst: true
        })

        // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
        let $ = this

        this.RULE("json", () => {
            // prettier-ignore
            $.OR([
                {ALT: () => {$.SUBRULE($.object)}},
                {ALT: () => {$.SUBRULE($.array)}}
            ])
        })

        this.RULE("object", () => {
            $.CONSUME(LCurly)
            $.OPTION(() => {
                $.SUBRULE($.objectItem)
                $.MANY(() => {
                    $.CONSUME(Comma)
                    $.SUBRULE2($.objectItem)
                })
            })
            $.CONSUME(RCurly)
        })

        this.RULE("objectItem", () => {
            $.CONSUME(StringLiteral)
            $.CONSUME(Colon)
            $.SUBRULE($.value)
        })

        this.RULE("array", () => {
            $.CONSUME(LSquare)
            $.OPTION(() => {
                $.SUBRULE($.value)
                $.MANY(() => {
                    $.CONSUME(Comma)
                    $.SUBRULE2($.value)
                })
            })
            $.CONSUME(RSquare)
        })

        this.RULE("value", () => {
            // prettier-ignore
            $.OR([
                {ALT: () => {$.CONSUME(StringLiteral)}},
                {ALT: () => {$.CONSUME(NumberLiteral)}},
                {ALT: () => {$.SUBRULE($.object)}},
                {ALT: () => {$.SUBRULE($.array)}},
                {ALT: () => {$.CONSUME(True)}},
                {ALT: () => {$.CONSUME(False)}},
                {ALT: () => {$.CONSUME(Null)}}
            ])
        })

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this)
    }
}

// reuse the same parser instance.
const parser = new JsonParser([])

// ----------------- wrapping it all together -----------------
module.exports = {
    parse: function parse(text) {
        let lexResult = JsonLexer.tokenize(text)

        // setting a new input will RESET the parser instance's state.
        parser.input = lexResult.tokens

        // any top level rule may be used as an entry point
        let cst = parser.json()

        return {
            cst: cst,
            lexErrors: lexResult.errors,
            parseErrors: parser.errors
        }
    }
}
