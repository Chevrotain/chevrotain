var chevrotain = require("chevrotain")

// ----------------- lexer -----------------
var createToken = chevrotain.createToken
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser

var True = createToken({ name: "True", pattern: /true/ })
var False = createToken({ name: "False", pattern: /false/ })
var Null = createToken({ name: "Null", pattern: /null/ })
var LCurly = createToken({ name: "LCurly", pattern: /{/ })
var RCurly = createToken({ name: "RCurly", pattern: /}/ })
var LSquare = createToken({ name: "LSquare", pattern: /\[/ })
var RSquare = createToken({ name: "RSquare", pattern: /]/ })
var Comma = createToken({ name: "Comma", pattern: /,/ })
var Colon = createToken({ name: "Colon", pattern: /:/ })
var StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
})
var NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
})
var WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t\n\r]+/,
    group: Lexer.SKIPPED,
    line_breaks: true
})

var allTokens = [
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
var JsonLexer = new Lexer(allTokens)

// ----------------- parser -----------------
function JsonParserES5(input) {
    // invoke super constructor
    Parser.call(this, input, allTokens)

    // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
    var $ = this

    this.RULE("json", function() {
        // prettier-ignore
        $.OR([
            {ALT: function() {$.SUBRULE($.object)}},
            {ALT: function() {$.SUBRULE($.array)}}
        ])
    })

    this.RULE("object", function() {
        $.CONSUME(LCurly)
        $.MANY_SEP({
            SEP: Comma,
            DEF: function() {
                $.SUBRULE2($.objectItem)
            }
        })
        $.CONSUME(RCurly)
    })

    this.RULE("objectItem", function() {
        $.CONSUME(StringLiteral)
        $.CONSUME(Colon)
        $.SUBRULE($.value)
    })

    this.RULE("array", function() {
        $.CONSUME(LSquare)
        $.MANY_SEP({
            SEP: Comma,
            DEF: () => {
                $.SUBRULE2($.value)
            }
        })
        $.CONSUME(RSquare)
    })

    this.RULE("value", function() {
        // prettier-ignore
        $.OR([
            {ALT: function() {$.CONSUME(StringLiteral)}},
            {ALT: function() {$.CONSUME(NumberLiteral)}},
            {ALT: function() {$.SUBRULE($.object)}},
            {ALT: function() {$.SUBRULE($.array)}},
            {ALT: function() {$.CONSUME(True)}},
            {ALT: function() {$.CONSUME(False)}},
            {ALT: function() {$.CONSUME(Null)}}
        ])
    })

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this)
}

// Using ES5 inheritance must be implemented using prototypes semantics.
JsonParserES5.prototype = Object.create(Parser.prototype)
JsonParserES5.prototype.constructor = JsonParserES5

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
var parser = new JsonParserES5([])

module.exports = function(text) {
    var lexResult = JsonLexer.tokenize(text)

    // setting a new input will RESET the parser instance's state.
    parser.input = lexResult.tokens

    // any top level rule may be used as an entry point
    var value = parser.json()

    return {
        // This is a pure grammar, the value will be undefined until we add embedded actions
        // or enable automatic CST creation.
        value: value,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors
    }
}
