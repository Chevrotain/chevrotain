// Wrapping in a UMD Pattern will cause Uglify to identify the Token Constructors
// as private (not top level scope) and thus their names will be mangled which will cause runtime failures.
;(function(root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory(require("chevrotain"))
    } else if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["chevrotain"], factory)
    } else {
        root.jsonParserModule = factory(root.chevrotain)
    }
})(this, function(chevrotain) {
    // ----------------- lexer -----------------
    var createToken = chevrotain.createToken
    var Lexer = chevrotain.Lexer
    var CstParser = chevrotain.CstParser

    var True = createToken({ name: "True", pattern: /true/ })
    var False = createToken({ name: "False", pattern: /false/ })
    var Null = createToken({ name: "Null", pattern: /null/ })
    var LCurly = createToken({ name: "LCurly", pattern: /{/ })
    var RCurly = createToken({ name: "RCurly", pattern: /}/ })
    var LSquare = createToken({ name: "LSquare", pattern: /\[/ })
    var RSquare = createToken({ name: "RSquare", pattern: /]/ })
    var Comma = createToken({ name: "Comma", pattern: /,/ })
    var Colon = createToken({ name: "Colon", pattern: /:/ })
    var StringLiteral = createToken({
        name: "StringLiteral",
        pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
    })
    var NumberLiteral = createToken({
        name: "NumberLiteral",
        pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
    })
    var WhiteSpace = createToken({
        name: "WhiteSpace",
        pattern: /\s+/,
        group: Lexer.SKIPPED
    })

    var allTokens = [
        WhiteSpace,
        NumberLiteral,
        StringLiteral,
        LCurly,
        RCurly,
        LSquare,
        RSquare,
        Comma,
        Colon,
        True,
        False,
        Null
    ]
    var JsonLexer = new Lexer(allTokens)

    // ----------------- parser -----------------

    function JsonParserToMinifiy() {
        // invoke super constructor
        CstParser.call(this, allTokens)

        // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
        var $ = this

        this.RULE("json", function() {
            // prettier-ignore
            $.OR([
                {ALT: function() {$.SUBRULE($.object)}},
                {ALT: function() {$.SUBRULE($.array)}}
            ])
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

        this.RULE("value", function() {
            // prettier-ignore
            $.OR([
                {ALT: function() {$.CONSUME(StringLiteral)}},
                {ALT: function() {$.CONSUME(NumberLiteral)}},
                {ALT: function() {$.SUBRULE($.object)}},
                {ALT: function() {$.SUBRULE($.array)}},
                {ALT: function() {$.CONSUME(True)}},
                {ALT: function() {$.CONSUME(False)}},
                {ALT: function() {$.CONSUME(Null)}}
            ])
        })

        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        this.performSelfAnalysis()
    }

    // inheritance as implemented in javascript in the previous decade... :(
    JsonParserToMinifiy.prototype = Object.create(CstParser.prototype)
    JsonParserToMinifiy.prototype.constructor = JsonParserToMinifiy

    // ----------------- wrapping it all together -----------------

    // reuse the same parser instance.
    var parser = new JsonParserToMinifiy()

    function parseJson(text) {
        var lexResult = JsonLexer.tokenize(text)

        parser.input = lexResult.tokens
        var cst = parser.json()

        return {
            cst: cst,
            lexErrors: lexResult.errors,
            parseErrors: parser.errors
        }
    }

    return {
        parseJson: parseJson,
        jsonParser: JsonParserToMinifiy,
        // Must export the names of the Tokens to allow safe minification.
        jsonTokens: allTokens
    }
})
