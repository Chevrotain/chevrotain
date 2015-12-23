"use strict";
var chevrotain = require("chevrotain");

// ----------------- lexer -----------------
var Token = chevrotain.Token;
var Lexer = chevrotain.Lexer;
var Parser = chevrotain.Parser;

// Unfortunately no support for static class properties in ES2015, only in ES2016...
// so the PATTERN/GROUP static props are defined outside the class declarations.
// see: https://github.com/jeffmo/es-class-fields-and-static-properties
class True extends Token {}
True.PATTERN = /true/;

class False extends Token {}
False.PATTERN = /false/;

class Null extends Token {}
Null.PATTERN = /null/;

class LCurly extends Token {}
LCurly.PATTERN = /{/;

class RCurly extends Token {}
RCurly.PATTERN = /}/;

class LSquare extends Token {}
LSquare.PATTERN = /\[/;

class RSquare extends Token {}
RSquare.PATTERN = /]/;

class Comma extends Token {}
Comma.PATTERN = /,/;

class Colon extends Token {}
Colon.PATTERN = /:/;

class StringLiteral extends Token {}
StringLiteral.PATTERN = /"(:?[^\\"]+|\\(:?[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/

class NumberLiteral extends Token {}
NumberLiteral.PATTERN = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/

class WhiteSpace extends Token {}
WhiteSpace.PATTERN = /\s+/
WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.


var allTokens = [WhiteSpace, NumberLiteral, StringLiteral, LCurly, RCurly, LSquare, RSquare, Comma, Colon, True, False, Null];
var JsonLexer = new Lexer(allTokens);


// ----------------- parser -----------------

class JsonParserES6 extends chevrotain.Parser {

    // Unfortunately no support for class fields with initializer in ES2015, only in ES2016...
    // so the parsing rules are defined inside the constructor, as each parsing rule must be initialized by
    // invoking RULE(...)
    // see: https://github.com/jeffmo/es-class-fields-and-static-properties
    constructor(input) {
        super(input, allTokens);

        // not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
        var $ = this;

        // the parsing methods
        $.object = $.RULE("object", () => { // using ES2015 Arrow functions to reduce verbosity.
            $.CONSUME(LCurly);
            $.OPTION(() => {
                $.SUBRULE($.objectItem);
                $.MANY(() => {
                    $.CONSUME(Comma);
                    $.SUBRULE2($.objectItem);
                });
            });
            $.CONSUME(RCurly);
        });

        $.objectItem = $.RULE("objectItem", () => {
            $.CONSUME(StringLiteral);
            $.CONSUME(Colon);
            $.SUBRULE($.value);
        });

        $.array = $.RULE("array", () => {
            $.CONSUME(LSquare);
            $.OPTION(() => {
                $.SUBRULE($.value);
                $.MANY(() => {
                    $.CONSUME(Comma);
                    $.SUBRULE2($.value);
                });
            });
            $.CONSUME(RSquare);
        });

        // @formatter:off
        $.value = $.RULE("value", () => {
            $.OR([
                { ALT: () => { $.CONSUME(StringLiteral) }},
                { ALT: () => { $.CONSUME(NumberLiteral) }},
                { ALT: () => { $.SUBRULE($.object) }},
                { ALT: () => { $.SUBRULE($.array) }},
                { ALT: () => { $.CONSUME(True) }},
                { ALT: () => { $.CONSUME(False) }},
                { ALT: () => { $.CONSUME(Null) }}
            ], "a value");
        });
        // @formatter:on

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }
}

// ----------------- wrapping it all together -----------------
module.exports = function (text) {
    var fullResult = {};
    var lexResult = JsonLexer.tokenize(text);
    fullResult.tokens = lexResult.tokens;
    fullResult.ignored = lexResult.ignored;
    fullResult.lexErrors = lexResult.errors;

    var parser = new JsonParserES6(lexResult.tokens);
    parser.object();
    fullResult.parseErrors = parser.errors;

    if (fullResult.lexErrors.length > 1 || fullResult.parseErrors.length > 1) {
        throw new Error("sad sad panda")
    }
    return fullResult;
};