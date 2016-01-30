var chevrotain = require("chevrotain");

// ----------------- lexer -----------------
var extendToken = chevrotain.extendToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;

var Assign = extendToken("Assign", /=/);
var Export = extendToken("Export", /export/);
var Interface = extendToken("Interface", /interface/);
var Identifier = extendToken("Identifier", /\w+/);

var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

var allTokens = [
    WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
    Assign,
    Export,
    Interface,
    Identifier
];

var LargeLookaheadLexer = new Lexer(allTokens);

/**
 * A custom lookahead function is invoked with context (this)
 * of the Parser. Thus it can access the Parser's internal state.
 * In this example we use this.LA(i) to look ahead in the token stream.
 *
 * A custom lookahead function should return true if the path should be taken
 * or false otherwise.
 *
 * @returns {boolean}
 */
function isExportAssignment() {
    return this.LA(1) instanceof Export &&
        this.LA(2) instanceof Assign;
}

function isExportInterface() {
    return this.LA(1) instanceof Export &&
        this.LA(2) instanceof Interface;
}

// ----------------- parser -----------------
function LargeLookaheadParser(input) {
    Parser.call(this, input, allTokens);

    var $ = this;

    this.twoTokensLookAheadRule = $.RULE("twoTokensLookAheadRule", function () {
        // @formatter:off
        return $.OR([
            // both alternatives start with the same Token (Export).
            // Thus this grammar is NOT LL(1). It requires a lookahead of two tokens. (k=2).
            // Chevrotain does not (currently) support automatic lookahead calculation in this case.
            // However custom lookahead functions can be used to implement it 'manually'
            {WHEN: isExportAssignment, THEN_DO: function() {
                $.CONSUME(Export);
                $.CONSUME(Assign);
                $.CONSUME(Identifier);
                return "Assignment";
            }},
            {WHEN: isExportInterface, THEN_DO: function() {
                $.CONSUME2(Export);
                $.CONSUME(Interface);
                return "Interface";
            }}
        ]);
        // @formatter:on
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}


LargeLookaheadParser.prototype = Object.create(Parser.prototype);
LargeLookaheadParser.prototype.constructor = LargeLookaheadParser;

module.exports = function (text) {
    var lexResult = LargeLookaheadLexer.tokenize(text);
    if (lexResult.errors.length > 1) {
        throw new Error("sad sad panda, lexing errors detected")
    }

    var parser = new LargeLookaheadParser(lexResult.tokens);
    var value = parser.twoTokensLookAheadRule();
    if (parser.errors.length > 1) {
        throw new Error("sad sad panda, parsing errors detected!")
    }

    return value;
};