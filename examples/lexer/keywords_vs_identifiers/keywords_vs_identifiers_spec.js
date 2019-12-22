const assert = require("assert")
const keyVsIdentLexer = require("./keywords_vs_identifiers")
const { tokenMatcher } = require("chevrotain")

describe("The Chevrotain Lexer ability to distinguish keywords and identifiers", () => {
  it("will lex do as a keyword", () => {
    const text = "do"
    const lexResult = keyVsIdentLexer.tokenize(text)

    assert.equal(lexResult.errors.length, 0)
    assert.equal(lexResult.tokens.length, 1)
    assert.equal(lexResult.tokens[0].image, "do")
    assert.equal(tokenMatcher(lexResult.tokens[0], keyVsIdentLexer.Do), true)
  })

  it("will lex done as an Identifier", () => {
    const text = "done"
    const lexResult = keyVsIdentLexer.tokenize(text)

    assert.equal(lexResult.errors.length, 0)
    assert.equal(lexResult.tokens.length, 1)
    assert.equal(lexResult.tokens[0].image, "done")
    assert.equal(
      tokenMatcher(lexResult.tokens[0], keyVsIdentLexer.Identifier),
      true
    )
  })
})
