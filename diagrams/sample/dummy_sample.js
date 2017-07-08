;(function(root, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["chevrotain"], factory)
    } else if (typeof module === "object" && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("../../lib/chevrotain"))
    } else {
        // Browser globals (root is window)
        root.dummy_sample = factory(root.chevrotain)
    }
})(this, function(chevrotain) {
    // ----------------- lexer -----------------
    var createToken = chevrotain.createToken
    var Lexer = chevrotain.Lexer
    var Parser = chevrotain.Parser

    var True = createToken({ name: "True", pattern: "true" })
    var False = createToken({ name: "False", pattern: "false" })
    var Null = createToken({ name: "Null", pattern: "null" })
    var LCurly = createToken({ name: "LCurly", pattern: "{" })
    var RCurly = createToken({ name: "RCurly", pattern: "}" })
    var LSquare = createToken({ name: "LSquare", pattern: "[" })
    var RSquare = createToken({ name: "RSquare", pattern: "]" })
    var Comma = createToken({ name: "Comma", pattern: "," })
    var Colon = createToken({ name: "Colon", pattern: ":" })

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
        line_breaks: true
    })
    WhiteSpace.GROUP = Lexer.SKIPPED // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.

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

    // Labels only affect error messages and Diagrams.
    LCurly.LABEL = "'{'"
    RCurly.LABEL = "'}'"
    LSquare.LABEL = "'['"
    RSquare.LABEL = "']'"
    Comma.LABEL = "','"
    Colon.LABEL = "':'"

    // ----------------- parser -----------------

    function DummySampleParser(input) {
        // invoke super constructor
        Parser.call(this, input, allTokens)

        // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
        var $ = this

        this.json = this.RULE("json", function() {
            // prettier-ignore
            $.OR([
                {ALT: function() { $.SUBRULE($.object)}},
                {ALT: function() {$.SUBRULE($.array)}}
            ])
        })

        this.object = this.RULE("object", function() {
            $.CONSUME(LCurly)
            $.MANY_SEP(Comma, function() {
                $.SUBRULE2($.objectItem)
            })
            $.CONSUME(RCurly)
        })

        this.objectItem = this.RULE("objectItem", function() {
            $.CONSUME(StringLiteral)
            $.CONSUME(Colon)
            $.SUBRULE($.value)
        })

        this.array = this.RULE("array", function() {
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

        this.value = this.RULE("value", function() {
            // prettier-ignore
            $.OR(
                [
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
        Parser.performSelfAnalysis(this)
    }

    // inheritance as implemented in javascript in the previous decade... :(
    DummySampleParser.prototype = Object.create(Parser.prototype)
    DummySampleParser.prototype.constructor = DummySampleParser

    return {
        DummySampleParser: DummySampleParser
    }
})
