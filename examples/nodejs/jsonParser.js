var chevrotain = require("chevrotain");

// ----------------- lexer -----------------
var extendToken = chevrotain.extendToken;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;

// In ES6, custom inheritance implementation (such as 'extendToken(...)') can be replaced with simple "class X extends Y"...
var True = extendToken("True", /true/);
var False = extendToken("False", /false/);
var Null = extendToken("Null", /null/);
var LCurly = extendToken("LCurly", /{/);
var RCurly = extendToken("RCurly", /}/);
var LSquare = extendToken("LSquare", /\[/);
var RSquare = extendToken("RSquare", /]/);
var Comma = extendToken("Comma", /,/);
var Colon = extendToken("Colon", /:/);
var StringLiteral = extendToken("StringLiteral", /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
var NumberLiteral = extendToken("NumberLiteral", /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

var allTokens = [WhiteSpace, NumberLiteral, StringLiteral, LCurly, RCurly, LSquare, RSquare, Comma, Colon, True, False, Null];
var JsonLexer = new Lexer(allTokens);


// ----------------- parser -----------------

function JsonParser(input) {
    // invoke super constructor
    Parser.call(this, input, allTokens);

    // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
    var $ = this;

    this.object = this.RULE("object", function () {
        $.CONSUME(LCurly);
        $.OPTION(function () {
            $.SUBRULE($.objectItem);
            $.MANY(function () {
                $.CONSUME(Comma);
                $.SUBRULE2($.objectItem);
            });
        });
        $.CONSUME(RCurly);
    });

    this.objectItem = this.RULE("objectItem", function () {
        $.CONSUME(StringLiteral);
        $.CONSUME(Colon);
        $.SUBRULE($.value);
    });

    this.array = this.RULE("array", function () {
        $.CONSUME(LSquare);
        $.OPTION(function () {
            $.SUBRULE($.value);
            $.MANY(function () {
                $.CONSUME(Comma);
                $.SUBRULE2($.value);
            });
        });
        $.CONSUME(RSquare);
    });

    // @formatter:off
    this.value = this.RULE("value", function () {
        $.OR([
            { ALT: function () { $.CONSUME(StringLiteral) }},
            { ALT: function () { $.CONSUME(NumberLiteral) }},
            { ALT: function () { $.SUBRULE($.object) }},
            { ALT: function () { $.SUBRULE($.array) }},
            { ALT: function () { $.CONSUME(True) }},
            { ALT: function () { $.CONSUME(False) }},
            { ALT: function () { $.CONSUME(Null) }}
        ], "a value");
    });
    // @formatter:on

    // very important to call this after all the rules have been defined.
    // otherwise the parser may not work correctly as it will lack information
    // derived during the self analysis phase.
    Parser.performSelfAnalysis(this);
}

// inheritance as implemented in javascript in the previous decade... :(
JsonParser.prototype = Object.create(Parser.prototype);
JsonParser.prototype.constructor = JsonParser;

// ----------------- wrapping it all together -----------------

module.exports = function (text) {
    var fullResult = {};
    var lexResult = JsonLexer.tokenize(text);
    fullResult.tokens = lexResult.tokens;
    fullResult.ignored = lexResult.ignored;
    fullResult.lexErrors = lexResult.errors;

    var parser = new JsonParser(lexResult.tokens);
    parser.object();
    fullResult.parseErrors = parser.errors;

    if (fullResult.lexErrors.length > 1 || fullResult.parseErrors.length > 1) {
        throw new Error("sad sad panda")
    }
    return fullResult;
};