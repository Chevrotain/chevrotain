/**
 * This example demonstrates the different types of Tokens Available in Chevrotain.
 * And the Performance differences between them.
 *
 * See https://github.com/SAP/chevrotain/blob/master/docs/token_types.md for more details
 *
 */
var chevrotain = require("chevrotain")

var Lexer = chevrotain.Lexer

var REGULAR = "Regular"
var LAZY = "Lazy"
var SIMPLE_LAZY = "SimpleLazy"

function createLexer(tokensType) {

    var extendToken
    // dynamically choose which "extendToken" to use.
    switch (tokensType) {
        case REGULAR :
            extendToken = chevrotain.extendToken
            break;
        case LAZY :
            extendToken = chevrotain.extendLazyToken
            break;
        case SIMPLE_LAZY :
            extendToken = chevrotain.extendSimpleLazyToken
            break;
    }

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
    var jsonLexer = new Lexer(allTokens)

    return jsonLexer
}

// Create the same Lexer using different kinds of Chevrotain Tokens.
var lazyLexer = createLexer(LAZY)
var regularLexer = createLexer(REGULAR)
var simpleLazyLexer = createLexer(SIMPLE_LAZY)

module.exports = {
    regularLexer:    regularLexer,
    lazyLexer:       lazyLexer,
    simpleLazyLexer: simpleLazyLexer
}
