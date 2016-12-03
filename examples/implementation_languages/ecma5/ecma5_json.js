var chevrotain = require("chevrotain")

// ----------------- lexer -----------------
var extendToken = chevrotain.extendToken
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser

// In ES5 there are no classes, therefore utility methods must be used to create Token "classes".
var True = extendToken("True", /true/)
var False = extendToken("False", /false/)
var Null = extendToken("Null", /null/)
var LCurly = extendToken("LCurly", /{/)
var RCurly = extendToken("RCurly", /}/)
var LSquare = extendToken("LSquare", /\[/)
var RSquare = extendToken("RSquare", /]/)
var Comma = extendToken("Comma", /,/)
var Colon = extendToken("Colon", /:/)
var StringLiteral = extendToken("StringLiteral", /"(?:[^\\"]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/)
var NumberLiteral = extendToken("NumberLiteral", /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/)
var WhiteSpace = extendToken("WhiteSpace", /\s+/)
WhiteSpace.GROUP = Lexer.SKIPPED // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

var allTokens = [WhiteSpace, NumberLiteral, StringLiteral, LCurly, RCurly, LSquare, RSquare, Comma, Colon, True, False, Null]
var JsonLexer = new Lexer(allTokens)

// ----------------- parser -----------------
function JsonParserES5(input) {
    // invoke super constructor
    Parser.call(this, input, allTokens)

    // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
    var $ = this

    this.RULE("json", function() {
        $.OR([
            {ALT: function() { $.SUBRULE($.object) }},
            {ALT: function() { $.SUBRULE($.array) }}
        ])
    })

    this.RULE("object", function() {
        $.CONSUME(LCurly)
        $.OPTION(function() {
            $.SUBRULE($.objectItem)
            $.MANY(function() {
                $.CONSUME(Comma)
                $.SUBRULE2($.objectItem)
            })
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
        $.OPTION(function() {
            $.SUBRULE($.value)
            $.MANY(function() {
                $.CONSUME(Comma)
                $.SUBRULE2($.value)
            })
        })
        $.CONSUME(RSquare)
    })

    this.RULE("value", function() {
        $.OR([
            {ALT: function() { $.CONSUME(StringLiteral) }},
            {ALT: function() { $.CONSUME(NumberLiteral) }},
            {ALT: function() { $.SUBRULE($.object) }},
            {ALT: function() { $.SUBRULE($.array) }},
            {ALT: function() { $.CONSUME(True) }},
            {ALT: function() { $.CONSUME(False) }},
            {ALT: function() { $.CONSUME(Null) }}
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
        value:       value, // this is a pure grammar, the value will always be <undefined>
        lexErrors:   lexResult.errors,
        parseErrors: parser.errors
    }
}