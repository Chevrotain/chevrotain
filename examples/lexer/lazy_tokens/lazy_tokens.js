var chevrotain = require("chevrotain");

var Lexer = chevrotain.Lexer;
var LAZY = true
var REGULAR = false

function createLexer(isLazy) {

    var extendToken = isLazy ? chevrotain.extendLazyToken : chevrotain.extendToken

    var True = extendToken("True", /true/);
    var False = extendToken("False", /false/);
    var Null = extendToken("Null", /null/);
    var LCurly = extendToken("LCurly", /{/);
    var RCurly = extendToken("RCurly", /}/);
    var LSquare = extendToken("LSquare", /\[/);
    var RSquare = extendToken("RSquare", /]/);
    var Comma = extendToken("Comma", /,/);
    var Colon = extendToken("Colon", /:/);
    var StringLiteral = extendToken("StringLiteral", /"(?:[^\\"]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
    var NumberLiteral = extendToken("NumberLiteral", /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    var WhiteSpace = extendToken("WhiteSpace", /\s+/);
    WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

    var allTokens = [WhiteSpace, NumberLiteral, StringLiteral, LCurly, RCurly, LSquare, RSquare, Comma, Colon, True, False, Null];
    var jsonLexer = new Lexer(allTokens);

    return jsonLexer
}

// A Lexer producing Lazy Tokens or a Lexer producing "Regular" Tokens
// is chosen by either using "extendToken" or "extendLazyToken" utility methods
var lazyLexer = createLexer(LAZY)
var regularLexer = createLexer(REGULAR)

module.exports = {
    lazyLexer : lazyLexer,
    regularLexer : regularLexer
}
