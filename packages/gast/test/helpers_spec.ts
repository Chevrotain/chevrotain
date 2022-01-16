import { expect } from "chai"
import type { ITokenConfig, TokenType } from "@chevrotain/types"
import {
  Alternation,
  Terminal,
  Rule,
  Alternative,
  Repetition,
  RepetitionWithSeparator,
  RepetitionMandatoryWithSeparator,
  RepetitionMandatory,
  Option,
  NonTerminal,
  isSequenceProd,
  isOptionalProd,
  isBranchingProd
} from "../src/api"

function createDummyToken(opts: ITokenConfig): TokenType {
  return {
    name: opts.name,
    PATTERN: opts.pattern
  }
}

describe("the gast helper utilities", () => {
  let A: TokenType
  let B: TokenType

  before(() => {
    A = createDummyToken({ name: "A" })
    B = createDummyToken({ name: "B" })
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

      it("Alternation", () => {
        const prod = new Alternation({ definition: [] })
        const result = isSequenceProd(prod)
        expect(result).to.be.false
      })
    })
  })

  context("isOptionalProd()", () => {
    context("positive for", () => {
      it("an Alternation where some alternative is empty", () => {
        const prod = new Alternation({
          definition: [
            new Alternative({
              definition: [new Terminal({ terminalType: A })]
            }),
            new Alternative({ definition: [] })
          ]
        })
        const result = isOptionalProd(prod)
        expect(result).to.be.true
      })

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
      it("an Alternation where every alternative is non-empty", () => {
        const prod = new Alternation({
          definition: [
            new Alternative({
              definition: [new Terminal({ terminalType: A })]
            }),
            new Alternative({ definition: [new Terminal({ terminalType: B })] })
          ]
        })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })

      it("non empty Alternative", () => {
        const prod = new Alternative({
          definition: [new Terminal({ terminalType: A })]
        })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })

      it("NonTerminal", () => {
        const prod = new NonTerminal({ nonTerminalName: "bar" })
        const result = isSequenceProd(prod)
        expect(result).to.be.false
      })

      it("non-empty RepetitionMandatory", () => {
        const prod = new RepetitionMandatory({
          definition: [new Terminal({ terminalType: A })]
        })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })

      it("non-empty RepetitionMandatoryWithSeparator", () => {
        const prod = new RepetitionMandatoryWithSeparator({
          definition: [new Terminal({ terminalType: A })],
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

      it("none empty Rule", () => {
        const prod = new Rule({
          name: "foo",
          definition: [new Terminal({ terminalType: A })]
        })
        const result = isOptionalProd(prod)
        expect(result).to.be.false
      })
    })

    context("edge case", () => {
      it("will avoid infinite loop on recursive Non-Terminals", () => {
        const recursiveRule = new Rule({ name: "recursive", definition: [] })
        const recursiveNonTerminal = new NonTerminal({
          nonTerminalName: "recursive",
          referencedRule: recursiveRule
        })
        recursiveRule.definition = [recursiveNonTerminal]
        const result = isOptionalProd(recursiveNonTerminal)
        expect(result).to.be.false
      })
    })
  })

  context("isBranchingProd()", () => {
    context("positive for", () => {
      it("Alternation", () => {
        const prod = new Alternation({ definition: [] })
        const result = isBranchingProd(prod)
        expect(result).to.be.true
      })
    })

    context("negative for", () => {
      it("NonTerminal", () => {
        const prod = new NonTerminal({ nonTerminalName: "bar" })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("Alternative", () => {
        const prod = new Alternative({ definition: [] })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("Option", () => {
        const prod = new Option({ definition: [] })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("Option", () => {
        const prod = new Option({ definition: [] })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("Repetition", () => {
        const prod = new Repetition({ definition: [] })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("RepetitionMandatory", () => {
        const prod = new RepetitionMandatory({ definition: [] })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("RepetitionMandatoryWithSeparator", () => {
        const prod = new RepetitionMandatoryWithSeparator({
          definition: [],
          separator: A
        })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("RepetitionWithSeparator", () => {
        const prod = new RepetitionWithSeparator({
          definition: [],
          separator: A
        })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("Terminal", () => {
        const prod = new Terminal({
          terminalType: A
        })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })

      it("Rule", () => {
        const prod = new Rule({ name: "foo", definition: [] })
        const result = isBranchingProd(prod)
        expect(result).to.be.false
      })
    })
  })
})
