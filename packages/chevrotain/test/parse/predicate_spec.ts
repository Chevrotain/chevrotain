import { EmbeddedActionsParser } from "../../src/parse/parser/traits/parser_traits"
import {
  EarlyExitException,
  NoViableAltException
} from "../../src/parse/exceptions_public"
import { augmentTokenTypes } from "../../src/scan/tokens"
import { createRegularToken } from "../utils/matchers"
import { IToken } from "../../api"
import { expect } from "chai"

describe("The chevrotain support for custom gates/predicates on DSL production:", () => {
  class A {
    static PATTERN = /a/
  }

  class B {
    static PATTERN = /a/
  }

  class C {
    static PATTERN = /a/
  }

  const ALL_TOKENS = [A, B, C]
  augmentTokenTypes(ALL_TOKENS)

  it("OPTION", () => {
    function gateFunc() {
      return this.gate
    }

    class PredicateOptionParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = [], private gate: boolean) {
        super(ALL_TOKENS, {})
        this.performSelfAnalysis()
        this.input = input
      }

      public optionRule = this.RULE("optionRule", () => {
        let result = "not entered!"
        this.OPTION({
          GATE: gateFunc,
          DEF: () => {
            this.CONSUME(A)
            result = "entered!"
          }
        })
        return result
      })
    }

    const gateOpenInputGood = new PredicateOptionParser(
      [createRegularToken(A)],
      true
    ).optionRule()
    expect(gateOpenInputGood).to.equal("entered!")

    const gateOpenInputBad = new PredicateOptionParser(
      [createRegularToken(B)],
      true
    ).optionRule()
    expect(gateOpenInputBad).to.equal("not entered!")

    const gateClosedInputGood = new PredicateOptionParser(
      [createRegularToken(A)],
      false
    ).optionRule()
    expect(gateClosedInputGood).to.equal("not entered!")

    const gateClosedInputBad = new PredicateOptionParser(
      [createRegularToken(B)],
      false
    ).optionRule()
    expect(gateClosedInputBad).to.equal("not entered!")
  })

  it("MANY", () => {
    function gateFunc() {
      return this.gate
    }

    class PredicateManyParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = [], private gate: boolean) {
        super(ALL_TOKENS, {})
        this.performSelfAnalysis()
        this.input = input
      }

      public manyRule = this.RULE("manyRule", () => {
        let result = "not entered!"
        this.MANY({
          GATE: gateFunc,
          DEF: () => {
            this.CONSUME(A)
            result = "entered!"
          }
        })

        return result
      })
    }

    const gateOpenInputGood = new PredicateManyParser(
      [createRegularToken(A), createRegularToken(A)],
      true
    ).manyRule()
    expect(gateOpenInputGood).to.equal("entered!")

    const gateOpenInputBad = new PredicateManyParser(
      [createRegularToken(B)],
      true
    ).manyRule()
    expect(gateOpenInputBad).to.equal("not entered!")

    const gateClosedInputGood = new PredicateManyParser(
      [createRegularToken(A), createRegularToken(A)],
      false
    ).manyRule()
    expect(gateClosedInputGood).to.equal("not entered!")

    const gateClosedInputBad = new PredicateManyParser(
      [createRegularToken(B)],
      false
    ).manyRule()
    expect(gateClosedInputBad).to.equal("not entered!")
  })

  it("AT_LEAST_ONE", () => {
    function gateFunc() {
      return this.gate
    }

    class PredicateAtLeastOneParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = [], private gate: boolean) {
        super(ALL_TOKENS, {})
        this.performSelfAnalysis()
        this.input = input
      }

      public atLeastOneRule = this.RULE("atLeastOneRule", () => {
        let result = "not entered!"
        this.AT_LEAST_ONE({
          GATE: gateFunc,
          DEF: () => {
            this.CONSUME(A)
            result = "entered!"
          }
        })

        return result
      })
    }

    const gateOpenInputGood = new PredicateAtLeastOneParser(
      [createRegularToken(A), createRegularToken(A)],
      true
    ).atLeastOneRule()
    expect(gateOpenInputGood).to.equal("entered!")

    const gateOpenInputBadParser = new PredicateAtLeastOneParser(
      [createRegularToken(B)],
      true
    )
    gateOpenInputBadParser.atLeastOneRule()
    expect(gateOpenInputBadParser.errors).to.have.lengthOf(1)
    expect(gateOpenInputBadParser.errors[0]).to.be.an.instanceOf(
      EarlyExitException
    )

    const gateClosedInputGood = new PredicateAtLeastOneParser(
      [createRegularToken(A), createRegularToken(A)],
      false
    )
    gateClosedInputGood.atLeastOneRule()
    expect(gateClosedInputGood.errors).to.have.lengthOf(1)
    expect(gateClosedInputGood.errors[0]).to.be.an.instanceOf(
      EarlyExitException
    )

    const gateClosedInputBad = new PredicateAtLeastOneParser(
      [createRegularToken(B)],
      false
    )
    gateClosedInputBad.atLeastOneRule()
    expect(gateClosedInputBad.errors).to.have.lengthOf(1)
    expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(EarlyExitException)
  })

  it("OR", () => {
    function gateFunc() {
      return this.gate
    }

    class PredicateOrParser extends EmbeddedActionsParser {
      constructor(input: IToken[] = [], private gate: boolean) {
        super(ALL_TOKENS, {})
        this.performSelfAnalysis()
        this.input = input
      }

      public orRule = this.RULE("orRule", () => {
        return this.OR7([
          // no predicate
          {
            ALT: () => {
              this.CONSUME1(A)
              return "A"
            }
          }, // Has predicate
          {
            GATE: gateFunc,
            ALT: () => {
              this.CONSUME1(B)
              return "B"
            }
          },
          // No predicate
          {
            ALT: () => {
              this.CONSUME1(C)
              return "C"
            }
          }
        ])
      })
    }

    const gateOpenInputA = new PredicateOrParser(
      [createRegularToken(A)],
      true
    ).orRule()
    expect(gateOpenInputA).to.equal("A")

    const gateOpenInputB = new PredicateOrParser(
      [createRegularToken(B)],
      true
    ).orRule()
    expect(gateOpenInputB).to.equal("B")

    const gateOpenInputC = new PredicateOrParser(
      [createRegularToken(C)],
      true
    ).orRule()
    expect(gateOpenInputC).to.equal("C")

    const gateClosedInputA = new PredicateOrParser(
      [createRegularToken(A)],
      false
    ).orRule()
    expect(gateClosedInputA).to.equal("A")

    const gateClosedInputBad = new PredicateOrParser(
      [createRegularToken(B)],
      false
    )
    gateClosedInputBad.orRule()
    expect(gateClosedInputBad.errors).to.have.lengthOf(1)
    expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(
      NoViableAltException
    )

    const gateClosedInputC = new PredicateOrParser(
      [createRegularToken(C)],
      false
    ).orRule()
    expect(gateClosedInputC).to.equal("C")
  })

  describe("Predicates shall work with parametrized rules (issue #221)", () => {
    it("predicates in OR", () => {
      class PredicateWithRuleOrParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {})
          this.performSelfAnalysis()
          this.input = input
        }

        public topRule = this.RULE("topRule", (param) => {
          return this.OR1([
            {
              GATE: () => param,
              ALT: () => this.CONSUME1(A).image
            },
            {
              GATE: () => !param,
              ALT: () => this.CONSUME1(B).image
            }
          ])
        })
      }

      const gateOpenInputA = new PredicateWithRuleOrParser([
        createRegularToken(A, "a")
      ]).topRule(1, [true])
      expect(gateOpenInputA).to.equal("a")

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      const gateOpenInputB = new PredicateWithRuleOrParser([
        createRegularToken(B, "b")
      ]).topRule(1, [false])
      expect(gateOpenInputB).to.equal("b")
    })

    it("predicates in OPTION", () => {
      class PredicateWithRuleOptionParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {})
          this.performSelfAnalysis()
          this.input = input
        }

        public topRule = this.RULE("topRule", (param) => {
          let result = ""
          result += this.CONSUME1(B).image

          return result
        })
      }

      const parser = new PredicateWithRuleOptionParser([
        createRegularToken(B, "b")
      ])
      const gateOpenInputB = parser.topRule(1, [false])
      expect(gateOpenInputB).to.equal("b")

      // // if the predicate function still kept a reference via a closure to the original param this will not work.
      // // because the <() => param> in the OPTION will ALWAYS return false (the original param)
      // let gateOpenInputA = new PredicateWithRuleOptionParser([
      //     createRegularToken(A, "a"),
      //     createRegularToken(B, "b")
      // ]).topRule(1, [true])
      // expect(gateOpenInputA).to.equal("ab")
    })

    it("predicates in MANY", () => {
      class PredicateWithRuleManyParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {})
          this.performSelfAnalysis()
          this.input = input
        }

        public topRule = this.RULE("topRule", (param) => {
          let result = ""
          this.MANY({
            GATE: () => param,
            DEF: () => {
              result += this.CONSUME1(A).image
            }
          })
          result += this.CONSUME1(B).image
          return result
        })
      }

      const gateOpenInputB = new PredicateWithRuleManyParser([
        createRegularToken(B, "b")
      ]).topRule(1, [false])
      expect(gateOpenInputB).to.equal("b")

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      // because the <() => param> in the MANY will ALWAYS return false (the original param)
      const gateOpenInputA = new PredicateWithRuleManyParser([
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(B, "b")
      ]).topRule(1, [true])
      expect(gateOpenInputA).to.equal("aaab")
    })

    it("predicates in AT_LEAST_ONE", () => {
      class PredicateWithRuleAtLeastOneParser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {})
          this.performSelfAnalysis()
          this.input = input
        }

        public topRule = this.RULE("topRule", (param) => {
          let times = 0

          function gateFunc() {
            // got to enter at least once...
            if (times === 0) {
              times++
              return true
            } else {
              return param
            }
          }

          let result = ""
          this.AT_LEAST_ONE({
            GATE: gateFunc,
            DEF: () => {
              result += this.CONSUME1(A).image
            }
          })
          result += this.CONSUME1(B).image
          return result
        })
      }

      const gateOpenInputB = new PredicateWithRuleAtLeastOneParser([
        createRegularToken(A, "a"),
        createRegularToken(B, "b")
      ]).topRule(1, [false])
      expect(gateOpenInputB).to.equal("ab")

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      // because the <() => param> in the AT_LEAST_ONE will ALWAYS return false (the original param)
      const gateOpenInputA = new PredicateWithRuleAtLeastOneParser([
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(B, "b")
      ]).topRule(1, [true])
      expect(gateOpenInputA).to.equal("aaab")
    })
  })
})
