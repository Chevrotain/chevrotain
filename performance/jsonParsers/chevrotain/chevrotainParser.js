// ----------------- Lexer -----------------
var Token = chevrotain.Token;
// https://github.com/SAP/chevrotain/blob/master/docs/faq.md#Q6 (Use Simple Lazy Tokens)
var createToken = chevrotain.createToken;
var ChevrotainLexer = chevrotain.Lexer;

// In ES6, custom inheritance implementation (such as the one above) can be replaced with a more simple: "class X extends Y"...
var True = createToken({name: "True", pattern: /true/});
var False = createToken({name: "False", pattern: /false/});
var Null = createToken({name: "Null", pattern: /null/});
var LCurly = createToken({name: "LCurly", pattern: /{/});
var RCurly = createToken({name: "RCurly", pattern: /}/});
var LSquare = createToken({name: "LSquare", pattern: /\[/});
var RSquare = createToken({name: "RSquare", pattern: /]/});
var Comma = createToken({name: "Comma", pattern: /,/});
var Colon = createToken({name: "Colon", pattern: /:/});

var stringLiteralPattern = /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
var StringLiteral = createToken({name: "StringLiteral", pattern: stringLiteralPattern});
var NumberLiteral = createToken({name: "NumberLiteral", pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/});
var WhiteSpace = createToken({name: "WhiteSpace", pattern: /\s+/, group: ChevrotainLexer.SKIPPED});

var jsonTokens = [WhiteSpace, StringLiteral, NumberLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null];
// Tracking only the offset provides a small speed boost.
var ChevJsonLexer = new ChevrotainLexer(jsonTokens, {positionTracking: "onlyOffset"});


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

