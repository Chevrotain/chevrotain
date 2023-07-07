import { expect } from "chai"
import { tokenMatcher } from "chevrotain"
import { From, lex, Select, Identifier, From } from "./step1_lexing.js"

describe("Chevrotain Tutorial", () => {
  context("Step 1 - Lexing", () => {
    it("Can Lex a simple input", () => {
      const inputText = "SELECT column1 FROM table2"
      const lexingResult = lex(inputText)

      expect(lexingResult.errors).to.be.empty

      const tokens = lexingResult.tokens
      expect(tokens).to.have.lengthOf(4)
      expect(tokens[0].image).to.equal("SELECT")
      expect(tokens[1].image).to.equal("column1")
      expect(tokens[2].image).to.equal("FROM")
      expect(tokens[3].image).to.equal("table2")

      // tokenMatcher acts as an "instanceof" check for Tokens
      expect(tokenMatcher(tokens[0], Select)).to.be.true
      expect(tokenMatcher(tokens[1], Identifier)).to.be.true
      expect(tokenMatcher(tokens[2], From)).to.be.true
      expect(tokenMatcher(tokens[3], Identifier)).to.be.true
    })
  })
})
