import { createToken } from "../../src/scan/tokens_public"
import { CstParser } from "../../src/parse/parser/traits/parser_traits"
import { tokenStructuredMatcher as tokenStructuredMatcherStrict } from "../../src/scan/tokens"
import { createRegularToken } from "../utils/matchers"
import map from "lodash/map"
import { CstElement, CstNode, IToken, TokenType } from "@chevrotain/types"
import { expect } from "chai"

function createTokenVector(tokTypes: TokenType[]): any[] {
  return map(tokTypes, (curTokType) => {
    return createRegularToken(curTokType)
  })
}

const tokenStructuredMatcher = tokenStructuredMatcherStrict as (
  a: CstElement,
  b: TokenType
) => boolean

function defineTestSuite(recoveryMode: boolean) {
  context(`CST Recovery: ${recoveryMode}`, () => {
    const A = createToken({ name: "A" })
    const B = createToken({ name: "B" })
    const C = createToken({ name: "C" })
    const D = createToken({ name: "D" })
    const E = createToken({ name: "E" })

    const ALL_TOKENS = [A, B, C, D, E]

    it("Can output a CST for a flat structure", () => {
      class CstTerminalParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { recoveryEnabled: recoveryMode })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.CONSUME(A)
          this.CONSUME(B)
          this.SUBRULE(this.bamba)
        })

        public bamba = this.RULE("bamba", () => {
          this.CONSUME(C)
        })
      }

      const input = [
        createRegularToken(A),
        createRegularToken(B),
        createRegularToken(C)
      ]
      const parser = new CstTerminalParser(input)
      const cst: any = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("A", "B", "bamba")
      expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
      expect(cst.children.bamba[0].name).to.equal("bamba")
      expect(tokenStructuredMatcher(cst.children.bamba[0].children.C[0], C)).to
        .be.true
    })

    it("Can output a CST with labels", () => {
      class CstTerminalParser2 extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, { recoveryEnabled: recoveryMode })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.CONSUME(A, { LABEL: "myLabel" })
          this.CONSUME(B)
          this.SUBRULE(this.bamba, { LABEL: "myOtherLabel" })
        })

        public bamba = this.RULE("bamba", () => {
          this.CONSUME(C)
        })
      }

      const input = [
        createRegularToken(A),
        createRegularToken(B),
        createRegularToken(C)
      ]
      const parser = new CstTerminalParser2(input)
      const cst: any = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("myLabel", "B", "myOtherLabel")
      expect(tokenStructuredMatcher(cst.children.myLabel[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
      expect(cst.children.myOtherLabel[0].name).to.equal("bamba")
      expect(
        tokenStructuredMatcher(cst.children.myOtherLabel[0].children.C[0], C)
      ).to.be.true
    })

    it("Can output a CST with labels in recovery", () => {
      class CstTerminalParserWithLabels extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: true
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.CONSUME(A, { LABEL: "myLabel" })
          this.CONSUME(B)
          this.SUBRULE(this.bamba, { LABEL: "myOtherLabel" })
        })

        public bamba = this.RULE("bamba", () => {
          this.CONSUME(C)
        })
      }

      const input = [createRegularToken(A), createRegularToken(B)]
      const parser = new CstTerminalParserWithLabels(input)
      const cst = parser.testRule()

      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("myLabel", "B", "myOtherLabel")
      expect(tokenStructuredMatcher(cst.children.myLabel[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

      const bamba = cst.children.myOtherLabel[0] as CstNode
      expect(bamba.name).to.equal("bamba")
      expect(bamba.recoveredNode).to.be.true
    })

    it("Can output a CST for a Terminal - alternations", () => {
      class CstTerminalAlternationParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.OR([
            {
              ALT: () => {
                this.CONSUME(A)
              }
            },
            {
              ALT: () => {
                this.CONSUME(B)
                this.SUBRULE(this.bamba)
              }
            }
          ])
        })

        public bamba = this.RULE("bamba", () => {
          this.CONSUME(C)
        })
      }

      const input = [createRegularToken(A)]
      const parser = new CstTerminalAlternationParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("A")
      expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
      expect(cst.children.bamba).to.be.undefined
    })

    it("Can output a CST for a Terminal - alternations - single", () => {
      class CstTerminalAlternationSingleAltParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.OR([
            {
              ALT: () => {
                this.CONSUME(A)
                this.CONSUME(B)
              }
            }
          ])
        })
      }

      const input = [createRegularToken(A), createRegularToken(B)]
      const parser = new CstTerminalAlternationSingleAltParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("A", "B")
      expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
    })

    it("Can output a CST for a Terminal with multiple occurrences", () => {
      class CstMultiTerminalParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.CONSUME(A)
          this.CONSUME(B)
          this.CONSUME2(A)
        })
      }

      const input = [
        createRegularToken(A),
        createRegularToken(B),
        createRegularToken(A)
      ]
      const parser = new CstMultiTerminalParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("A", "B")
      expect(cst.children.A).to.have.length(2)
      expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
    })

    it("Can output a CST for a Terminal with multiple occurrences - iteration", () => {
      class CstMultiTerminalWithManyParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.MANY(() => {
            this.CONSUME(A)
            this.SUBRULE(this.bamba)
          })
          this.CONSUME(B)
        })

        public bamba = this.RULE("bamba", () => {
          this.CONSUME(C)
        })
      }

      const input = [
        createRegularToken(A),
        createRegularToken(C),
        createRegularToken(A),
        createRegularToken(C),
        createRegularToken(A),
        createRegularToken(C),
        createRegularToken(B)
      ]
      const parser = new CstMultiTerminalWithManyParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("A", "B", "bamba")
      expect(cst.children.A).to.have.length(3)
      expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.A[2], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
      expect(cst.children.bamba).to.have.length(3)

      const children = cst.children.bamba as CstNode[]
      expect(tokenStructuredMatcher(children[0].children.C[0], C)).to.be.true
      expect(tokenStructuredMatcher(children[1].children.C[0], C)).to.be.true
      expect(tokenStructuredMatcher(children[2].children.C[0], C)).to.be.true
    })

    context("Can output a CST for an optional terminal", () => {
      class CstOptionalTerminalParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public ruleWithOptional = this.RULE("ruleWithOptional", () => {
          this.OPTION(() => {
            this.CONSUME(A)
            this.SUBRULE(this.bamba)
          })
          this.CONSUME(B)
        })

        public bamba = this.RULE("bamba", () => {
          this.CONSUME(C)
        })
      }

      it("path taken", () => {
        const input = [
          createRegularToken(A),
          createRegularToken(C),
          createRegularToken(B)
        ]
        const parser = new CstOptionalTerminalParser(input)
        const cst = parser.ruleWithOptional()
        expect(cst.name).to.equal("ruleWithOptional")
        expect(cst.children).to.have.keys("A", "B", "bamba")
        expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true

        const bamba = cst.children.bamba[0] as CstNode
        expect(bamba.name).to.equal("bamba")
        expect(tokenStructuredMatcher(bamba.children.C[0], C)).to.be.true
        expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
      })

      it("path NOT taken", () => {
        const input = [createRegularToken(B)]
        const parser = new CstOptionalTerminalParser(input)
        const cst = parser.ruleWithOptional()
        expect(cst.name).to.equal("ruleWithOptional")
        expect(cst.children).to.have.keys("B")
        expect(cst.children.A).to.be.undefined
        expect(cst.children.bamba).to.be.undefined
        expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
      })
    })

    it("Can output a CST for a Terminal with multiple occurrences - iteration mandatory", () => {
      class CstMultiTerminalWithAtLeastOneParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.AT_LEAST_ONE(() => {
            this.CONSUME(A)
          })
          this.CONSUME(B)
        })
      }

      const input = [
        createRegularToken(A),
        createRegularToken(A),
        createRegularToken(A),
        createRegularToken(B)
      ]
      const parser = new CstMultiTerminalWithAtLeastOneParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("A", "B")
      expect(cst.children.A).to.have.length(3)
      expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.A[2], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
    })

    it("Can output a CST for a Terminal with multiple occurrences - iteration SEP", () => {
      class CstMultiTerminalWithManySepParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.MANY_SEP({
            SEP: C,
            DEF: () => {
              this.CONSUME(A)
            }
          })
          this.CONSUME(B)
        })
      }

      const input = [
        createRegularToken(A),
        createRegularToken(C),
        createRegularToken(A),
        createRegularToken(B)
      ]
      const parser = new CstMultiTerminalWithManySepParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("A", "B", "C")
      expect(cst.children.A).to.have.length(2)
      expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

      expect(cst.children.C).to.have.length(1)
      expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true
    })

    it("Can output a CST for a Terminal with multiple occurrences - iteration SEP mandatory", () => {
      class CstMultiTerminalWithAtLeastOneSepParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.AT_LEAST_ONE_SEP({
            SEP: C,
            DEF: () => {
              this.CONSUME(A)
            }
          })
          this.CONSUME(B)
        })
      }

      const input = [
        createRegularToken(A),
        createRegularToken(C),
        createRegularToken(A),
        createRegularToken(B)
      ]
      const parser = new CstMultiTerminalWithAtLeastOneSepParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("A", "B", "C")
      expect(cst.children.A).to.have.length(2)
      expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

      expect(cst.children.C).to.have.length(1)
      expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true
    })

    it("Can output a CST with node full location information", () => {
      class CstTerminalParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            nodeLocationTracking: "full",
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.SUBRULE(this.first)
          this.CONSUME(B)
          this.CONSUME(C)
          this.SUBRULE(this.empty)
          this.SUBRULE(this.second)
        })

        public first = this.RULE("first", () => {
          this.CONSUME(A)
        })

        public empty = this.RULE("empty", () => {})

        public second = this.RULE("second", () => {
          this.CONSUME(D)
        })
      }

      const input = [
        createRegularToken(A, "", 1, 1, 1, 2, 1, 2),
        createRegularToken(B, "", 12, 1, 3, 13, 1, 4),
        createRegularToken(C, "", 15, 2, 10, 16, 3, 15),
        createRegularToken(D, "", 17, 5, 2, 18, 5, 4)
      ]
      const parser = new CstTerminalParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("B", "C", "first", "empty", "second")
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
      expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true

      const first = cst.children.first[0] as CstNode
      expect(first.name).to.equal("first")
      expect(tokenStructuredMatcher(first.children.A[0], A)).to.be.true
      expect(first.location).to.deep.equal({
        startOffset: 1,
        startLine: 1,
        startColumn: 1,
        endOffset: 2,
        endLine: 1,
        endColumn: 2
      })

      const second = cst.children.second[0] as CstNode
      expect(second.name).to.equal("second")
      expect(second.location).to.deep.equal({
        startOffset: 17,
        startLine: 5,
        startColumn: 2,
        endOffset: 18,
        endLine: 5,
        endColumn: 4
      })

      expect((cst.children.empty[0] as CstNode).location).to.deep.equal({
        startOffset: NaN,
        startLine: NaN,
        startColumn: NaN,
        endOffset: NaN,
        endLine: NaN,
        endColumn: NaN
      })

      expect(cst.location).to.deep.equal({
        startOffset: 1,
        startLine: 1,
        startColumn: 1,
        endOffset: 18,
        endLine: 5,
        endColumn: 4
      })
    })

    it("Can output a CST with node onlyOffset location information", () => {
      class CstTerminalParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            nodeLocationTracking: "onlyOffset",
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.SUBRULE(this.first)
          this.CONSUME(B)
          this.CONSUME(C)
          this.SUBRULE(this.empty)
          this.SUBRULE(this.second)
        })

        public first = this.RULE("first", () => {
          this.CONSUME(A)
        })

        public empty = this.RULE("empty", () => {})

        public second = this.RULE("second", () => {
          this.CONSUME(D)
        })
      }

      const input = [
        createRegularToken(A, "1", 1, NaN, NaN, 2),
        createRegularToken(B, "2", 12, NaN, NaN, 13),
        createRegularToken(C, "3", 15, NaN, NaN, 16),
        createRegularToken(D, "4", 17, NaN, NaN, 18)
      ]
      const parser = new CstTerminalParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("B", "C", "first", "empty", "second")
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
      expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true

      const first = cst.children.first[0] as CstNode
      expect(first.name).to.equal("first")
      expect(tokenStructuredMatcher(first.children.A[0], A)).to.be.true
      expect(first.location).to.deep.equal({
        startOffset: 1,
        endOffset: 2
      })

      const second = cst.children.second[0] as CstNode
      expect(second.name).to.equal("second")
      expect(second.location).to.deep.equal({
        startOffset: 17,
        endOffset: 18
      })

      expect((cst.children.empty[0] as CstNode).location).to.deep.equal({
        startOffset: NaN,
        endOffset: NaN
      })

      expect(cst.location).to.deep.equal({
        startOffset: 1,
        endOffset: 18
      })
    })

    it("Can output a CST with no location information", () => {
      class CstTerminalParser extends CstParser {
        constructor(input: IToken[] = []) {
          super(ALL_TOKENS, {
            nodeLocationTracking: "none",
            recoveryEnabled: recoveryMode
          })
          this.performSelfAnalysis()
          this.input = input
        }

        public testRule = this.RULE("testRule", () => {
          this.SUBRULE(this.first)
          this.CONSUME(B)
          this.CONSUME(C)
          this.SUBRULE(this.second)
        })

        public first = this.RULE("first", () => {
          this.CONSUME(A)
        })

        public second = this.RULE("second", () => {
          this.CONSUME(D)
        })
      }

      const input = [
        createRegularToken(A, "", 1, 1, 1, 2, 1, 2),
        createRegularToken(B, "", 12, 1, 3, 13, 1, 4),
        createRegularToken(C, "", 15, 2, 10, 16, 3, 15),
        createRegularToken(D, "", 17, 5, 2, 18, 5, 4)
      ]
      const parser = new CstTerminalParser(input)
      const cst = parser.testRule()
      expect(cst.name).to.equal("testRule")
      expect(cst.children).to.have.keys("B", "C", "first", "second")
      expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
      expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true

      const first = cst.children.first[0] as CstNode
      expect(first.name).to.equal("first")
      expect(tokenStructuredMatcher(first.children.A[0], A)).to.be.true

      expect(first.location).to.be.undefined

      const second = cst.children.second[0] as CstNode
      expect(second.name).to.equal("second")
      expect(second.location).to.be.undefined

      expect(cst.location).to.be.undefined
    })

    context("Error Recovery", () => {
      it("re-sync recovery", () => {
        class CstRecoveryParserReSync extends CstParser {
          constructor(input: IToken[] = []) {
            super(ALL_TOKENS, {
              recoveryEnabled: true
            })
            this.performSelfAnalysis()
            this.input = input
          }

          public root = this.RULE("root", () => {
            this.MANY(() => {
              this.OR([
                {
                  ALT: () => {
                    this.SUBRULE(this.first)
                  }
                },
                {
                  ALT: () => {
                    this.SUBRULE(this.second)
                  }
                }
              ])
            })
          })

          public first = this.RULE("first", () => {
            this.CONSUME(A)
            this.CONSUME(B)
          })

          public second = this.RULE("second", () => {
            this.CONSUME(C)
            this.CONSUME(D)
          })

          public canTokenTypeBeInsertedInRecovery(tokType: TokenType): boolean {
            // we want to force re-sync recovery
            return false
          }
        }

        const input = createTokenVector([A, E, E, C, D])
        const parser = new CstRecoveryParserReSync(input)
        const cst = parser.root()
        expect(parser.errors).to.have.lengthOf(1)
        expect(parser.errors[0].message).to.include(
          "Expecting token of type --> B <--"
        )
        expect(parser.errors[0].resyncedTokens).to.have.lengthOf(1)
        expect(tokenStructuredMatcher(parser.errors[0].resyncedTokens[0], E)).to
          .be.true

        // expect(parser.errors[0]).
        expect(cst.name).to.equal("root")
        expect(cst.children).to.have.keys("first", "second")

        const firstCollection = cst.children.first
        expect(firstCollection).to.have.lengthOf(1)
        const first = firstCollection[0] as CstNode
        expect(first.recoveredNode).to.be.true
        expect(first.children).to.have.keys("A")
        expect(tokenStructuredMatcher(first.children.A[0], A)).to.be.true
        expect(first.children.B).to.be.undefined

        const secondCollection = cst.children.second
        expect(secondCollection).to.have.lengthOf(1)
        const second = secondCollection[0] as CstNode
        expect(second.recoveredNode).to.be.undefined
        expect(second.children).to.have.keys("C", "D")
        expect(tokenStructuredMatcher(second.children.C[0], C)).to.be.true
        expect(tokenStructuredMatcher(second.children.D[0], D)).to.be.true
      })

      it("re-sync recovery nested", () => {
        class CstRecoveryParserReSyncNested extends CstParser {
          constructor(input: IToken[] = []) {
            super(ALL_TOKENS, {
              recoveryEnabled: true
            })
            this.performSelfAnalysis()
            this.input = input
          }

          public root = this.RULE("root", () => {
            this.MANY(() => {
              this.OR([
                {
                  ALT: () => {
                    this.SUBRULE(this.first_root)
                  }
                },
                {
                  ALT: () => {
                    this.SUBRULE(this.second)
                  }
                }
              ])
            })
          })

          public first_root = this.RULE("first_root", () => {
            this.SUBRULE(this.first)
          })

          public first = this.RULE("first", () => {
            this.CONSUME(A)
            this.CONSUME(B)
          })

          public second = this.RULE("second", () => {
            this.CONSUME(C)
            this.CONSUME(D)
          })

          public canTokenTypeBeInsertedInRecovery(tokType: TokenType): boolean {
            // we want to force re-sync recovery
            return false
          }
        }

        const input = createTokenVector([A, E, E, C, D])
        const parser = new CstRecoveryParserReSyncNested(input)
        const cst = parser.root()
        expect(parser.errors).to.have.lengthOf(1)
        expect(parser.errors[0].message).to.include(
          "Expecting token of type --> B <--"
        )
        expect(parser.errors[0].resyncedTokens).to.have.lengthOf(1)
        expect(tokenStructuredMatcher(parser.errors[0].resyncedTokens[0], E)).to
          .be.true

        expect(cst.name).to.equal("root")
        expect(cst.children).to.have.keys("first_root", "second")

        const firstRootCollection = cst.children.first_root
        expect(firstRootCollection).to.have.lengthOf(1)
        const firstRoot = firstRootCollection[0] as CstNode
        expect(firstRoot.children).to.have.keys("first")

        const first = firstRoot.children.first[0] as CstNode
        expect(first.recoveredNode).to.be.true
        expect(first.children).to.have.keys("A")
        expect(tokenStructuredMatcher(first.children.A[0], A)).to.be.true
        expect(first.children.B).to.be.undefined

        const secondCollection = cst.children.second
        expect(secondCollection).to.have.lengthOf(1)
        const second = secondCollection[0] as CstNode
        expect(second.recoveredNode).to.be.undefined
        expect(second.children).to.have.keys("C", "D")
        expect(tokenStructuredMatcher(second.children.C[0], C)).to.be.true
        expect(tokenStructuredMatcher(second.children.D[0], D)).to.be.true
      })
    })
  })
}

defineTestSuite(true)
defineTestSuite(false)
