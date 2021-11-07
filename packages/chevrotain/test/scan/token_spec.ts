import {
  createToken,
  tokenLabel,
  tokenMatcher,
  tokenName
} from "../../src/scan/tokens_public"
import { Lexer } from "../../src/scan/lexer_public"
import { createTokenInstance } from "../../src/scan/tokens_public"
import { singleAssignCategoriesToksMap } from "../../src/scan/tokens"
import { expect } from "chai"
import { TokenType } from "@chevrotain/types"

describe("The Chevrotain Tokens namespace", () => {
  context("createToken", () => {
    let TrueLiteral: TokenType
    let A: TokenType
    let B: TokenType
    let C: TokenType
    let D: TokenType
    let Plus: TokenType

    before(() => {
      TrueLiteral = createToken({ name: "TrueLiteral" })
      A = createToken({ name: "A" })
      B = createToken({ name: "B", categories: A })
      B.GROUP = "Special"
      C = createToken({
        name: "C",
        pattern: /\d+/,
        categories: B
      })
      D = createToken({
        name: "D",
        pattern: /\w+/,
        categories: B
      })
      Plus = createToken({ name: "Plus", pattern: /\+/ })
      Plus.LABEL = "+"
    })

    it("assigns `name` property to tokenTypes", () => {
      // FalseLiteral was created with an anonymous function as its constructor yet tokenName(...)
      // should still work correctly on it if the 'tokenName' property has been set on its constructor.
      expect(TrueLiteral.name).to.equal("TrueLiteral")
      expect(tokenName(TrueLiteral)).to.equal("TrueLiteral")
    })

    it("provides an createTokenInstance utility - creating an instance", () => {
      const aInstance = createTokenInstance(A, "Hello", 0, 4, 1, 1, 1, 5)
      expect(aInstance.image).to.equal("Hello")
      expect(aInstance.startOffset).to.equal(0)
      expect(aInstance.endOffset).to.equal(4)
      expect(aInstance.startLine).to.equal(1)
      expect(aInstance.endLine).to.equal(1)
      expect(aInstance.startColumn).to.equal(1)
      expect(aInstance.endColumn).to.equal(5)
    })

    it("provides an extendToken utility - creating a subclass instance", () => {
      const aInstance = createTokenInstance(A, "World", 0, 4, 1, 1, 1, 5)
      expect(aInstance.image).to.equal("World")
      expect(aInstance.startOffset).to.equal(0)
      expect(aInstance.endOffset).to.equal(4)
      expect(aInstance.startLine).to.equal(1)
      expect(aInstance.endLine).to.equal(1)
      expect(aInstance.startColumn).to.equal(1)
      expect(aInstance.endColumn).to.equal(5)
    })

    it("Allows customization of the label", () => {
      // Default to class name
      expect(tokenLabel(B)).to.equal("B")
      // Unless there's a LABEL property
      expect(tokenLabel(Plus)).to.equal("+")
    })

    it("provides a utility to verify if a token instance matches a Token Type", () => {
      const ATokRegular = createToken({
        name: "ATokRegular"
      })
      const BTokRegular = createToken({
        name: "BTokRegular"
      })
      const AInstanceRegular = createTokenInstance(
        ATokRegular,
        "a",
        -1,
        -1,
        -1,
        -1,
        -1,
        -1
      )
      const BInstanceRegular = createTokenInstance(
        BTokRegular,
        "b",
        -1,
        -1,
        -1,
        -1,
        -1,
        -1
      )

      expect(tokenMatcher(AInstanceRegular, ATokRegular)).to.be.true
      expect(tokenMatcher(AInstanceRegular, BTokRegular)).to.be.false
      expect(tokenMatcher(BInstanceRegular, BTokRegular)).to.be.true
      expect(tokenMatcher(BInstanceRegular, ATokRegular)).to.be.false
    })

    it("Will augment Token Constructors with additional metadata basic", () => {
      const A = createToken({ name: "A" })
      const B = createToken({ name: "B" })

      expect(A.tokenTypeIdx).to.be.greaterThan(0)
      expect(B.tokenTypeIdx).to.be.greaterThan(A.tokenTypeIdx!)

      expect(A.categoryMatches).to.be.an.instanceOf(Array)
      expect(A.categoryMatches).to.be.empty
      expect(B.categoryMatches).to.be.an.instanceOf(Array)
      expect(B.categoryMatches).to.be.empty
    })

    it("can define a token Label via the createToken utilities", () => {
      const A = createToken({
        name: "A",
        label: "bamba"
      })
      expect(tokenLabel(A)).to.equal("bamba")
    })

    it("can define a POP_MODE via the createToken utilities", () => {
      const A = createToken({
        name: "A",
        pop_mode: true
      })
      expect(A).to.haveOwnProperty("POP_MODE")
      expect(A.POP_MODE).to.be.true
    })

    it("can define a PUSH_MODE via the createToken utilities", () => {
      const A = createToken({
        name: "A",
        push_mode: "attribute"
      })
      expect(A).to.haveOwnProperty("PUSH_MODE")
      expect(A.PUSH_MODE).to.equal("attribute")
    })

    it("can define a LONGER_ALT via the createToken utilities", () => {
      const A = createToken({ name: "A" })
      const B = createToken({ name: "B", longer_alt: A })
      expect(B).to.haveOwnProperty("LONGER_ALT")
      expect(B.LONGER_ALT).to.equal(A)
    })

    it("can define multiple LONGER_ALT via the createToken utilities", () => {
      const A = createToken({ name: "A" })
      const B = createToken({ name: "B" })
      const C = createToken({ name: "C", longer_alt: [A, B] })
      expect(C).to.haveOwnProperty("LONGER_ALT")
      expect(C.LONGER_ALT).to.eql([A, B])
    })

    it("can define a token group via the createToken utilities", () => {
      const A = createToken({
        name: "A",
        group: Lexer.SKIPPED
      })
      expect(A).to.haveOwnProperty("GROUP")
      expect(A.GROUP).to.equal(Lexer.SKIPPED)
    })

    it("Will throw when using the deprecated parent flag", () => {
      expect(() =>
        createToken(<any>{
          name: "A",
          parent: "oops"
        })
      ).to.throw("The parent property is no longer supported")
    })

    it("will not go into infinite loop due to cyclic categories", () => {
      const A = createToken({ name: "A" })
      const B = createToken({ name: "B", categories: [A] })
      singleAssignCategoriesToksMap([A], B)
    })
  })
})
