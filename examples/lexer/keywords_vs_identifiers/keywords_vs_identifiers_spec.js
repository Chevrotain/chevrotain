var assert = require("assert")
var keyVsIdentLexer = require("./keywords_vs_identifiers")
var tokenMatcher = require("chevrotain").tokenMatcher

describe("The Chevrotain Lexer ability to distinguish keywords and identifiers", function() {
    it("will lex do as a keyword", function() {
        var text = "do"
        var lexResult = keyVsIdentLexer.tokenize(text)

        assert.equal(lexResult.errors.length, 0)
        assert.equal(lexResult.tokens.length, 1)
        assert.equal(lexResult.tokens[0].image, "do")
        assert.equal(
            tokenMatcher(lexResult.tokens[0], keyVsIdentLexer.Do),
            true
        )
    })

    it("will lex done as an Identifier", function() {
        var text = "done"
        var lexResult = keyVsIdentLexer.tokenize(text)

        assert.equal(lexResult.errors.length, 0)
        assert.equal(lexResult.tokens.length, 1)
        assert.equal(lexResult.tokens[0].image, "done")
        assert.equal(
            tokenMatcher(lexResult.tokens[0], keyVsIdentLexer.Identifier),
            true
        )
    })
})
