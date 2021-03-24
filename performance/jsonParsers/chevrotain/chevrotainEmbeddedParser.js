// ----------------- Lexer -----------------
var Token = chevrotain.Token;
var createToken = chevrotain.createToken;
var ChevrotainLexer = chevrotain.Lexer;

var True = createToken({name: "True", pattern: "true"});
var False = createToken({name: "False", pattern: "false"});
var Null = createToken({name: "Null", pattern: "null"});
var LCurly = createToken({name: "LCurly", pattern: "{"});
var RCurly = createToken({name: "RCurly", pattern: "}"});
var LSquare = createToken({name: "LSquare", pattern: "["});
var RSquare = createToken({name: "RSquare", pattern: "]"});
var Comma = createToken({name: "Comma", pattern: ","});
var Colon = createToken({name: "Colon", pattern: ":"});

var stringLiteralPattern = /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
var StringLiteral = createToken({name: "StringLiteral", pattern: stringLiteralPattern});
var NumberLiteral = createToken({name: "NumberLiteral", pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/});
var WhiteSpace = createToken({name: "WhiteSpace", pattern: /[ \t\n\r]+/, group: ChevrotainLexer.SKIPPED});

var jsonTokens = [WhiteSpace, StringLiteral, NumberLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null];
// Tracking only the offset provides a small speed boost.
var ChevJsonLexer = new ChevrotainLexer(jsonTokens, {positionTracking: "onlyOffset"});


// ----------------- parser -----------------

// https://chevrotain.io/docs/guide/performance.html#using-a-singleton-parser
// (Do not create a new Parser instance for each new input.)
var ChevrotainEmbeddedActionsParser = chevrotain.EmbeddedActionsParser ;

function ChevrotainJsonParser(options) {
    ChevrotainEmbeddedActionsParser.call(this, jsonTokens, options);
    const $ = this;

    $.RULE("json", function () {
        $.OR([
            {ALT: function () { $.SUBRULE($.object) }},
            {ALT: function () { $.SUBRULE($.array) }}
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
        // Perf boost: https://github.com/Chevrotain/chevrotain/blob/master/docs/faq.md#PERFORMANCE
        // See "Avoid reinitializing large arrays of alternatives." section
        $.OR($.c1 || ($.c1  = [
            { ALT: function () { $.CONSUME(StringLiteral) }},
            { ALT: function () { $.CONSUME(NumberLiteral) }},
            { ALT: function () { $.SUBRULE($.object) }},
            { ALT: function () { $.SUBRULE($.array) }},
            { ALT: function () { $.CONSUME(True) }},
            { ALT: function () { $.CONSUME(False) }},
            { ALT: function () { $.CONSUME(Null) }}
        ]));
    });

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    this.performSelfAnalysis();
}

ChevrotainJsonParser.prototype = Object.create(ChevrotainEmbeddedActionsParser.prototype);
ChevrotainJsonParser.prototype.constructor = ChevrotainJsonParser;

