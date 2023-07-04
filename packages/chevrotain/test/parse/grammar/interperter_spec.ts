import { expect } from "chai"
import { map } from "@chevrotain/utils"
import { IToken, ITokenGrammarPath, TokenType } from "@chevrotain/types"
import {
  NextAfterTokenWalker,
  nextPossibleTokensAfter,
  NextTerminalAfterAtLeastOneSepWalker,
  NextTerminalAfterAtLeastOneWalker,
  NextTerminalAfterManySepWalker,
  NextTerminalAfterManyWalker,
  PartialPathAndSuffixes,
  possiblePathsFrom
} from "../../../src/parse/grammar/interpreter"
import { createRegularToken, setEquality } from "../../utils/matchers"
import { createToken } from "../../../src/scan/tokens_public"
import { Lexer } from "../../../src/scan/lexer_public"
import {
  augmentTokenTypes,
  tokenStructuredMatcher
} from "../../../src/scan/tokens"
import { EmbeddedActionsParser } from "../../../src/parse/parser/traits/parser_traits"
import {
  Alternation,
  Alternative,
  Repetition,
  RepetitionWithSeparator,
  Rule,
  Terminal,
  Option,
  RepetitionMandatory,
  NonTerminal,
  RepetitionMandatoryWithSeparator
} from "@chevrotain/gast"
import { createDeferredTokenBuilder } from "../../utils/builders"

// ugly utilities to deffer execution of productive code until the relevant tests have started
// it is done in this "ugly" manner as an "quick/easy" win as part of refactoring the whole tests to achieve this.
const getLSquareTok = createDeferredTokenBuilder({
  name: "LSquareTok",
  pattern: /NA/
})
const getRSquareTok = createDeferredTokenBuilder({
  name: "RSquareTok",
  pattern: /NA/
})
const getActionTok = createDeferredTokenBuilder({
  name: "ActionTok",
  pattern: /NA/
})
const getIdentTok = createDeferredTokenBuilder({
  name: "IdentTok",
  pattern: /NA/
})
const getDotTok = createDeferredTokenBuilder({ name: "DotTok", pattern: /NA/ })
const getColonTok = createDeferredTokenBuilder({
  name: "ColonTok",
  pattern: /NA/
})

let fqnCache: Rule
function buildQualifiedName(): Rule {
  if (fqnCache === undefined) {
    fqnCache = new Rule({
      name: "qualifiedName",
      definition: [
        new Terminal({ terminalType: getIdentTok() }),
        new Repetition({
          definition: [
            new Terminal({ terminalType: getDotTok() }),
            new Terminal({ terminalType: getIdentTok(), idx: 2 })
          ]
        })
      ]
    })
  }
  return fqnCache
}

let paramSpecCache: Rule
function getParamSpec(): Rule {
  if (paramSpecCache === undefined) {
    paramSpecCache = new Rule({
      name: "paramSpec",
      definition: [
        new Terminal({ terminalType: getIdentTok() }),
        new Terminal({ terminalType: getColonTok() }),
        new NonTerminal({
          nonTerminalName: "qualifiedName",
          referencedRule: buildQualifiedName()
        }),
        new Option({
          definition: [
            new Terminal({ terminalType: getLSquareTok() }),
            new Terminal({ terminalType: getRSquareTok() })
          ]
        })
      ]
    })
  }
  return paramSpecCache
}

