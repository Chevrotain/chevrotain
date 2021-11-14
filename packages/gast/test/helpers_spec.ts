import { expect } from "chai"
import type { ITokenConfig, TokenType } from "@chevrotain/types"
import {
  GAstVisitor,
  Terminal,
  Rule,
  Alternation,
  Alternative,
  Repetition,
  RepetitionWithSeparator,
  RepetitionMandatoryWithSeparator,
  RepetitionMandatory,
  Option,
  NonTerminal,
  isSequenceProd,
  isOptionalProd
} from "../src/api"

function createDummyToken(opts: ITokenConfig): TokenType {
  return {
    name: opts.name,
    PATTERN: opts.pattern
  }
}

describe("the gast helper utilities", () => {
  let A: TokenType

  // TODO: do we need this at all?
  before(() => {
    A = createDummyToken({ name: "A" })
  })

  context("isSequenceProd()", () => {
    context("positive for", () => {
      it("Alternative", () => {
        const prod = new Alternative({ definition: [] })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })

      it("Option", () => {
        const prod = new Option({ definition: [] })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })

      it("Option", () => {
        const prod = new Option({ definition: [] })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })

      it("Repetition", () => {
        const prod = new Repetition({ definition: [] })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })

      it("RepetitionMandatory", () => {
        const prod = new RepetitionMandatory({ definition: [] })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })

      it("RepetitionMandatoryWithSeparator", () => {
        const prod = new RepetitionMandatoryWithSeparator({
          definition: [],
          separator: A
        })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })

      it("RepetitionWithSeparator", () => {
        const prod = new RepetitionWithSeparator({
          definition: [],
          separator: A
        })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })

      it("Terminal", () => {
        const prod = new Terminal({
          terminalType: A
        })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })

      it("Rule", () => {
        const prod = new Rule({ name: "foo", definition: [] })
        const result = isSequenceProd(prod)
        expect(result).to.be.true
      })
    })

    context("negative for", () => {
      it("NonTerminal", () => {
        const prod = new NonTerminal({ nonTerminalName: "bar" })
        const result = isSequenceProd(prod)
        expect(result).to.be.false
      })
    })
  })

  context("isOptionalProd()", () => {
    context("positive for", () => {
      it("Option", () => {
        const prod = new Option({ definition: [] })
        const result = isOptionalProd(prod)
        expect(result).to.be.true
      })

      it("Repetition", () => {
        const prod = new Repetition({ definition: [] })
        const result = isOptionalProd(prod)
        expect(result).to.be.true
      })

      it("RepetitionWithSeparator", () => {
        const prod = new RepetitionWithSeparator({
          definition: [],
          separator: A
        })
        const result = isOptionalProd(prod)
        expect(result).to.be.true
      })
    })

    context("negative for", () => {
      it("Alternative", () => {
        const prod = new Alternative({ definition: [] })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })

      it("NonTerminal", () => {
        const prod = new NonTerminal({ nonTerminalName: "bar" })
        const result = isSequenceProd(prod)
        expect(result).to.be.false
      })

      it("RepetitionMandatory", () => {
        const prod = new RepetitionMandatory({ definition: [] })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })

      it("RepetitionMandatoryWithSeparator", () => {
        const prod = new RepetitionMandatoryWithSeparator({
          definition: [],
          separator: A
        })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })

      it("Terminal", () => {
        const prod = new Terminal({
          terminalType: A
        })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })

      it("Rule", () => {
        const prod = new Rule({ name: "foo", definition: [] })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })
    })
  })
})
