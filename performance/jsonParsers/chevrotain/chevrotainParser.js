// ----------------- Lexer -----------------
var Token = chevrotain.Token;
// https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6 (Use Simple Lazy Tokens)
var extendToken = chevrotain.extendSimpleLazyToken;
var ChevrotainLexer = chevrotain.Lexer;

// In ES6, custom inheritance implementation (such as the one above) can be replaced with a more simple: "class X extends Y"...
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
var NumberLiteral = extendToken("NumberLiteral", /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = ChevrotainLexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.


var jsonTokens = [WhiteSpace, StringLiteral, NumberLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null];
var ChevJsonLexer = new ChevrotainLexer(jsonTokens);


// ----------------- parser -----------------

// https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6
// (Do not create a new Parser instance for each new input.)
var ChevrotainParser = chevrotain.Parser;

function ChevrotainJsonParser(input) {
    ChevrotainParser.call(this, input, jsonTokens);
    var $ = this;

    $.RULE("json", function () {
        $.OR([
            // @formatter:off
            { ALT: function () { $.SUBRULE($.object) }},
            { ALT: function () { $.SUBRULE($.array) }}
            // @formatter:on
        ]);
    });

    $.RULE("object", function () {
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

    $.RULE("objectItem", function () {
        $.CONSUME(StringLiteral);
        $.CONSUME(Colon);
        $.SUBRULE($.value);
    });

    $.RULE("array", function () {
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

    $.RULE("value", function () {
        $.OR([
            // @formatter:off
            { ALT: function () { $.CONSUME(StringLiteral) }},
            { ALT: function () { $.CONSUME(NumberLiteral) }},
            { ALT: function () { $.SUBRULE($.object) }},
            { ALT: function () { $.SUBRULE($.array) }},
            { ALT: function () { $.CONSUME(True) }},
            { ALT: function () { $.CONSUME(False) }},
            { ALT: function () { $.CONSUME(Null) }}
            // @formatter:on
        ]);
    });

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    ChevrotainParser.performSelfAnalysis(this);
}

ChevrotainJsonParser.prototype = Object.create(ChevrotainParser.prototype);
ChevrotainJsonParser.prototype.constructor = ChevrotainJsonParser;