describe("The Grammar Interpeter namespace", () => {
  let actionDec: Rule
  let SemicolonTok: TokenType
  let CommaTok: TokenType
  let LParenTok: TokenType
  let RParenTok: TokenType

  before(() => {
    LParenTok = createToken({ name: "LParenTok", pattern: /NA/ })
    RParenTok = createToken({ name: "RParenTok", pattern: /NA/ })
    SemicolonTok = createToken({ name: "SemicolonTok", pattern: /NA/ })
    CommaTok = createToken({ name: "CommaTok", pattern: /NA/ })

    actionDec = new Rule({
      name: "actionDec",
      definition: [
        new Terminal({ terminalType: getActionTok() }),
        new Terminal({ terminalType: getIdentTok() }),
        new Terminal({ terminalType: LParenTok }),
        new Option({
          definition: [
            new NonTerminal({
              nonTerminalName: "paramSpec",
              referencedRule: getParamSpec()
            }),
            new Repetition({
              definition: [
                new Terminal({ terminalType: CommaTok }),
                new NonTerminal({
                  nonTerminalName: "paramSpec",
                  referencedRule: getParamSpec(),
                  idx: 2
                })
              ]
            })
          ]
        }),
        new Terminal({ terminalType: RParenTok }),
        new Option({
          definition: [
            new Terminal({ terminalType: getColonTok() }),
            new NonTerminal({
              nonTerminalName: "qualifiedName",
              referencedRule: buildQualifiedName()
            })
          ],
          idx: 2
        }),
        new Terminal({ terminalType: SemicolonTok })
      ]
    })
  })

  describe("The NextAfterTokenWalker", () => {
    it("can compute the next possible token types From ActionDec in scope of ActionDec #1", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec"],
        occurrenceStack: [1],
        lastTok: getActionTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getIdentTok())
    })

    it("can compute the next possible token types From ActionDec in scope of ActionDec #2", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec"],
        occurrenceStack: [1],
        lastTok: getIdentTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(LParenTok)
    })

    it("can compute the next possible token types From ActionDec in scope of ActionDec #3", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec"],
        occurrenceStack: [1],
        lastTok: LParenTok,
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(2)
      setEquality(possibleNextTokTypes, [getIdentTok(), RParenTok])
    })

    it("can compute the next possible token types From ActionDec in scope of ActionDec #4", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec"],
        occurrenceStack: [1],
        lastTok: CommaTok,
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getIdentTok())
    })

    it("can compute the next possible token types From ActionDec in scope of ActionDec #5", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec"],
        occurrenceStack: [1],
        lastTok: RParenTok,
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(2)
      setEquality(possibleNextTokTypes, [SemicolonTok, getColonTok()])
    })

    it("can compute the next possible token types From ActionDec in scope of ActionDec #6", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec"],
        occurrenceStack: [1],
        lastTok: getColonTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getIdentTok())
    })

    it("can compute the next possible token types From ActionDec in scope of ActionDec #7", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec"],
        occurrenceStack: [1],
        lastTok: SemicolonTok,
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(0)
    })

    it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #1", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec", "paramSpec"],
        occurrenceStack: [1, 1],
        lastTok: getIdentTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getColonTok())
    })

    it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #2", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec", "paramSpec"],
        occurrenceStack: [1, 1],
        lastTok: getColonTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getIdentTok())
    })

    it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #3", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec", "paramSpec"],
        occurrenceStack: [1, 1],
        lastTok: getLSquareTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getRSquareTok())
    })

    it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #4", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec", "paramSpec"],
        occurrenceStack: [1, 1],
        lastTok: getRSquareTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(2)
      setEquality(possibleNextTokTypes, [CommaTok, RParenTok])
    })

    it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #1", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec", "paramSpec"],
        occurrenceStack: [1, 2],
        lastTok: getIdentTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getColonTok())
    })

    it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #2", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec", "paramSpec"],
        occurrenceStack: [1, 2],
        lastTok: getColonTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getIdentTok())
    })

    it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #3", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec", "paramSpec"],
        occurrenceStack: [1, 2],
        lastTok: getLSquareTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(1)
      expect(possibleNextTokTypes[0]).to.equal(getRSquareTok())
    })

    it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #4", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["actionDec", "paramSpec"],
        occurrenceStack: [1, 2],
        lastTok: getRSquareTok(),
        lastTokOccurrence: 1
      }

      const possibleNextTokTypes = new NextAfterTokenWalker(
        actionDec,
        caPath
      ).startWalking()
      expect(possibleNextTokTypes.length).to.equal(2)
      setEquality(possibleNextTokTypes, [CommaTok, RParenTok])
    })

    it(
      "can compute the next possible token types From a fqn inside an actionParamSpec" +
        " inside an paramSpec INSIDE ActionDec #1",
      () => {
        const caPath: ITokenGrammarPath = {
          ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
          occurrenceStack: [1, 1, 1],
          lastTok: getIdentTok(),
          lastTokOccurrence: 1
        }

        const possibleNextTokTypes = new NextAfterTokenWalker(
          actionDec,
          caPath
        ).startWalking()
        expect(possibleNextTokTypes.length).to.equal(4)
        setEquality(possibleNextTokTypes, [
          getDotTok(),
          getLSquareTok(),
          CommaTok,
          RParenTok
        ])
      }
    )

    it(
      "can compute the next possible token types From a fqn inside an actionParamSpec" +
        " inside an paramSpec INSIDE ActionDec #2",
      () => {
        const caPath: ITokenGrammarPath = {
          ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
          occurrenceStack: [1, 1, 1],
          lastTok: getDotTok(),
          lastTokOccurrence: 1
        }

        const possibleNextTokTypes = new NextAfterTokenWalker(
          actionDec,
          caPath
        ).startWalking()
        expect(possibleNextTokTypes.length).to.equal(1)
        expect(possibleNextTokTypes[0]).to.equal(getIdentTok())
      }
    )

    it(
      "can compute the next possible token types From a fqn inside an actionParamSpec" +
        " inside an paramSpec INSIDE ActionDec #3",
      () => {
        const caPath: ITokenGrammarPath = {
          ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
          occurrenceStack: [1, 1, 1],
          lastTok: getIdentTok(),
          lastTokOccurrence: 2
        }

        const possibleNextTokTypes = new NextAfterTokenWalker(
          actionDec,
          caPath
        ).startWalking()
        expect(possibleNextTokTypes.length).to.equal(4)
        setEquality(possibleNextTokTypes, [
          getDotTok(),
          getLSquareTok(),
          CommaTok,
          RParenTok
        ])
      }
    )

    it(
      "can compute the next possible token types From a fqn inside an actionParamSpec" +
        " inside an paramSpec INSIDE ActionDec #3",
      () => {
        const caPath: ITokenGrammarPath = {
          ruleStack: ["paramSpec", "qualifiedName"],
          occurrenceStack: [1, 1],
          lastTok: getIdentTok(),
          lastTokOccurrence: 1
        }

        const possibleNextTokTypes = new NextAfterTokenWalker(
          getParamSpec(),
          caPath
        ).startWalking()
        expect(possibleNextTokTypes.length).to.equal(2)
        setEquality(possibleNextTokTypes, [getDotTok(), getLSquareTok()])
      }
    )

    it(
      "can compute the next possible token types From a fqn inside an actionParamSpec" +
        " inside an paramSpec INSIDE ActionDec #3",
      () => {
        const caPath: ITokenGrammarPath = {
          ruleStack: ["paramSpec", "qualifiedName"],
          occurrenceStack: [1, 1],
          lastTok: getDotTok(),
          lastTokOccurrence: 1
        }

        const possibleNextTokTypes = new NextAfterTokenWalker(
          getParamSpec(),
          caPath
        ).startWalking()
        expect(possibleNextTokTypes.length).to.equal(1)
        expect(possibleNextTokTypes[0]).to.equal(getIdentTok())
      }
    )

    it(
      "can compute the next possible token types From a fqn inside an actionParamSpec" +
        " inside an paramSpec INSIDE ActionDec #3",
      () => {
        const caPath: ITokenGrammarPath = {
          ruleStack: ["paramSpec", "qualifiedName"],
          occurrenceStack: [1, 1],
          lastTok: getIdentTok(),
          lastTokOccurrence: 2
        }

        const possibleNextTokTypes = new NextAfterTokenWalker(
          getParamSpec(),
          caPath
        ).startWalking()
        expect(possibleNextTokTypes.length).to.equal(2)
        setEquality(possibleNextTokTypes, [getDotTok(), getLSquareTok()])
      }
    )

    it("will fail if we try to compute the next token starting from a rule that does not match the path", () => {
      const caPath: ITokenGrammarPath = {
        ruleStack: ["I_WILL_FAIL_THE_WALKER", "qualifiedName"],
        occurrenceStack: [1, 1],
        lastTok: getIdentTok(),
        lastTokOccurrence: 2
      }

      const walker = new NextAfterTokenWalker(getParamSpec(), caPath)
      expect(() => walker.startWalking()).to.throw(
        "The path does not start with the walker's top Rule!"
      )
    })
  })

  describe("The NextTerminalAfterManyWalker", () => {
    it("can compute the next possible token types after the MANY in QualifiedName", () => {
      const rule = new Rule({
        name: "TwoRepetitionRule",
        definition: [
          new Repetition({
            definition: [
              new Terminal({
                terminalType: getIdentTok(),
                idx: 1
              })
            ],
            idx: 2
          }),
          new Terminal({
            terminalType: getIdentTok(),
            idx: 2
          }),
          new Repetition({
            definition: [
              new Terminal({ terminalType: getDotTok() }),
              new Terminal({
                terminalType: getIdentTok(),
                idx: 3
              })
            ]
          })
        ]
      })

      const result = new NextTerminalAfterManyWalker(rule, 1).startWalking()
      //noinspection BadExpressionStatementJS
      expect(result.occurrence).to.be.undefined
      //noinspection BadExpressionStatementJS
      expect(result.token).to.be.undefined
    })

    it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", () => {
      const result = new NextTerminalAfterManyWalker(
        actionDec,
        1
      ).startWalking()
      expect(result.occurrence).to.equal(1)
      expect(result.token).to.equal(RParenTok)
    })
  })

  describe("The NextTerminalAfterManySepWalker", () => {
    it("can compute the next possible token types after the MANY_SEP in QualifiedName", () => {
      const callArguments = new Rule({
        name: "callArguments",
        definition: [
          new RepetitionWithSeparator({
            definition: [new Terminal({ terminalType: getIdentTok(), idx: 1 })],
            separator: CommaTok
          }),
          new RepetitionWithSeparator({
            definition: [new Terminal({ terminalType: getIdentTok(), idx: 2 })],
            separator: CommaTok,
            idx: 2
          })
        ]
      })
      const result = new NextTerminalAfterManySepWalker(
        callArguments,
        1
      ).startWalking()
      //noinspection BadExpressionStatementJS
      expect(result.occurrence).to.be.undefined
      //noinspection BadExpressionStatementJS
      expect(result.token).to.be.undefined
    })

    it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", () => {
      const ActionTok = createToken({ name: "ActionTok", pattern: /NA/ })
      const actionDecSep = new Rule({
        name: "actionDecSep",
        definition: [
          new Terminal({ terminalType: ActionTok }),
          new Terminal({ terminalType: getIdentTok() }),
          new Terminal({ terminalType: LParenTok }),

          new RepetitionWithSeparator({
            definition: [
              new NonTerminal({
                nonTerminalName: "paramSpec",
                referencedRule: getParamSpec(),
                idx: 2
              })
            ],
            separator: CommaTok
          }),

          new Terminal({ terminalType: RParenTok }),
          new Option({
            definition: [
              new Terminal({ terminalType: getColonTok() }),
              new NonTerminal({
                nonTerminalName: "qualifiedName",
                referencedRule: buildQualifiedName()
              })
            ],
            idx: 2
          }),
          new Terminal({ terminalType: SemicolonTok })
        ]
      })
      const result = new NextTerminalAfterManySepWalker(
        actionDecSep,
        1
      ).startWalking()
      expect(result.occurrence).to.equal(1)
      expect(result.token).to.equal(RParenTok)
    })
  })

  describe("The NextTerminalAfterAtLeastOneWalker", () => {
    it("can compute the next possible token types after an AT_LEAST_ONE production", () => {
      const EntityTok = createToken({ name: "EntityTok", pattern: /NA/ })
      const atLeastOneRule = new Rule({
        name: "atLeastOneRule",
        definition: [
          new RepetitionMandatory({
            definition: [
              new RepetitionMandatory({
                definition: [
                  new RepetitionMandatory({
                    definition: [new Terminal({ terminalType: EntityTok })],
                    idx: 3
                  }),
                  new Terminal({ terminalType: CommaTok })
                ],
                idx: 2
              }),
              new Terminal({ terminalType: getDotTok(), idx: 1 })
            ]
          }),
          new Terminal({ terminalType: getDotTok(), idx: 2 })
        ]
      })

      const result = new NextTerminalAfterAtLeastOneWalker(
        atLeastOneRule,
        1
      ).startWalking()
      expect(result.occurrence).to.equal(2)
      expect(result.token).to.equal(getDotTok())

      const result2 = new NextTerminalAfterAtLeastOneWalker(
        atLeastOneRule,
        2
      ).startWalking()
      expect(result2.occurrence).to.equal(1)
      expect(result2.token).to.equal(getDotTok())

      const result3 = new NextTerminalAfterAtLeastOneWalker(
        atLeastOneRule,
        3
      ).startWalking()
      expect(result3.occurrence).to.equal(1)
      expect(result3.token).to.equal(CommaTok)
    })

    it("can compute the next possible token types after an AT_LEAST_ONE production - EMPTY", () => {
      const atLeastOneRule = new Rule({
        name: "atLeastOneRule",
        definition: [
          new RepetitionMandatory({
            definition: [
              new Terminal({
                terminalType: getDotTok(),
                idx: 1
              })
            ]
          })
        ]
      })

      const result = new NextTerminalAfterAtLeastOneWalker(
        atLeastOneRule,
        1
      ).startWalking()
      expect(result.occurrence).to.be.undefined
      expect(result.token).to.be.undefined
    })
  })

  describe("The NextTerminalAfterAtLeastOneSepWalker", () => {
    it("can compute the next possible token types after an AT_LEAST_ONE_SEP production", () => {
      const EntityTok = createToken({ name: "EntityTok", pattern: /NA/ })
      const atLeastOneSepRule = new Rule({
        name: "atLeastOneSepRule",
        definition: [
          new RepetitionMandatoryWithSeparator({
            definition: [
              new RepetitionMandatoryWithSeparator({
                definition: [
                  new RepetitionMandatoryWithSeparator({
                    definition: [new Terminal({ terminalType: EntityTok })],
                    separator: SemicolonTok,
                    idx: 3
                  }),
                  new Terminal({ terminalType: CommaTok })
                ],
                separator: SemicolonTok,
                idx: 2
              }),
              new Terminal({ terminalType: getDotTok(), idx: 1 })
            ],
            separator: SemicolonTok
          }),
          new Terminal({ terminalType: getDotTok(), idx: 2 })
        ]
      })

      const result = new NextTerminalAfterAtLeastOneSepWalker(
        atLeastOneSepRule,
        1
      ).startWalking()
      expect(result.occurrence).to.equal(2)
      expect(result.token).to.equal(getDotTok())

      const result2 = new NextTerminalAfterAtLeastOneSepWalker(
        atLeastOneSepRule,
        2
      ).startWalking()
      expect(result2.occurrence).to.equal(1)
      expect(result2.token).to.equal(getDotTok())

      const result3 = new NextTerminalAfterAtLeastOneSepWalker(
        atLeastOneSepRule,
        3
      ).startWalking()
      expect(result3.occurrence).to.equal(1)
      expect(result3.token).to.equal(CommaTok)
    })

    it("can compute the next possible token types after an AT_LEAST_ONE_SEP production EMPTY", () => {
      const qualifiedNameSep = new Rule({
        name: "qualifiedNameSep",
        definition: [
          new RepetitionMandatoryWithSeparator({
            definition: [new Terminal({ terminalType: getIdentTok(), idx: 1 })],
            separator: getDotTok()
          })
        ]
      })
      const result = new NextTerminalAfterAtLeastOneSepWalker(
        qualifiedNameSep,
        1
      ).startWalking()
      //noinspection BadExpressionStatementJS
      expect(result.occurrence).to.be.undefined
      //noinspection BadExpressionStatementJS
      expect(result.token).to.be.undefined
    })
  })

  describe("The chevrotain grammar interpreter capabilities", () => {
    function extractPartialPaths(newResultFormat: PartialPathAndSuffixes[]) {
      return map(newResultFormat, (currItem) => currItem.partialPath)
    }

    class Alpha {
      static PATTERN = /NA/
    }

    class Beta {
      static PATTERN = /NA/
    }

    class Gamma {
      static PATTERN = /NA/
    }

    class Comma {
      static PATTERN = /NA/
    }

    before(() => {
      augmentTokenTypes([Alpha, Beta, Gamma, Comma])
    })

    context("can calculate the next possible paths in a", () => {
      it("Sequence", () => {
        const seq = [
          new Terminal({ terminalType: Alpha }),
          new Terminal({ terminalType: Beta }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(extractPartialPaths(possiblePathsFrom(seq, 1))).to.deep.equal([
          [Alpha]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 2))).to.deep.equal([
          [Alpha, Beta]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 3))).to.deep.equal([
          [Alpha, Beta, Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 4))).to.deep.equal([
          [Alpha, Beta, Gamma]
        ])
      })

      it("Optional", () => {
        const seq = [
          new Terminal({ terminalType: Alpha }),
          new Option({
            definition: [new Terminal({ terminalType: Beta })]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(extractPartialPaths(possiblePathsFrom(seq, 1))).to.deep.equal([
          [Alpha]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 2))).to.deep.equal([
          [Alpha, Beta],
          [Alpha, Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 3))).to.deep.equal([
          [Alpha, Beta, Gamma],
          [Alpha, Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 4))).to.deep.equal([
          [Alpha, Beta, Gamma],
          [Alpha, Gamma]
        ])
      })

      it("Alternation", () => {
        const alts = [
          new Alternation({
            definition: [
              new Alternative({
                definition: [new Terminal({ terminalType: Alpha })]
              }),
              new Alternative({
                definition: [
                  new Terminal({ terminalType: Beta }),
                  new Terminal({ terminalType: Beta })
                ]
              }),
              new Alternative({
                definition: [
                  new Terminal({ terminalType: Beta }),
                  new Terminal({ terminalType: Alpha }),
                  new Terminal({ terminalType: Gamma })
                ]
              })
            ]
          })
        ]

        expect(extractPartialPaths(possiblePathsFrom(alts, 1))).to.deep.equal([
          [Alpha],
          [Beta],
          [Beta]
        ])
        expect(extractPartialPaths(possiblePathsFrom(alts, 2))).to.deep.equal([
          [Alpha],
          [Beta, Beta],
          [Beta, Alpha]
        ])
        expect(extractPartialPaths(possiblePathsFrom(alts, 3))).to.deep.equal([
          [Alpha],
          [Beta, Beta],
          [Beta, Alpha, Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(alts, 4))).to.deep.equal([
          [Alpha],
          [Beta, Beta],
          [Beta, Alpha, Gamma]
        ])
      })

      it("Repetition", () => {
        const rep = [
          new Repetition({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Alpha })
            ]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(extractPartialPaths(possiblePathsFrom(rep, 1))).to.deep.equal([
          [Alpha],
          [Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(rep, 2))).to.deep.equal([
          [Alpha, Alpha],
          [Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(rep, 3))).to.deep.equal([
          [Alpha, Alpha, Alpha],
          [Alpha, Alpha, Gamma],
          [Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(rep, 4))).to.deep.equal([
          [Alpha, Alpha, Alpha, Alpha],
          [Alpha, Alpha, Gamma],
          [Gamma]
        ])
      })

      it("Mandatory Repetition", () => {
        const repMand = [
          new RepetitionMandatory({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Alpha })
            ]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(
          extractPartialPaths(possiblePathsFrom(repMand, 1))
        ).to.deep.equal([[Alpha]])
        expect(
          extractPartialPaths(possiblePathsFrom(repMand, 2))
        ).to.deep.equal([[Alpha, Alpha]])
        expect(
          extractPartialPaths(possiblePathsFrom(repMand, 3))
        ).to.deep.equal([
          [Alpha, Alpha, Alpha],
          [Alpha, Alpha, Gamma]
        ])
        expect(
          extractPartialPaths(possiblePathsFrom(repMand, 4))
        ).to.deep.equal([
          [Alpha, Alpha, Alpha, Alpha],
          [Alpha, Alpha, Gamma]
        ])
      })

      it("Repetition with Separator", () => {
        // same as Mandatory Repetition because currently possiblePaths only cares about
        // the first repetition.
        const rep = [
          new RepetitionWithSeparator({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Alpha })
            ],
            separator: Comma
          }),
          new Terminal({ terminalType: Gamma })
        ]
        expect(extractPartialPaths(possiblePathsFrom(rep, 1))).to.deep.equal([
          [Alpha],
          [Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(rep, 2))).to.deep.equal([
          [Alpha, Alpha],
          [Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(rep, 3))).to.deep.equal([
          [Alpha, Alpha, Comma],
          [Alpha, Alpha, Gamma],
          [Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(rep, 4))).to.deep.equal([
          [Alpha, Alpha, Comma, Alpha],
          [Alpha, Alpha, Gamma],
          [Gamma]
        ])
      })

      it("Mandatory Repetition with Separator", () => {
        // same as Mandatory Repetition because currently possiblePaths only cares about
        // the first repetition.
        const repMandSep = [
          new RepetitionMandatoryWithSeparator({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Alpha })
            ],
            separator: Comma
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(
          extractPartialPaths(possiblePathsFrom(repMandSep, 1))
        ).to.deep.equal([[Alpha]])
        expect(
          extractPartialPaths(possiblePathsFrom(repMandSep, 2))
        ).to.deep.equal([[Alpha, Alpha]])
        expect(
          extractPartialPaths(possiblePathsFrom(repMandSep, 3))
        ).to.deep.equal([
          [Alpha, Alpha, Comma],
          [Alpha, Alpha, Gamma]
        ])
        expect(
          extractPartialPaths(possiblePathsFrom(repMandSep, 4))
        ).to.deep.equal([
          [Alpha, Alpha, Comma, Alpha],
          [Alpha, Alpha, Gamma]
        ])
      })

      it("NonTerminal", () => {
        const someSubRule = new Rule({
          name: "blah",
          definition: [new Terminal({ terminalType: Beta })]
        })

        const seq = [
          new Terminal({ terminalType: Alpha }),
          new NonTerminal({
            nonTerminalName: "blah",
            referencedRule: someSubRule
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(extractPartialPaths(possiblePathsFrom(seq, 1))).to.deep.equal([
          [Alpha]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 2))).to.deep.equal([
          [Alpha, Beta]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 3))).to.deep.equal([
          [Alpha, Beta, Gamma]
        ])
        expect(extractPartialPaths(possiblePathsFrom(seq, 4))).to.deep.equal([
          [Alpha, Beta, Gamma]
        ])
      })
    })

    context("can calculate the next possible single tokens for: ", () => {
      function INPUT(tokTypes: TokenType[]): IToken[] {
        return map(tokTypes, (currTokType) => createRegularToken(currTokType))
      }

      function pluckTokenTypes(arr: any[]): TokenType[] {
        return map(arr, (currItem) => currItem.nextTokenType)
      }

      it("Sequence positive", () => {
        const seq = [
          new Alternative({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta }),
              new Terminal({ terminalType: Gamma })
            ]
          })
        ]

        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(seq, INPUT([]), tokenStructuredMatcher, 5)
          ),
          [Alpha]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              seq,
              INPUT([Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              seq,
              INPUT([Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Gamma]
        )
      })

      it("Sequence negative", () => {
        const seq = [
          new Alternative({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta }),
              new Terminal({ terminalType: Gamma })
            ]
          })
        ]

        // negative
        expect(
          nextPossibleTokensAfter(
            seq,
            INPUT([Alpha, Beta, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            seq,
            INPUT([Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(seq, INPUT([Beta]), tokenStructuredMatcher, 5)
        ).to.be.empty
      })

      it("Optional positive", () => {
        const seq = [
          new Terminal({ terminalType: Alpha }),
          new Option({
            definition: [new Terminal({ terminalType: Beta })]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        // setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([]), tokenStructuredMatcher, 5)), [Alpha])
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              seq,
              INPUT([Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta, Gamma]
        )
        // setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Gamma])
      })

      it("Optional Negative", () => {
        const seq = [
          new Terminal({ terminalType: Alpha }),
          new Option({
            definition: [new Terminal({ terminalType: Beta })]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(
          nextPossibleTokensAfter(seq, INPUT([Beta]), tokenStructuredMatcher, 5)
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            seq,
            INPUT([Alpha, Alpha]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            seq,
            INPUT([Alpha, Beta, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
      })

      it("Alternation positive", () => {
        const alts = [
          new Alternation({
            definition: [
              new Alternative({
                definition: [new Terminal({ terminalType: Alpha })]
              }),
              new Alternative({
                definition: [
                  new Terminal({ terminalType: Beta }),
                  new Terminal({ terminalType: Beta })
                ]
              }),
              new Alternative({
                definition: [
                  new Terminal({ terminalType: Beta }),
                  new Terminal({ terminalType: Alpha }),
                  new Terminal({ terminalType: Gamma })
                ]
              }),
              new Alternative({
                definition: [new Terminal({ terminalType: Gamma })]
              })
            ]
          })
        ]

        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(alts, INPUT([]), tokenStructuredMatcher, 5)
          ),
          [Alpha, Beta, Beta, Gamma]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              alts,
              INPUT([Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta, Alpha]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              alts,
              INPUT([Beta, Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Gamma]
        )
      })

      it("Alternation Negative", () => {
        const alts = [
          new Alternation({
            definition: [
              new Alternative({
                definition: [new Terminal({ terminalType: Alpha })]
              }),
              new Alternative({
                definition: [
                  new Terminal({ terminalType: Beta }),
                  new Terminal({ terminalType: Beta })
                ]
              }),
              new Alternative({
                definition: [
                  new Terminal({ terminalType: Beta }),
                  new Terminal({ terminalType: Alpha }),
                  new Terminal({ terminalType: Gamma })
                ]
              })
            ]
          })
        ]

        expect(
          nextPossibleTokensAfter(
            alts,
            INPUT([Alpha]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            alts,
            INPUT([Gamma, Alpha]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            alts,
            INPUT([Beta, Beta]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            alts,
            INPUT([Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
      })

      it("Repetition - positive", () => {
        const rep = [
          new Repetition({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta })
            ]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(rep, INPUT([]), tokenStructuredMatcher, 5)
          ),
          [Alpha, Gamma]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              rep,
              INPUT([Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              rep,
              INPUT([Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha, Gamma]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              rep,
              INPUT([Alpha, Beta, Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              rep,
              INPUT([Alpha, Beta, Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha, Gamma]
        )
      })

      it("Repetition - negative", () => {
        const rep = [
          new Repetition({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta })
            ]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(
          nextPossibleTokensAfter(rep, INPUT([Beta]), tokenStructuredMatcher, 5)
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            rep,
            INPUT([Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            rep,
            INPUT([Alpha, Beta, Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            rep,
            INPUT([Alpha, Beta, Alpha, Beta, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
      })

      it("Mandatory Repetition - positive", () => {
        const repMand = [
          new RepetitionMandatory({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta })
            ]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repMand,
              INPUT([]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repMand,
              INPUT([Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repMand,
              INPUT([Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha, Gamma]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repMand,
              INPUT([Alpha, Beta, Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repMand,
              INPUT([Alpha, Beta, Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha, Gamma]
        )
      })

      it("Mandatory Repetition - negative", () => {
        const repMand = [
          new RepetitionMandatory({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta })
            ]
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Beta]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Beta, Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Beta, Alpha, Beta, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
      })

      it("Repetition with Separator - positive", () => {
        const repSep = [
          new RepetitionWithSeparator({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta })
            ],
            separator: Comma
          }),
          new Terminal({ terminalType: Gamma })
        ]

        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha, Gamma]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Comma, Gamma]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([Alpha, Beta, Comma]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([Alpha, Beta, Comma, Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Comma, Gamma]
        )
      })

      it("Repetition with Separator - negative", () => {
        const repMand = [
          new RepetitionWithSeparator({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta })
            ],
            separator: Comma
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Comma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Beta, Comma, Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Beta, Comma, Alpha, Beta, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
      })

      it("Repetition with Separator Mandatory - positive", () => {
        const repSep = [
          new RepetitionMandatoryWithSeparator({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta })
            ],
            separator: Comma
          }),
          new Terminal({ terminalType: Gamma })
        ]

        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Comma, Gamma]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([Alpha, Beta, Comma]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Alpha]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              repSep,
              INPUT([Alpha, Beta, Comma, Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Comma, Gamma]
        )
      })

      it("Repetition with Separator Mandatory - negative", () => {
        const repMand = [
          new RepetitionMandatoryWithSeparator({
            definition: [
              new Terminal({ terminalType: Alpha }),
              new Terminal({ terminalType: Beta })
            ],
            separator: Comma
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Comma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Beta, Comma, Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            repMand,
            INPUT([Alpha, Beta, Comma, Alpha, Beta, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
      })

      it("NonTerminal - positive", () => {
        const someSubRule = new Rule({
          name: "blah",
          definition: [new Terminal({ terminalType: Beta })]
        })

        const seq = [
          new Terminal({ terminalType: Alpha }),
          new NonTerminal({
            nonTerminalName: "blah",
            referencedRule: someSubRule
          }),
          new Terminal({ terminalType: Gamma })
        ]

        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(seq, INPUT([]), tokenStructuredMatcher, 5)
          ),
          [Alpha]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              seq,
              INPUT([Alpha]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Beta]
        )
        setEquality(
          pluckTokenTypes(
            nextPossibleTokensAfter(
              seq,
              INPUT([Alpha, Beta]),
              tokenStructuredMatcher,
              5
            )
          ),
          [Gamma]
        )
      })

      it("NonTerminal - negative", () => {
        const someSubRule = new Rule({
          name: "blah",
          definition: [new Terminal({ terminalType: Beta })]
        })

        const seq = [
          new Terminal({ terminalType: Alpha }),
          new NonTerminal({
            nonTerminalName: "blah",
            referencedRule: someSubRule
          }),
          new Terminal({ terminalType: Gamma })
        ]

        expect(
          nextPossibleTokensAfter(seq, INPUT([Beta]), tokenStructuredMatcher, 5)
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            seq,
            INPUT([Alpha, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
        expect(
          nextPossibleTokensAfter(
            seq,
            INPUT([Alpha, Beta, Gamma]),
            tokenStructuredMatcher,
            5
          )
        ).to.be.empty
      })
    })
  })

  describe("issue 391 - WITH_SEP variants do not take SEP into account in lookahead", () => {
    it("Reproduce issue", () => {
      const LParen = createToken({
        name: "LParen",
        pattern: /\(/
      })
      const RParen = createToken({
        name: "RParen",
        pattern: /\)/
      })
      const Comma = createToken({ name: "Comma", pattern: /,/ })
      const FatArrow = createToken({
        name: "FatArrow",
        pattern: /=>/
      })
      const Identifier = createToken({
        name: "Identifier",
        pattern: /[a-zA-Z]+/
      })
      const WhiteSpace = createToken({
        name: "WhiteSpace",
        pattern: /\s+/,
        group: Lexer.SKIPPED,
        line_breaks: true
      })

      const allTokens = [
        WhiteSpace,
        LParen,
        RParen,
        Comma,
        FatArrow,
        Identifier
      ]
      const issue391Lexer = new Lexer(allTokens)

      class Issue391Parser extends EmbeddedActionsParser {
        constructor(input: IToken[] = []) {
          super(allTokens, {
            maxLookahead: 4
          })
          this.performSelfAnalysis()
          this.input = input
        }

        topRule = this.RULE("topRule", () => {
          return this.OR9([
            {
              // Lambda Function
              ALT: () => {
                this.CONSUME1(LParen)
                this.MANY_SEP({
                  SEP: Comma,
                  DEF: () => {
                    this.CONSUME1(Identifier)
                  }
                })
                this.CONSUME1(RParen)
                this.CONSUME1(FatArrow)
              }
            },
            {
              // Parenthesis Expression
              ALT: () => {
                this.CONSUME2(LParen)
                this.CONSUME2(Identifier)
                this.CONSUME2(RParen)
              }
            }
          ])
        })
      }

      expect(() => new Issue391Parser([])).to.not.throw(
        "Ambiguous alternatives: <1 ,2>"
      )
      const myParser = new Issue391Parser([])

      function testInput(input: string) {
        const tokens = issue391Lexer.tokenize(input).tokens
        myParser.input = tokens
        myParser.topRule()
        expect(myParser.errors).to.be.empty
      }

      testInput("(x, y) => ")
      testInput("() =>")
      testInput("(x) =>")
      testInput("(x)")
    })
  })
})
