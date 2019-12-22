import { Parser } from "../../src/parse/parser/traits/parser_traits"
import {
  EarlyExitException,
  NoViableAltException
} from "../../src/parse/exceptions_public"
import { augmentTokenTypes } from "../../src/scan/tokens"
import { createRegularToken } from "../utils/matchers"
import { IToken } from "../../api"

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

  let ALL_TOKENS = [A, B, C]
  augmentTokenTypes(ALL_TOKENS)

  it("OPTION", () => {
    function gateFunc() {
      return this.gate
    }

    class PredicateOptionParser extends Parser {
      constructor(input: IToken[] = [], private gate: boolean) {
        super(ALL_TOKENS, { outputCst: false })
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

    let gateOpenInputGood = new PredicateOptionParser(
      [createRegularToken(A)],
      true
    ).optionRule()
    expect(gateOpenInputGood).to.equal("entered!")

    let gateOpenInputBad = new PredicateOptionParser(
      [createRegularToken(B)],
      true
    ).optionRule()
    expect(gateOpenInputBad).to.equal("not entered!")

    let gateClosedInputGood = new PredicateOptionParser(
      [createRegularToken(A)],
      false
    ).optionRule()
    expect(gateClosedInputGood).to.equal("not entered!")

    let gateClosedInputBad = new PredicateOptionParser(
      [createRegularToken(B)],
      false
    ).optionRule()
    expect(gateClosedInputBad).to.equal("not entered!")
  })

  it("MANY", () => {
    function gateFunc() {
      return this.gate
    }

    class PredicateManyParser extends Parser {
      constructor(input: IToken[] = [], private gate: boolean) {
        super(ALL_TOKENS, { outputCst: false })
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

    let gateOpenInputGood = new PredicateManyParser(
      [createRegularToken(A), createRegularToken(A)],
      true
    ).manyRule()
    expect(gateOpenInputGood).to.equal("entered!")

    let gateOpenInputBad = new PredicateManyParser(
      [createRegularToken(B)],
      true
    ).manyRule()
    expect(gateOpenInputBad).to.equal("not entered!")

    let gateClosedInputGood = new PredicateManyParser(
      [createRegularToken(A), createRegularToken(A)],
      false
    ).manyRule()
    expect(gateClosedInputGood).to.equal("not entered!")

    let gateClosedInputBad = new PredicateManyParser(
      [createRegularToken(B)],
      false
    ).manyRule()
    expect(gateClosedInputBad).to.equal("not entered!")
  })

  it("AT_LEAST_ONE", () => {
    function gateFunc() {
      return this.gate
    }

    class PredicateAtLeastOneParser extends Parser {
      constructor(input: IToken[] = [], private gate: boolean) {
        super(ALL_TOKENS, { outputCst: false })
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

    let gateOpenInputGood = new PredicateAtLeastOneParser(
      [createRegularToken(A), createRegularToken(A)],
      true
    ).atLeastOneRule()
    expect(gateOpenInputGood).to.equal("entered!")

    let gateOpenInputBadParser = new PredicateAtLeastOneParser(
      [createRegularToken(B)],
      true
    )
    gateOpenInputBadParser.atLeastOneRule()
    expect(gateOpenInputBadParser.errors).to.have.lengthOf(1)
    expect(gateOpenInputBadParser.errors[0]).to.be.an.instanceOf(
      EarlyExitException
    )

    let gateClosedInputGood = new PredicateAtLeastOneParser(
      [createRegularToken(A), createRegularToken(A)],
      false
    )
    gateClosedInputGood.atLeastOneRule()
    expect(gateClosedInputGood.errors).to.have.lengthOf(1)
    expect(gateClosedInputGood.errors[0]).to.be.an.instanceOf(
      EarlyExitException
    )

    let gateClosedInputBad = new PredicateAtLeastOneParser(
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

    class PredicateOrParser extends Parser {
      constructor(input: IToken[] = [], private gate: boolean) {
        super(ALL_TOKENS, { outputCst: false })
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

    let gateOpenInputA = new PredicateOrParser(
      [createRegularToken(A)],
      true
    ).orRule()
    expect(gateOpenInputA).to.equal("A")

    let gateOpenInputB = new PredicateOrParser(
      [createRegularToken(B)],
      true
    ).orRule()
    expect(gateOpenInputB).to.equal("B")

    let gateOpenInputC = new PredicateOrParser(
      [createRegularToken(C)],
      true
    ).orRule()
    expect(gateOpenInputC).to.equal("C")

    let gateClosedInputA = new PredicateOrParser(
      [createRegularToken(A)],
      false
    ).orRule()
    expect(gateClosedInputA).to.equal("A")

    let gateClosedInputBad = new PredicateOrParser(
      [createRegularToken(B)],
      false
    )
    gateClosedInputBad.orRule()
    expect(gateClosedInputBad.errors).to.have.lengthOf(1)
    expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(
      NoViableAltException
    )

    let gateClosedInputC = new PredicateOrParser(
      [createRegularToken(C)],
      false
    ).orRule()
    expect(gateClosedInputC).to.equal("C")
  })

  describe("Predicates shall work with parametrized rules (issue #221)", () => {
    it("predicates in OR", () => {
      class PredicateWithRuleOrParser extends Parser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { outputCst: false })
          this.performSelfAnalysis()
          this.input = input
        }

        public topRule = this.RULE("topRule", param => {
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

      let gateOpenInputA = new PredicateWithRuleOrParser([
        createRegularToken(A, "a")
      ]).topRule(1, [true])
      expect(gateOpenInputA).to.equal("a")

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      let gateOpenInputB = new PredicateWithRuleOrParser([
        createRegularToken(B, "b")
      ]).topRule(1, [false])
      expect(gateOpenInputB).to.equal("b")
    })

    it("predicates in OPTION", () => {
      class PredicateWithRuleOptionParser extends Parser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { outputCst: false })
          this.performSelfAnalysis()
          this.input = input
        }

        public topRule = this.RULE("topRule", param => {
          let result = ""
          result += this.CONSUME1(B).image

          return result
        })
      }

      const parser = new PredicateWithRuleOptionParser([
        createRegularToken(B, "b")
      ])
      let gateOpenInputB = parser.topRule(1, [false])
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
      class PredicateWithRuleManyParser extends Parser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { outputCst: false })
          this.performSelfAnalysis()
          this.input = input
        }

        public topRule = this.RULE("topRule", param => {
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

      let gateOpenInputB = new PredicateWithRuleManyParser([
        createRegularToken(B, "b")
      ]).topRule(1, [false])
      expect(gateOpenInputB).to.equal("b")

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      // because the <() => param> in the MANY will ALWAYS return false (the original param)
      let gateOpenInputA = new PredicateWithRuleManyParser([
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(B, "b")
      ]).topRule(1, [true])
      expect(gateOpenInputA).to.equal("aaab")
    })

    it("predicates in AT_LEAST_ONE", () => {
      class PredicateWithRuleAtLeastOneParser extends Parser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { outputCst: false })
          this.performSelfAnalysis()
          this.input = input
        }

        public topRule = this.RULE("topRule", param => {
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

      let gateOpenInputB = new PredicateWithRuleAtLeastOneParser([
        createRegularToken(A, "a"),
        createRegularToken(B, "b")
      ]).topRule(1, [false])
      expect(gateOpenInputB).to.equal("ab")

      // if the predicate function still kept a reference via a closure to the original param this will not work.
      // because the <() => param> in the AT_LEAST_ONE will ALWAYS return false (the original param)
      let gateOpenInputA = new PredicateWithRuleAtLeastOneParser([
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(A, "a"),
        createRegularToken(B, "b")
      ]).topRule(1, [true])
      expect(gateOpenInputA).to.equal("aaab")
    })
  })
})
