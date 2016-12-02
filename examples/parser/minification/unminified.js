// Wrapping in a UMD Pattern will cause Uglify to identify the Token Constructors
// as private (not top level scope) and thus their names will be mangled which will cause runtime failures.
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require("chevrotain"))
    }
    else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['chevrotain'], factory)
    } else {
        root.jsonParserModule = factory(root.chevrotain)
    }
}(this, function(chevrotain) {
    // ----------------- lexer -----------------
    var extendToken = chevrotain.extendToken
    var Lexer = chevrotain.Lexer
    var Parser = chevrotain.Parser

    var True = extendToken("True", /true/)
    var False = extendToken("False", /false/)
    var Null = extendToken("Null", /null/)
    var LCurly = extendToken("LCurly", /{/)
    var RCurly = extendToken("RCurly", /}/)
    var LSquare = extendToken("LSquare", /\[/)
    var RSquare = extendToken("RSquare", /]/)
    var Comma = extendToken("Comma", /,/)
    var Colon = extendToken("Colon", /:/)
    var StringLiteral = extendToken("StringLiteral", /"(?:[^\\"]+|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/)
    var NumberLiteral = extendToken("NumberLiteral", /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/)
    var WhiteSpace = extendToken("WhiteSpace", /\s+/)
    WhiteSpace.GROUP = Lexer.SKIPPED // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

    var allTokens = [WhiteSpace, NumberLiteral, StringLiteral, LCurly, RCurly, LSquare, RSquare, Comma, Colon, True, False, Null]
    var JsonLexer = new Lexer(allTokens)


    // ----------------- parser -----------------

    function JsonParserToMinifiy(input) {
        // invoke super constructor
        Parser.call(this, input, allTokens)

        // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
        var $ = this

        this.RULE("json", function() {
            // @formatter:off
        $.OR([
            { ALT: function () { $.SUBRULE($.object) }},
            { ALT: function () { $.SUBRULE($.array) }}
        ])
        // @formatter:on
        })

        this.RULE("object", function() {
            $.CONSUME(LCurly)
            $.OPTION(function() {
                $.SUBRULE($.objectItem)
                $.MANY(function() {
                    $.CONSUME(Comma)
                    $.SUBRULE2($.objectItem)
                })
            })
            $.CONSUME(RCurly)
        })

        this.RULE("objectItem", function() {
            $.CONSUME(StringLiteral)
            $.CONSUME(Colon)
            $.SUBRULE($.value)
        })

        this.RULE("array", function() {
            $.CONSUME(LSquare)
            $.OPTION(function() {
                $.SUBRULE($.value)
                $.MANY(function() {
                    $.CONSUME(Comma)
                    $.SUBRULE2($.value)
                })
            })
            $.CONSUME(RSquare)
        })

        // @formatter:off
    this.RULE("value", function () {
        $.OR([
            { ALT: function () { $.CONSUME(StringLiteral) }},
            { ALT: function () { $.CONSUME(NumberLiteral) }},
            { ALT: function () { $.SUBRULE($.object) }},
            { ALT: function () { $.SUBRULE($.array) }},
            { ALT: function () { $.CONSUME(True) }},
            { ALT: function () { $.CONSUME(False) }},
            { ALT: function () { $.CONSUME(Null) }}
        ], "a value")
    })
    // @formatter:on

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this)
    }

    // inheritance as implemented in javascript in the previous decade... :(
    JsonParserToMinifiy.prototype = Object.create(Parser.prototype)
    JsonParserToMinifiy.prototype.constructor = JsonParserToMinifiy

    // ----------------- wrapping it all together -----------------

    // reuse the same parser instance.
    var parser = new JsonParserToMinifiy([]);

    function parseJson(text) {
        var lexResult = JsonLexer.tokenize(text)

        parser.input = lexResult.tokens
        var value = parser.json()

        return {
            value:       value, // this is a pure grammar, the value will always be <undefined>
            lexErrors:   lexResult.errors,
            parseErrors: parser.errors
        };
    }

    return {
        parseJson:  parseJson,
        jsonParser: JsonParserToMinifiy,
        // Must export the names of the Tokens to allow safe minification.
        jsonTokens: allTokens
    }
}))
