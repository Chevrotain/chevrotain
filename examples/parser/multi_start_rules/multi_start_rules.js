/*
 * An example showing that any Production may be used as a start rule in chevrotain.
 * There is no artificial limit of which rule may be a start rule.
 *
 * Multiple start rules can be useful in certain contexts, for example:
 * 1. Unit Testing the grammar.
 * 2. Partial parsing of only the modified parts of a document in an IDE.
 */

var chevrotain = require("chevrotain");

// ----------------- lexer -----------------
var extendToken = chevrotain.extendToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;

var Alpha = extendToken("Alpha", /A/);
var Bravo = extendToken("Bravo", /B/);
var Charlie = extendToken("Charlie", /C/);

var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

var allTokens = [
    WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
    Alpha,
    Bravo,
    Charlie
];

var PhoneticLexer = new Lexer(allTokens);

// ----------------- parser -----------------
function MultiStartParser(input) {
    Parser.call(this, input, allTokens);

    var $ = this;

    this.firstRule = $.RULE("firstRule", function() {
        $.CONSUME(Alpha);

        $.OPTION(function() {
            $.SUBRULE($.secondRule)
        })
    });

    this.secondRule = $.RULE("secondRule", function() {
        $.CONSUME(Bravo);

        $.OPTION(function() {
            $.SUBRULE($.thirdRule)
        })
    });

    this.thirdRule = $.RULE("thirdRule", function() {
        $.CONSUME(Charlie);
    });

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}

MultiStartParser.prototype = Object.create(Parser.prototype);
MultiStartParser.prototype.constructor = MultiStartParser;


function parseStartingWithRule(ruleName) {
    return function(text) {
        var lexResult = PhoneticLexer.tokenize(text);

        if (lexResult.errors.length >= 1) {
            throw new Error("sad sad panda, lexing errors detected")
        }

        var parser = new MultiStartParser(lexResult.tokens);
        // just invoke which ever rule you want as the start rule.
        // its just plain javascript...
        parser[ruleName]()

        if (parser.errors.length >= 1) {
            throw new Error("sad sad panda, parsing errors detected!")
        }
    }
}


module.exports = {
    parseFirst:  parseStartingWithRule("firstRule"),
    parseSecond: parseStartingWithRule("secondRule"),
    parseThird:  parseStartingWithRule("thirdRule")
}
