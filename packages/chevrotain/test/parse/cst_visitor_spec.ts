import { createToken } from "../../src/scan/tokens_public.js"
import { CstParser } from "../../src/parse/parser/traits/parser_traits.js"
import { createRegularToken } from "../utils/matchers.js"
import { keys } from "lodash-es"
import { IToken, TokenType } from "@chevrotain/types"
import { expect } from "chai"

describe("The CSTVisitor", () => {
  let BaseVisitor: any
  let parserInstance: any
  let BaseVisitorWithDefaults: any
  let A: TokenType
  let B: TokenType
  let C: TokenType

  // to avoid issues with other tests clearing the cache
  before(() => {
    A = createToken({ name: "A" })
    B = createToken({ name: "B" })
    C = createToken({ name: "C" })

    const ALL_TOKENS = [A, B, C]

    class CstTerminalParserReturnVisitor extends CstParser {
      constructor(input: IToken[] = []) {
        super(ALL_TOKENS, {})
        this.performSelfAnalysis()
      }

      public testRule = this.RULE("testRule", () => {
        this.CONSUME(A)
        this.CONSUME(B)
        this.OPTION({
          DEF: () => {
            this.SUBRULE(this.bamba)
          }
        })
      })

      public bamba = this.RULE("bamba", () => {
        this.CONSUME(C)
      })
    }

    parserInstance = new CstTerminalParserReturnVisitor([])
    BaseVisitor = parserInstance.getBaseCstVisitorConstructor()
    BaseVisitorWithDefaults =
      parserInstance.getBaseCstVisitorConstructorWithDefaults()
    parserInstance = new CstTerminalParserReturnVisitor([])
    BaseVisitor = parserInstance.getBaseCstVisitorConstructor()
    BaseVisitorWithDefaults =
      parserInstance.getBaseCstVisitorConstructorWithDefaults()
    // to hit all coverage branches
    BaseVisitorWithDefaults =
      parserInstance.getBaseCstVisitorConstructorWithDefaults()
  })

  it("can execute a Visitor with a return Value", () => {
    class CstVisitorValidator extends BaseVisitor {
      constructor() {
        super()
        this.validateVisitor()
      }

      testRule(ctx: any) {
        expect(keys(ctx)).to.deep.equal(["A", "B", "bamba"])
        return this.visit(ctx.bamba[0])
      }

      bamba(ctx: any) {
        expect(keys(ctx)).to.deep.equal(["C"])
        return 666
      }
    }

    const input = [
      createRegularToken(A),
      createRegularToken(B),
      createRegularToken(C)
    ]
    parserInstance.input = input
    const cst = parserInstance.testRule()

    const visitor = new CstVisitorValidator()
    expect(visitor.visit(cst)).to.equal(666)
  })

  it("can execute a Visitor with an 'in' param", () => {
    class CstVisitorValidator extends BaseVisitor {
      constructor() {
        super()
        this.validateVisitor()
      }

      testRule(ctx: any, param: any) {
        expect(keys(ctx)).to.deep.equal(["A", "B", "bamba"])
        return this.visit(ctx.bamba[0], param)
      }

      bamba(ctx: any, param: any) {
        // inspecting handling of optional arguments
        expect(this.visit(ctx.missingKey)).to.be.undefined
        expect(keys(ctx)).to.deep.equal(["C"])
        return 666 + param
      }
    }

    const input = [
      createRegularToken(A),
      createRegularToken(B),
      createRegularToken(C)
    ]
    parserInstance.input = input
    const cst = parserInstance.testRule()

    const visitor = new CstVisitorValidator()
    expect(visitor.visit(cst, 1)).to.equal(667)
  })

  it("can create a visitor with default methods implementations", () => {
    let visited = false
    class CstVisitorValidator extends BaseVisitorWithDefaults {
      constructor() {
        super()
        this.validateVisitor()
      }

      bamba(ctx: any) {
        expect(keys(ctx)).to.deep.equal(["C"])
        visited = true
      }
    }

    const input = [
      createRegularToken(A),
      createRegularToken(B),
      createRegularToken(C)
    ]
    parserInstance.input = input
    const cst = parserInstance.testRule()

    const visitor = new CstVisitorValidator()
    visitor.visit(cst)
    expect(visited).to.be.true
  })

  it("can invoke visit with an array", () => {
    class CstVisitorValidator extends BaseVisitor {
      constructor() {
        super()
        this.validateVisitor()
      }

      testRule(ctx: any, param: any) {
        expect(keys(ctx)).to.deep.equal(["A", "B", "bamba"])
        return this.visit(ctx["bamba"], param)
      }

      bamba(ctx: any, param: any) {
        expect(keys(ctx)).to.deep.equal(["C"])
        return 666 + param
      }
    }

    const input = [
      createRegularToken(A),
      createRegularToken(B),
      createRegularToken(C)
    ]
    parserInstance.input = input
    const cst = parserInstance.testRule()

    const visitor = new CstVisitorValidator()
    expect(visitor.visit([cst], 1)).to.equal(667)
    expect(visitor.visit([], 1)).to.be.undefined
  })

  it("can detect missing visitor methods", () => {
    class CstVisitorValidator extends BaseVisitor {
      constructor() {
        super()
        this.validateVisitor()
      }

      testRule(ctx: any, param: any) {}

      // missing "bamba" method
    }

    expect(() => new CstVisitorValidator()).to.throw(
      "Missing visitor method: <bamba>"
    )
    expect(() => new CstVisitorValidator()).to.throw(
      "Errors Detected in CST Visitor"
    )
  })
})
