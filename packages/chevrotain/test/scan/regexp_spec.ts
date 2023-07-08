import { createToken } from "../../src/scan/tokens_public.js"
import { Lexer } from "../../src/scan/lexer_public.js"
import {
  canMatchCharCode,
  getOptimizedStartCodesIndices
} from "../../src/scan/reg_exp.js"
import { expect } from "chai"

describe("The Chevrotain regexp analysis", () => {
  it("Will re-attempt none 'optimized' patterns if the optimization failed", () => {
    // won't be automatically optimized due to the '|' meta characters
    const Boolean = createToken({
      name: "Boolean",
      pattern: /true|false/,
      // But we provide the hints so it can be optimized
      start_chars_hint: ["t", "f"]
    })
    // simple string can perform optimization
    const Function = createToken({ name: "Function", pattern: "function" })
    // won't be optimized due to the '\w' and '+'
    const Name = createToken({ name: "False", pattern: /\w+/ })

    const WhiteSpace = createToken({
      name: "WhiteSpace",
      pattern: /\s+/,
      group: Lexer.SKIPPED,
      line_breaks: true
    })

    const allTokens = [WhiteSpace, Boolean, Function, Name]
    const JsonLexer = new Lexer(allTokens)
    const lexResult = JsonLexer.tokenize("fool")
    expect(lexResult.tokens).to.have.lengthOf(1)
    expect(lexResult.tokens[0].tokenType).to.equal(Name)
  })
})

describe("the regExp analysis", () => {
  context("first codes", () => {
    it("can compute for string literal", () => {
      expect(
        getOptimizedStartCodesIndices(
          /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
        )
      ).to.deep.equal([34])
    })

    it("can compute with assertions", () => {
      expect(getOptimizedStartCodesIndices(/^$\b\Ba/)).to.deep.equal([97])
    })

    it("can compute ranges", () => {
      expect(getOptimizedStartCodesIndices(/[\n-\r]/)).to.deep.equal([
        10, 11, 12, 13
      ])
    })

    it("can compute with optional quantifiers", () => {
      expect(getOptimizedStartCodesIndices(/b*a/)).to.deep.equal([97, 98])
    })

    it("will not compute when using complements", () => {
      expect(getOptimizedStartCodesIndices(/\D/)).to.be.empty
    })

    it("Can compute for ignore case", () => {
      expect(getOptimizedStartCodesIndices(/w|A/i)).to.deep.equal([
        65, 87, 97, 119
      ])
    })

    it("will not compute when using complements #2", () => {
      expect(getOptimizedStartCodesIndices(/[^a-z]/, true)).to.be.empty
    })

    it("correctly handles nested groups with and without quantifiers", () => {
      expect(getOptimizedStartCodesIndices(/(?:)c/)).to.deep.equal([99])
      expect(getOptimizedStartCodesIndices(/((ab)?)c/)).to.deep.equal([97, 99])
      expect(getOptimizedStartCodesIndices(/((ab))(c)/)).to.deep.equal([97])
      expect(getOptimizedStartCodesIndices(/((ab))?c/)).to.deep.equal([97, 99])
      expect(getOptimizedStartCodesIndices(/((a?((b?))))?c/)).to.deep.equal([
        97, 98, 99
      ])
      expect(getOptimizedStartCodesIndices(/((a?((b))))c/)).to.deep.equal([
        97, 98
      ])
      expect(getOptimizedStartCodesIndices(/((a+((b))))c/)).to.deep.equal([97])
    })
  })

  context("can match charCode", () => {
    it("with simple character valid", () => {
      expect(canMatchCharCode([10, 13], /\n/)).to.be.true
    })

    it("with simple character invalid", () => {
      expect(canMatchCharCode([10, 13], /a/)).to.be.false
    })

    it("with range valid", () => {
      expect(canMatchCharCode([13], /[\n-a]/)).to.be.true
    })

    it("with range invalid", () => {
      expect(canMatchCharCode([10, 13], /a-z/)).to.be.false
    })

    it("with range complement valid", () => {
      expect(canMatchCharCode([13], /[^a]/)).to.be.true
    })

    it("with range complement invalid", () => {
      expect(canMatchCharCode([13], /[^\r]/)).to.be.false
    })
  })
})
