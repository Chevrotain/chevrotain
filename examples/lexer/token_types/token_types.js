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

    var createToken
    // dynamically choose which "createToken" to use.
    switch (tokensType) {
        case REGULAR :
            createToken = chevrotain.createToken
            break;
        case LAZY :
            createToken = chevrotain.createLazyToken
            break;
        case SIMPLE_LAZY :
            createToken = chevrotain.createSimpleLazyToken
            break;
    }

    var True = createToken({name: "True", pattern: /true/});
    var False = createToken({name: "False", pattern: /false/});
    var Null = createToken({name: "Null", pattern: /null/});
    var LCurly = createToken({name: "LCurly", pattern: /{/});
    var RCurly = createToken({name: "RCurly", pattern: /}/});
    var LSquare = createToken({name: "LSquare", pattern: /\[/});
    var RSquare = createToken({name: "RSquare", pattern: /]/});
    var Comma = createToken({name: "Comma", pattern: /,/});
    var Colon = createToken({name: "Colon", pattern: /:/});
    var StringLiteral = createToken({name: "StringLiteral", pattern: /"(?:[^\\"]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/});
    var NumberLiteral = createToken({name: "NumberLiteral", pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/});
    var WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED});

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
