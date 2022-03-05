import { createRegularToken } from "../../utils/matchers"
import { EmbeddedActionsParser } from "../../../src/parse/parser/traits/parser_traits"
import { createToken, EOF } from "../../../src/scan/tokens_public"
import { expect } from "chai"

describe("ATN Simulator", () => {
  describe("LL(*) lookahead", () => {
    const A = createToken({ name: "A", pattern: "a" })
    const B = createToken({ name: "B", pattern: "b" })

    class UnboundedLookaheadParser extends EmbeddedActionsParser {
      constructor() {
        super([A, B])
        this.performSelfAnalysis()
      }

      LongRule = this.RULE("LongRule", () => {
        return this.OR([
          {
            ALT: () => {
              return 0
            }
          },
          {
            ALT: () => {
              this.AT_LEAST_ONE1(() => this.CONSUME1(A))
              return 1
            }
          },
          {
            ALT: () => {
              this.AT_LEAST_ONE2(() => this.CONSUME2(A))
              this.CONSUME(B)
              return 2
            }
          }
        ])
      })
    }

    it("Should pick longest alternative instead of first #1", () => {
      const parser = new UnboundedLookaheadParser()
      parser.input = [
        createRegularToken(A),
        createRegularToken(A),
        createRegularToken(A)
      ]
      const result = parser.LongRule()
      expect(result).to.be.equal(1)
    })

    it("Should pick longest alternative instead of first #2", () => {
      const parser = new UnboundedLookaheadParser()
      parser.input = [
        createRegularToken(A),
        createRegularToken(A),
        createRegularToken(B)
      ]
      const result = parser.LongRule()
      expect(result).to.be.equal(2)
    })

    it("Should pick shortest fitting alternative", () => {
      const parser = new UnboundedLookaheadParser()
      parser.input = []
      const result = parser.LongRule()
      expect(result).to.be.equal(0)
    })
  })

  describe("Ambiguity Detection", () => {
    const A = createToken({ name: "A" })
    const B = createToken({ name: "B" })

    class AmbigiousParser extends EmbeddedActionsParser {
      ambiguityReports: string[] = []

      constructor() {
        super([A, B])
        this.performSelfAnalysis()
      }

      logLookaheadAmbiguity(message: string) {
        this.ambiguityReports.push(message)
      }

      OptionRule = this.RULE("OptionRule", () => {
        let usedOption = false
        this.OPTION(() => {
          this.AT_LEAST_ONE1(() => this.CONSUME1(A))
          usedOption = true
        })
        this.AT_LEAST_ONE2(() => this.CONSUME2(A))
        return usedOption
      })

      AltRule = this.RULE("AltRule", () => {
        return this.OR([
          {
            ALT: () => {
              this.SUBRULE(this.RuleB)
              return 0
            }
          },
          {
            ALT: () => {
              this.SUBRULE(this.RuleC)
              return 1
            }
          }
        ])
      })

      RuleB = this.RULE("RuleB", () => {
        this.MANY(() => this.CONSUME(A))
      })

      RuleC = this.RULE("RuleC", () => {
        this.MANY(() => this.CONSUME(A))
        this.OPTION(() => this.CONSUME(B))
      })

      AltRuleWithEOF = this.RULE("AltRuleWithEOF", () => {
        return this.OR([
          {
            ALT: () => {
              this.SUBRULE1(this.RuleEOF)
              return 0
            }
          },
          {
            ALT: () => {
              this.SUBRULE2(this.RuleEOF)
              return 1
            }
          }
        ])
      })

      RuleEOF = this.RULE("RuleEOF", () => {
        this.MANY1(() => this.CONSUME(A))
        this.CONSUME(EOF)
      })

      AltRuleWithPred = this.RULE("AltRuleWithPred", (pred?: boolean) => {
        return this.OR([
          {
            ALT: () => {
              this.CONSUME1(A)
              return 0
            },
            GATE: () => (pred === undefined ? true : pred)
          },
          {
            ALT: () => {
              this.CONSUME2(A)
              return 1
            },
            GATE: () => (pred === undefined ? true : !pred)
          }
        ])
      })
    }

    it("Should pick option on ambiguity", () => {
      const parser = new AmbigiousParser()
      parser.input = [
        createRegularToken(A),
        createRegularToken(A),
        createRegularToken(A)
      ]
      const result = parser.OptionRule()
      expect(result).to.be.true
      // The rule nests a `AT_LEAST_ONE` inside and outside the OPTION
      // Both productions produce lookahead ambiguities
      expect(parser.ambiguityReports[0]).to.include("<0, 1> in <OPTION>")
      expect(parser.ambiguityReports[1]).to.include("<0, 1> in <AT_LEAST_ONE1>")
    })

    it("Should pick first alternative on ambiguity", () => {
      const parser = new AmbigiousParser()
      parser.input = [
        createRegularToken(A),
        createRegularToken(A),
        createRegularToken(A)
      ]
      const result = parser.AltRule()
      expect(result).to.be.equal(0)
      expect(parser.ambiguityReports[0]).to.include("<0, 1> in <OR>")
    })

    it("Should pick first alternative on EOF ambiguity", () => {
      const parser = new AmbigiousParser()
      parser.input = []
      const result = parser.AltRuleWithEOF()
      expect(result).to.be.equal(0)
      expect(parser.ambiguityReports[0]).to.include("<0, 1> in <OR>")
    })

    it("Should pick correct alternative on long prefix", () => {
      const parser = new AmbigiousParser()
      parser.input = [
        createRegularToken(A),
        createRegularToken(A),
        createRegularToken(B)
      ]
      const result = parser.AltRule()
      expect(result).to.be.equal(1)
      expect(parser.ambiguityReports).to.be.empty
    })

    it("Should resolve ambiguity using predicate", () => {
      const parser = new AmbigiousParser()
      parser.input = [createRegularToken(A)]
      const resultAutomatic = parser.AltRuleWithPred(undefined)
      // Automatically resolving the ambiguity should return `0`
      expect(resultAutomatic).to.be.equal(0)
      expect(parser.ambiguityReports[0]).to.include("<0, 1> in <OR>")
      parser.ambiguityReports = []
      parser.input = [createRegularToken(A)]
      const resultTrue = parser.AltRuleWithPred(true)
      expect(resultTrue).to.be.equal(0)
      parser.input = [createRegularToken(A)]
      const resultFalse = parser.AltRuleWithPred(false)
      expect(resultFalse).to.be.equal(1)
      expect(parser.ambiguityReports).to.be.empty
    })
  })
})
