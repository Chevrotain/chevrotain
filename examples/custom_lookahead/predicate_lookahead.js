var chevrotain = require("chevrotain");

// ----------------- lexer -----------------
var extendToken = chevrotain.extendToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;

var One = extendToken("One", /1/);
var Two = extendToken("Two", /2/);
var Three = extendToken("Three", /3/);

var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

var allTokens = [
    WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
    One,
    Two,
    Three
];

var PredicateLookaheadLexer = new Lexer(allTokens);

/**
 * A custom lookahead function is invoked with context (this)
 * of the Parser. Thus it can access the Parser's internal state. (this.LA)
 * In this example we also limit some of the available alternatives using 'global' flag
 * 'maxNumberAllowed'
 *
 * A custom lookahead function should return true if the path should be taken
 * or false otherwise.
 */
var maxNumberAllowed = 3;

function isOne() {
    return this.LA(1) instanceof One && maxNumberAllowed >= 1;
}

function isTwo() {
    return this.LA(1) instanceof Two && maxNumberAllowed >= 2;
}

function isThree() {
    return this.LA(1) instanceof Three && maxNumberAllowed >= 3;
}

// ----------------- parser -----------------
function PredicateLookaheadParser(input) {
    Parser.call(this, input, allTokens);

    var $ = this;

    this.customPredicateRule = $.RULE("customPredicateRule", function () {
        // @formatter:off
        return $.OR([
            // In this example we disable some of the alternatives depending on the value of the
            // "maxNumberAllowed" flag. For each alternative a custom lookahead function is provided
            // A lookahead function may also be provided for other grammar DSL rules.
            // (OPTION/MANY/AT_LEAST_ONE/...)
            {WHEN: isOne, THEN_DO: function() {
                $.CONSUME(One);
                return 1;
            }},
            {WHEN: isTwo, THEN_DO: function() {
                $.CONSUME(Two);
                return 2;
            }},
            {WHEN: isThree, THEN_DO: function() {
                $.CONSUME(Three);
                return 3;
            }}
        ]);
        // @formatter:on
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}

PredicateLookaheadParser.prototype = Object.create(Parser.prototype);
PredicateLookaheadParser.prototype.constructor = PredicateLookaheadParser;

module.exports = {

    parse: function (text) {
        var lexResult = PredicateLookaheadLexer.tokenize(text);
        if (lexResult.errors.length >= 1) {
            throw new Error("sad sad panda, lexing errors detected");
        }

        var parser = new PredicateLookaheadParser(lexResult.tokens);
        var value = parser.customPredicateRule();
        if (parser.errors.length >= 1) {
            throw new Error("sad sad panda, parsing errors detected!");
        }

        return value;
    },

    setMaxAllowed: function (newMaxAllowed) {
        maxNumberAllowed = newMaxAllowed;
    }
};