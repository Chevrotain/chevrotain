// requiring the latest version of chevrotain (assuming it is indeed located there)
var chevrotain = require("../../examples/grammars/node_modules/chevrotain/lib/src/api");

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
var StringLiteral = extendToken("StringLiteral", /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/);
var NumberLiteral = extendToken("NumberLiteral", /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
var WhiteSpace = extendToken("WhiteSpace", /\s+/);
WhiteSpace.GROUP = Lexer.SKIPPED; // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

var allTokens = [WhiteSpace, StringLiteral, NumberLiteral, Comma, Colon, LCurly, RCurly, LSquare, RSquare, True, False, Null];
var JsonLexer = new Lexer(allTokens, {positionTracking:"onlyOffset"});


// ----------------- parser -----------------

function JsonParserOld(input) {
    // invoke super constructor
    Parser.call(this, input, allTokens, {
            // by default the error recovery / fault tolerance capabilities are disabled
            // use this flag to enable them
            recoveryEnabled: false
        }
    );

    // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
    var $ = this;

    this.json = this.RULE("json", function() {
        // @formatter:off
        $.OR([
            { ALT: function () { $.SUBRULE($.object) }},
            { ALT: function () { $.SUBRULE($.array) }}
        ]);
        // @formatter:on
    });

    this.object = this.RULE("object", function() {
        $.CONSUME(LCurly);
        $.OPTION(function() {
            $.SUBRULE($.objectItem);
            $.MANY(function() {
                $.CONSUME(Comma);
                $.SUBRULE2($.objectItem);
            });
        });
        $.CONSUME(RCurly);
    });

    this.objectItem = this.RULE("objectItem", function() {
        $.CONSUME(StringLiteral);
        $.CONSUME(Colon);
        $.SUBRULE($.value);
    });

    this.array = this.RULE("array", function() {
        $.CONSUME(LSquare);
        $.OPTION(function() {
            $.SUBRULE($.value);
            $.MANY(function() {
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
JsonParserOld.prototype = Object.create(Parser.prototype);
JsonParserOld.prototype.constructor = JsonParserOld;

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
var parser = new JsonParserOld([]);
module.exports = {
    parseFunc: function(text, lexOnly) {
        var lexResult = JsonLexer.tokenize(text);
        if (lexResult.errors.length > 0) {
            throw "Lexing errors encountered " + lexResult.errors[0].message
        }

        var value
        if (!lexOnly) {
            // setting a new input will RESET the parser instance's state.
            parser.input = lexResult.tokens;

            // any top level rule may be used as an entry point
            value = parser.json();

            if (parser.errors.length > 0) {
                throw "parsing errors encountered " + parser.errors[0].message
            }
        }

        return {
            value:       value, // this is a pure grammar, the value will always be <undefined>
            lexErrors:   lexResult.errors,
            parseErrors: parser.errors
        };
    },

    autoComplete: function(text) {
        var lexResult = JsonLexer.tokenize(text);
        if (lexResult.errors.length > 0) {
            throw "Lexing errors encountered " + lexResult.errors[0].message
        }

        var result = parser.computeContentAssist("json", lexResult.tokens)

        return result
    }
}
