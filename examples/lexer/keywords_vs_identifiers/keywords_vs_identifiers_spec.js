import assert from "assert"
import { tokenize, Do, Identifier } from "./keywords_vs_identifiers.js"
import { tokenMatcher } from "chevrotain"

describe("The Chevrotain Lexer ability to distinguish keywords and identifiers", () => {
  it("will lex do as a keyword", () => {
    const text = "do"
    const lexResult = tokenize(text)

    assert.equal(lexResult.errors.length, 0)
    assert.equal(lexResult.tokens.length, 1)
    assert.equal(lexResult.tokens[0].image, "do")
    assert.equal(tokenMatcher(lexResult.tokens[0], Do), true)
  })

  it("will lex done as an Identifier", () => {
    const text = "done"
    const lexResult = tokenize(text)

    assert.equal(lexResult.errors.length, 0)
    assert.equal(lexResult.tokens.length, 1)
    assert.equal(lexResult.tokens[0].image, "done")
    assert.equal(tokenMatcher(lexResult.tokens[0], Identifier), true)
  })
})
