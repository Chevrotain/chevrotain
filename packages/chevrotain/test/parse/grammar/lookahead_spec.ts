import { END_OF_FILE } from "../../../src/parse/parser/parser"
import { createToken, EOF } from "../../../src/scan/tokens_public"
import {
  getProdType,
  lookAheadSequenceFromAlternatives,
  buildLookaheadFuncForOptionalProd,
  PROD_TYPE,
  PredicateSet,
  buildLookaheadFuncForOr
} from "../../../src/parse/grammar/lookahead"
import map from "lodash/map"
import {
  augmentTokenTypes,
  tokenStructuredMatcher
} from "../../../src/scan/tokens"
import { createRegularToken } from "../../utils/matchers"
import {
  Alternation,
  Alternative,
  NonTerminal,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule,
  Terminal
} from "@chevrotain/gast"
import { IProduction, IToken, TokenType } from "@chevrotain/types"
import {
  EmbeddedActionsParser,
  MixedInParser
} from "../../../src/parse/parser/traits/parser_traits"
import { expect } from "chai"

describe("getProdType", () => {
  it("handles `Option`", () => {
    expect(getProdType(new Option({ definition: [] }))).to.equal(
      PROD_TYPE.OPTION
    )
  })
  it("handles `Repetition`", () => {
    expect(getProdType(new Repetition({ definition: [] }))).to.equal(
      PROD_TYPE.REPETITION
    )
  })
  it("handles `RepetitionMandatory`", () => {
    expect(getProdType(new RepetitionMandatory({ definition: [] }))).to.equal(
      PROD_TYPE.REPETITION_MANDATORY
    )
  })
  it("handles `RepetitionWithSeparator`", () => {
    expect(
      getProdType(
        new RepetitionWithSeparator({
          definition: [],
          separator: createToken({ name: "Comma" })
        })
      )
    ).to.equal(PROD_TYPE.REPETITION_WITH_SEPARATOR)
  })
  it("handles `RepetitionMandatoryWithSeparator`", () => {
    expect(
      getProdType(
        new RepetitionMandatoryWithSeparator({
          definition: [],
          separator: createToken({ name: "Comma" })
        })
      )
    ).to.equal(PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR)
  })
  it("handles `Alternation`", () => {
    expect(getProdType(new Alternation({ definition: [] }))).to.equal(
      PROD_TYPE.ALTERNATION
    )
  })
})

describe("PredicateSet", () => {
  it("Should set and get predicates correctly", () => {
    const preds = new PredicateSet()
    preds.set(0, true)
    preds.set(1, false)
    preds.set(2, true)
    expect(preds.is(0)).to.be.true
    expect(preds.is(1)).to.be.false
    expect(preds.is(2)).to.be.true
  })
  it("Indices out of range should return true", () => {
    const preds = new PredicateSet()
    preds.set(0, false)
    expect(preds.is(0)).to.be.false
    expect(preds.is(1)).to.be.true
    expect(preds.is(2)).to.be.true
  })
  it("toString() creates identifier of set", () => {
    const emptySet = new PredicateSet()
    expect(emptySet.toString()).to.be.equal("")
    const preds1 = new PredicateSet()
    preds1.set(0, true)
    preds1.set(1, false)
    preds1.set(2, true)
    expect(preds1.toString()).to.be.equal("101")
  })
})

context("lookahead specs", () => {
  let MockParserVar: new (
    tokens: TokenType[],
    rules: Rule[],
    tokenTypes?: TokenType[]
  ) => MixedInParser
  let actionDec: Rule
  let lotsOfOrs: Rule
  let emptyAltOr: Rule

  let IdentTok: TokenType
  let DotTok: TokenType
  let ColonTok: TokenType
  let LSquareTok: TokenType
  let RSquareTok: TokenType
  let ActionTok: TokenType
  let LParenTok: TokenType
  let RParenTok: TokenType
  let CommaTok: TokenType
  let SemicolonTok: TokenType
  let EntityTok: TokenType
  let KeyTok: TokenType

  before(() => {
    IdentTok = createToken({ name: "IdentTok" })
    DotTok = createToken({ name: "DotTok" })
    ColonTok = createToken({ name: "ColonTok" })
    LSquareTok = createToken({ name: "LSquareTok" })
    RSquareTok = createToken({ name: "RSquareTok" })
    ActionTok = createToken({ name: "ActionTok" })
    LParenTok = createToken({ name: "LParenTok" })
    RParenTok = createToken({ name: "RParenTok" })
    CommaTok = createToken({ name: "CommaTok" })
    SemicolonTok = createToken({ name: "SemicolonTok" })
    EntityTok = createToken({ name: "EntityTok" })
    KeyTok = createToken({ name: "KeyTok" })

    class MockParser extends EmbeddedActionsParser {
      constructor(
        private tokens: TokenType[],
        rules: Rule[],
        tokenTypes?: TokenType[]
      ) {
        super(tokenTypes ?? tokens)
        const mixedIn = this as unknown as MixedInParser
        mixedIn.preComputeLookaheadFunctions(rules)
      }

      LA(offset: number) {
        if (offset > this.tokens.length) {
          return createRegularToken(EOF)
        } else {
          return createRegularToken(this.tokens[offset - 1])
        }
      }
    }

    MockParserVar = MockParser as any

    const qualifiedName = new Rule({
      name: "qualifiedName",
      definition: [
        new Terminal({ terminalType: IdentTok }),
        new Repetition({
          definition: [
            new Terminal({ terminalType: DotTok }),
            new Terminal({ terminalType: IdentTok, idx: 2 })
          ]
        })
      ]
    })
    const paramSpec = new Rule({
      name: "paramSpec",
      definition: [
        new Terminal({ terminalType: IdentTok }),
        new Terminal({ terminalType: ColonTok }),
        new NonTerminal({
          nonTerminalName: "qualifiedName",
          referencedRule: qualifiedName
        }),
        new Option({
          definition: [
            new Terminal({ terminalType: LSquareTok }),
            new Terminal({ terminalType: RSquareTok })
          ]
        })
      ]
    })
    actionDec = new Rule({
      name: "actionDec",
      definition: [
        new Terminal({ terminalType: ActionTok }),
        new Terminal({ terminalType: IdentTok }),
        new Terminal({ terminalType: LParenTok }),
        new Option({
          definition: [
            new NonTerminal({
              nonTerminalName: "paramSpec",
              referencedRule: paramSpec
            }),
            new Repetition({
              definition: [
                new Terminal({ terminalType: CommaTok }),
                new NonTerminal({
                  nonTerminalName: "paramSpec",
                  referencedRule: paramSpec,
                  idx: 2
                })
              ]
            })
          ]
        }),
        new Terminal({ terminalType: RParenTok }),
        new Option({
          definition: [
            new Terminal({ terminalType: ColonTok }),
            new NonTerminal({
              nonTerminalName: "qualifiedName",
              referencedRule: qualifiedName
            })
          ],
          idx: 2
        }),
        new Terminal({ terminalType: SemicolonTok })
      ]
    })

    lotsOfOrs = new Rule({
      name: "lotsOfOrs",
      definition: [
        new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Alternation({
                  definition: [
                    new Alternative({
                      definition: [
                        new Terminal({
                          terminalType: CommaTok,
                          idx: 1
                        })
                      ]
                    }),
                    new Alternative({
                      definition: [
                        new Terminal({
                          terminalType: KeyTok,
                          idx: 1
                        })
                      ]
                    })
                  ],
                  idx: 2
                })
              ]
            }),
            new Alternative({
              definition: [
                new Terminal({
                  terminalType: EntityTok,
                  idx: 1
                })
              ]
            })
          ]
        }),
        new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({
                  terminalType: DotTok,
                  idx: 1
                })
              ]
            })
          ],
          idx: 3
        })
      ]
    })

    emptyAltOr = new Rule({
      name: "emptyAltOr",
      definition: [
        new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({
                  terminalType: KeyTok,
                  idx: 1
                })
              ]
            }),
            new Alternative({
              definition: [
                new Terminal({
                  terminalType: EntityTok,
                  idx: 1
                })
              ]
            }),
            new Alternative({ definition: [] }) // an empty alternative
          ]
        })
      ]
    })
  })

  describe("The Grammar Lookahead namespace", () => {
    it("can compute the lookahead function for the first OPTION in ActionDec", () => {
      const colonMock = new MockParserVar([ColonTok], [actionDec])
      const indentMock = new MockParserVar([IdentTok], [actionDec])
      const laFunc = buildLookaheadFuncForOptionalProd(
        actionDec,
        1,
        PROD_TYPE.OPTION,
        0,
        false
      )

      expect(laFunc.call(colonMock)).to.equal(false)
      expect(laFunc.call(indentMock)).to.equal(true)
    })

    it("can compute the lookahead function for the second OPTION in ActionDec", () => {
      const colonMock = new MockParserVar([ColonTok], [actionDec])
      const indentMock = new MockParserVar([IdentTok], [actionDec])
      const laFunc = buildLookaheadFuncForOptionalProd(
        actionDec,
        2,
        PROD_TYPE.OPTION,
        3,
        false
      )

      expect(laFunc.call(colonMock)).to.equal(true)
      expect(laFunc.call(indentMock)).to.equal(false)
    })

    it("can compute the lookahead function for OPTION with categories", () => {
      const B = createToken({ name: "B" })
      const C = createToken({ name: "C", categories: [B] })

      const optionRule = new Rule({
        name: "optionRule",
        definition: [
          new Option({
            definition: [
              new Terminal({
                terminalType: B,
                idx: 1
              })
            ]
          })
        ]
      })

      const mockParser = new MockParserVar([C], [optionRule])

      const laFunc = buildLookaheadFuncForOptionalProd(
        optionRule,
        1,
        PROD_TYPE.OPTION,
        0,
        false
      )

      // C can match B (2nd alternative) due to its categories definition
      expect(laFunc.call(mockParser)).to.be.true
    })

    it("can compute the lookahead function for the first MANY in ActionDec", () => {
      const identParserMock = new MockParserVar([IdentTok], [actionDec])
      const commaParserMock = new MockParserVar([CommaTok], [actionDec])

      const laFunc = buildLookaheadFuncForOptionalProd(
        actionDec,
        1,
        PROD_TYPE.REPETITION,
        2,
        false
      )

      expect(laFunc.call(commaParserMock)).to.equal(true)
      expect(laFunc.call(identParserMock)).to.equal(false)
    })

    it("can compute the lookahead function for lots of ORs sample", () => {
      const keyParserMock = new MockParserVar([KeyTok], [lotsOfOrs])
      const entityParserMock = new MockParserVar([EntityTok], [lotsOfOrs])
      const colonParserMock = new MockParserVar([ColonTok], [lotsOfOrs])
      const commaParserMock = new MockParserVar([CommaTok], [lotsOfOrs])

      const laFunc = buildLookaheadFuncForOr(lotsOfOrs, 1, 0, false, false)

      expect(laFunc.call(commaParserMock)).to.equal(0)
      expect(laFunc.call(keyParserMock)).to.equal(0)
      expect(laFunc.call(entityParserMock)).to.equal(1)
      expect(laFunc.call(colonParserMock)).to.equal(undefined)
    })

    it("can compute the lookahead function for OR using categories", () => {
      const A = createToken({ name: "A" })
      const B = createToken({ name: "B" })
      const C = createToken({ name: "C", categories: [B] })

      const orRule = new Rule({
        name: "orRule",
        definition: [
          new Alternation({
            definition: [
              new Alternative({
                definition: [
                  new Terminal({
                    terminalType: A,
                    idx: 1
                  })
                ]
              }),
              new Alternative({
                definition: [
                  new Terminal({
                    terminalType: B,
                    idx: 1
                  })
                ]
              })
            ]
          })
        ]
      })

      const mockParser = new MockParserVar([C], [orRule])

      const laFunc = buildLookaheadFuncForOr(orRule, 1, 0, false, false)

      // C can match B (2nd alternative) due to its categories definition
      expect(laFunc.call(mockParser)).to.equal(1)
    })

    it("can compute the lookahead function for EMPTY OR sample", () => {
      const keyParserMock = new MockParserVar([KeyTok], [emptyAltOr])
      const entityParserMock = new MockParserVar([EntityTok], [emptyAltOr])
      const commaParserMock = new MockParserVar([CommaTok], [emptyAltOr])
      const laFunc = buildLookaheadFuncForOr(emptyAltOr, 1, 0, false, false)
      expect(laFunc.call(keyParserMock)).to.equal(0)
      expect(laFunc.call(entityParserMock)).to.equal(1)
      // none matches so the last empty alternative should be taken (idx 2)
      expect(laFunc.call(commaParserMock)).to.equal(2)
    })
  })

  describe("The chevrotain grammar lookahead capabilities", () => {
    let Alpha: TokenType
    let ExtendsAlpha: TokenType
    let ExtendsAlphaAlpha: TokenType
    let Beta: TokenType
    let Charlie: TokenType
    let Delta: TokenType
    let Gamma: TokenType

    before(() => {
      Alpha = createToken({ name: "Alpha" })
      ExtendsAlpha = createToken({
        name: "ExtendsAlpha",
        categories: Alpha
      })
      ExtendsAlphaAlpha = createToken({
        name: "ExtendsAlphaAlpha",
        categories: ExtendsAlpha
      })
      Beta = createToken({ name: "Beta" })
      Charlie = createToken({ name: "Charlie" })
      Delta = createToken({ name: "Delta" })
      Gamma = createToken({ name: "Gamma" })
      augmentTokenTypes([Alpha, Beta, Delta, Gamma, Charlie, ExtendsAlphaAlpha])
    })

    context("computing lookahead sequences for", () => {
      it("two simple one token alternatives", () => {
        const alt1 = new Alternation({
          definition: [
            new Alternative({
              definition: [new Terminal({ terminalType: Alpha })]
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })]
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })]
            })
          ]
        })
        const alt2 = new Terminal({ terminalType: Gamma })

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
        expect(actual).to.deep.equal([[[Alpha], [Beta]], [[Gamma]]])
      })

      it("three simple one token alternatives", () => {
        const alt1 = new Alternation({
          definition: [
            new Alternative({
              definition: [new Terminal({ terminalType: Alpha })]
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })]
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })]
            })
          ]
        })
        const alt2 = new Terminal({ terminalType: Gamma })
        const alt3 = new Alternative({
          definition: [
            new Terminal({ terminalType: Delta }),
            new Terminal({ terminalType: Charlie })
          ]
        })

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2, alt3], 5)
        expect(actual).to.deep.equal([[[Alpha], [Beta]], [[Gamma]], [[Delta]]])
      })

      it("two complex multi token alternatives", () => {
        const alt1 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Beta })
              ]
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })]
            }),
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Gamma }),
                new Terminal({ terminalType: Delta })
              ]
            })
          ]
        })
        const alt2 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Delta })
              ]
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Charlie })]
            })
          ]
        })

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
        expect(actual).to.deep.equal([
          [[Beta], [Alpha, Beta], [Alpha, Gamma]],
          [[Charlie], [Alpha, Delta]]
        ])
      })

      it("three complex multi token alternatives", () => {
        const alt1 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Beta }),
                new Terminal({ terminalType: Gamma })
              ]
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Beta })]
            })
          ]
        })
        const alt2 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Delta })
              ]
            }),
            new Alternative({
              definition: [new Terminal({ terminalType: Charlie })]
            }),
            new Alternative({
              definition: [
                new Terminal({ terminalType: Gamma }),
                new Terminal({ terminalType: Gamma })
              ]
            })
          ]
        })
        const alt3 = new Alternation({
          definition: [
            new Alternative({
              definition: [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Beta }),
                new Terminal({ terminalType: Delta })
              ]
            }),
            new Alternative({
              definition: [
                new Terminal({ terminalType: Charlie }),
                new Terminal({ terminalType: Beta })
              ]
            })
          ]
        })

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2, alt3], 5)
        expect(actual).to.deep.equal([
          [[Beta], [Alpha, Beta, Gamma]],
          [[Charlie], [Gamma], [Alpha, Delta]],
          [
            [Charlie, Beta],
            [Alpha, Beta, Delta]
          ]
        ])
      })

      it("two complex multi token alternatives with shared prefix", () => {
        const alt1 = new Alternative({
          definition: [
            new Terminal({ terminalType: Alpha }),
            new Terminal({ terminalType: Beta }),
            new Terminal({ terminalType: Charlie }),
            new Terminal({ terminalType: Delta })
          ]
        })

        const alt2 = new Alternative({
          definition: [
            new Terminal({ terminalType: Alpha }),
            new Terminal({ terminalType: Beta }),
            new Terminal({ terminalType: Charlie }),
            new Terminal({ terminalType: Delta }),
            new Terminal({ terminalType: Gamma }),
            new Terminal({ terminalType: Alpha })
          ]
        })

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
        expect(actual).to.deep.equal([
          [[Alpha, Beta, Charlie, Delta]],
          [[Alpha, Beta, Charlie, Delta, Gamma]]
        ])
      })

      it("simple ambiguous alternatives", () => {
        const alt1 = new Alternative({
          definition: [new Terminal({ terminalType: Alpha })]
        })
        const alt2 = new Alternative({
          definition: [new Terminal({ terminalType: Alpha })]
        })

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
        expect(actual).to.deep.equal([[[Alpha]], [[Alpha]]])
      })

      it("complex(multi-token) ambiguous alternatives", () => {
        const alt1 = new Alternative({
          definition: [
            new Terminal({ terminalType: Alpha }),
            new Terminal({ terminalType: Beta }),
            new Terminal({ terminalType: Charlie })
          ]
        })

        const alt2 = new Alternative({
          definition: [
            new Terminal({ terminalType: Alpha }),
            new Terminal({ terminalType: Beta }),
            new Terminal({ terminalType: Charlie })
          ]
        })

        const actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
        expect(actual).to.deep.equal([
          [[Alpha, Beta, Charlie]],
          [[Alpha, Beta, Charlie]]
        ])
      })
    })

    context("computing lookahead functions for", () => {
      function buildAltRule(alternatives: TokenType[][][]): Rule {
        const def: Alternative[] = []
        let alternationIdx = 0
        let terminalIdx = 0
        const rule = new Rule({
          name: "altRule",
          definition: [
            new Alternation({
              definition: def,
              idx: alternationIdx++
            })
          ]
        })
        for (const alt of alternatives) {
          const innerAlts: Alternative[] = []
          def.push(
            new Alternative({
              definition: [
                new Alternation({
                  definition: innerAlts,
                  idx: alternationIdx++
                })
              ]
            })
          )
          for (const path of alt) {
            const terminals: Terminal[] = []
            innerAlts.push(
              new Alternative({
                definition: terminals
              })
            )
            for (const token of path) {
              terminals.push(
                new Terminal({ terminalType: token, idx: terminalIdx++ })
              )
            }
          }
        }
        return rule
      }

      function buildOptionRule(options: TokenType[][]): Rule {
        const def: Alternative[] = []
        let optionIdx = 0
        let terminalIdx = 0
        const rule = new Rule({
          name: "optionRule",
          definition: [
            new Option({
              definition: [
                new Alternation({
                  definition: def
                })
              ],
              idx: optionIdx++
            })
          ]
        })
        for (const path of options) {
          const terminals: Terminal[] = []
          def.push(
            new Alternative({
              definition: terminals
            })
          )
          for (const token of path) {
            terminals.push(
              new Terminal({ terminalType: token, idx: terminalIdx++ })
            )
          }
        }
        return rule
      }

      it("inheritance Alternative alternatives - positive", () => {
        const rule = buildAltRule([
          [[ExtendsAlphaAlpha]], // 0
          [[ExtendsAlpha]], // 1
          [[Alpha]] // 2
        ])
        const tokenTypes = [Alpha, ExtendsAlpha, ExtendsAlphaAlpha]
        const alphaMockParser = new MockParserVar([Alpha], [rule], tokenTypes)
        const extendsAlphaMockParser = new MockParserVar(
          [ExtendsAlpha],
          [rule],
          tokenTypes
        )
        const extendsAlphaAlphaMockParser = new MockParserVar(
          [ExtendsAlphaAlpha],
          [rule],
          tokenTypes
        )

        const laFunc = buildLookaheadFuncForOr(rule, 0, 0, false, false)

        expect(laFunc.call(alphaMockParser)).to.equal(2)
        expect(laFunc.call(extendsAlphaMockParser)).to.equal(1)
        expect(laFunc.call(extendsAlphaAlphaMockParser)).to.equal(0)
      })

      it("simple alternatives - positive", () => {
        const rule = buildAltRule([
          [[Alpha], [Beta]], // 0
          [[Delta], [Gamma]], // 1
          [[Charlie]] // 2
        ])
        const tokenTypes = [Alpha, Beta, Delta, Gamma, Charlie]
        const alphaMock = new MockParserVar([Alpha], [rule], tokenTypes)
        const betaMock = new MockParserVar([Beta], [rule], tokenTypes)
        const deltaMock = new MockParserVar([Delta], [rule], tokenTypes)
        const gammaMock = new MockParserVar([Gamma], [rule], tokenTypes)
        const charlieMock = new MockParserVar([Charlie], [rule], tokenTypes)
        const laFunc = buildLookaheadFuncForOr(rule, 0, 0, false, false)

        expect(laFunc.call(alphaMock)).to.equal(0)
        expect(laFunc.call(betaMock)).to.equal(0)
        expect(laFunc.call(deltaMock)).to.equal(1)
        expect(laFunc.call(gammaMock)).to.equal(1)
        expect(laFunc.call(charlieMock)).to.equal(2)
      })

      it("simple alternatives - negative", () => {
        const rule = buildAltRule([
          [[Alpha], [Beta]], // 0
          [[Delta], [Gamma]] // 1
        ])
        const tokenTypes = [Alpha, Beta, Delta, Gamma, Charlie]
        const emptyMock = new MockParserVar([], [rule], tokenTypes)
        const charlieMock = new MockParserVar([Charlie], [rule], tokenTypes)
        const laFunc = buildLookaheadFuncForOr(rule, 0, 0, false, false)

        expect(laFunc.call(emptyMock)).to.be.undefined
        expect(laFunc.call(charlieMock)).to.be.undefined
      })

      it("complex alternatives - positive", () => {
        const rule = buildAltRule([
          [
            [Alpha, Beta, Gamma],
            [Alpha, Beta, Delta]
          ], // 0
          [[Alpha, Beta, Beta]], // 1
          [[Alpha, Beta]] // 2 - Prefix of '1' alternative
        ])
        const tokenTypes = [Alpha, Beta, Delta, Gamma, Charlie]
        const parser1 = new MockParserVar(
          [Alpha, Beta, Gamma],
          [rule],
          tokenTypes
        )
        const parser2 = new MockParserVar(
          [Alpha, Beta, Gamma, Delta],
          [rule],
          tokenTypes
        )
        const parser3 = new MockParserVar(
          [Alpha, Beta, Delta],
          [rule],
          tokenTypes
        )
        const parser4 = new MockParserVar(
          [Alpha, Beta, Beta],
          [rule],
          tokenTypes
        )
        const parser5 = new MockParserVar(
          [Alpha, Beta, Charlie],
          [rule],
          tokenTypes
        )
        const laFunc = buildLookaheadFuncForOr(rule, 0, 0, false, false)

        expect(laFunc.call(parser1)).to.equal(0)
        expect(laFunc.call(parser2)).to.equal(0)
        expect(laFunc.call(parser3)).to.equal(0)
        expect(laFunc.call(parser4)).to.equal(1)
        expect(laFunc.call(parser5)).to.equal(2)
      })

      it("complex alternatives - negative", () => {
        const rule = buildAltRule([
          [
            [Alpha, Beta, Gamma],
            [Alpha, Beta, Delta]
          ], // 0
          [[Alpha, Beta, Beta]], // 1
          [[Alpha, Beta], [Gamma]] // 2
        ])
        const tokenTypes = [Alpha, Beta, Delta, Gamma, Charlie]
        const emptyMock = new MockParserVar([], [rule], tokenTypes)
        const alphaMock = new MockParserVar(
          [Alpha, Gamma, Gamma],
          [rule],
          tokenTypes
        )
        const charlieMock = new MockParserVar([Charlie], [rule], tokenTypes)
        const betaMock = new MockParserVar(
          [Beta, Alpha, Beta, Gamma],
          [rule],
          tokenTypes
        )
        const laFunc = buildLookaheadFuncForOr(rule, 0, 0, false, false)

        expect(laFunc.call(emptyMock)).to.be.undefined
        expect(laFunc.call(alphaMock)).to.be.undefined
        expect(laFunc.call(charlieMock)).to.be.undefined
        expect(laFunc.call(betaMock)).to.be.undefined
      })

      it("complex alternatives with inheritance - positive", () => {
        const rule = buildAltRule([
          [[ExtendsAlpha, Beta]], // 0
          [[Alpha, Beta]] // 1
        ])

        const tokenTypes = [Alpha, Beta, Delta, Gamma, Charlie]
        const alphaMock = new MockParserVar([Alpha, Beta], [rule], tokenTypes)
        const extendsAlphaMock = new MockParserVar(
          [ExtendsAlpha, Beta],
          [rule],
          tokenTypes
        )
        const extendsAlphaAlphaMock = new MockParserVar(
          [ExtendsAlphaAlpha, Beta],
          [rule],
          tokenTypes
        )
        const laFunc = buildLookaheadFuncForOr(rule, 0, 0, false, false)

        expect(laFunc.call(alphaMock)).to.equal(1)
        expect(laFunc.call(extendsAlphaMock)).to.equal(0)
        expect(laFunc.call(extendsAlphaAlphaMock)).to.equal(0)
      })

      it("complex alternatives with inheritance - negative", () => {
        const rule = buildAltRule([
          [[ExtendsAlpha, Beta]], // 0
          [[Alpha, Gamma]] // 1
        ])

        const tokenTypes = [
          Alpha,
          Beta,
          Delta,
          Gamma,
          ExtendsAlpha,
          ExtendsAlphaAlpha
        ]
        const extendsAlphaMock = new MockParserVar(
          [ExtendsAlpha, Delta],
          [rule],
          tokenTypes
        )
        const extendsAlphaAlphaMock = new MockParserVar(
          [ExtendsAlphaAlpha, Delta],
          [rule],
          tokenTypes
        )
        const laFunc = buildLookaheadFuncForOr(rule, 0, 0, false, false)

        expect(laFunc.call(extendsAlphaMock)).to.be.undefined
        expect(laFunc.call(extendsAlphaAlphaMock)).to.be.undefined
      })

      it("Empty alternatives", () => {
        const rule = buildAltRule([
          [[Alpha]], // 0
          [[]] // 1
        ])
        const tokenTypes = [Alpha, Delta]
        const alphaMock = new MockParserVar([Alpha], [rule], tokenTypes)
        const emptyMock = new MockParserVar([], [rule], tokenTypes)
        const deltaMock = new MockParserVar([Delta], [rule], tokenTypes)
        const laFunc = buildLookaheadFuncForOr(rule, 0, 0, false, false)

        expect(laFunc.call(alphaMock)).to.equal(0)
        expect(laFunc.call(emptyMock)).to.equal(1) // empty alternative always matches
        expect(laFunc.call(deltaMock)).to.equal(1) // empty alternative always matches
      })

      it("simple optional - positive", () => {
        const rule = buildOptionRule([[Alpha], [Beta], [Charlie]])
        const tokenTypes = [Alpha, Beta, Charlie]
        const alphaMock = new MockParserVar([Alpha], [rule], tokenTypes)
        const betaMock = new MockParserVar([Beta], [rule], tokenTypes)
        const charlieMock = new MockParserVar([Charlie], [rule], tokenTypes)
        const laFunc = buildLookaheadFuncForOptionalProd(
          rule,
          0,
          PROD_TYPE.OPTION,
          0,
          false
        )

        expect(laFunc.call(alphaMock)).to.be.true
        expect(laFunc.call(betaMock)).to.be.true
        expect(laFunc.call(charlieMock)).to.be.true
      })

      it("simple optional - negative", () => {
        const rule = buildOptionRule([[Alpha], [Beta], [Charlie]])
        const tokenTypes = [Alpha, Beta, Charlie, Delta, Gamma]
        const deltaMock = new MockParserVar([Delta], [rule], tokenTypes)
        const gammaMock = new MockParserVar([Gamma], [rule], tokenTypes)
        const laFunc = buildLookaheadFuncForOptionalProd(
          rule,
          0,
          PROD_TYPE.OPTION,
          0,
          false
        )

        expect(laFunc.call(deltaMock)).to.be.false
        expect(laFunc.call(gammaMock)).to.be.false
      })

      it("complex optional - positive", () => {
        const rule = buildOptionRule([
          [Alpha, Beta, Gamma],
          [Beta],
          [Charlie, Delta]
        ])
        const tokenTypes = [Alpha, Beta, Charlie, Delta, Gamma]
        const alphaMock = new MockParserVar(
          [Alpha, Beta, Gamma],
          [rule],
          tokenTypes
        )
        const betaMock = new MockParserVar([Beta], [rule], tokenTypes)
        const charlieMock = new MockParserVar(
          [Charlie, Delta],
          [rule],
          tokenTypes
        )
        const laFunc = buildLookaheadFuncForOptionalProd(
          rule,
          0,
          PROD_TYPE.OPTION,
          0,
          false
        )

        expect(laFunc.call(alphaMock)).to.be.true
        expect(laFunc.call(betaMock)).to.be.true
        expect(laFunc.call(charlieMock)).to.be.true
      })

      it("complex optional - negative", () => {
        const rule = buildOptionRule([
          [Alpha, Beta, Gamma],
          [Beta],
          [Charlie, Delta]
        ])
        const tokenTypes = [Alpha, Beta, Charlie, Delta, Gamma]
        const deltaLongMock = new MockParserVar(
          [Delta, Beta, Gamma],
          [rule],
          tokenTypes
        )
        const deltaMock = new MockParserVar([Delta], [rule], tokenTypes)
        const laFunc = buildLookaheadFuncForOptionalProd(
          rule,
          0,
          PROD_TYPE.OPTION,
          0,
          false
        )

        expect(laFunc.call(deltaLongMock)).to.be.false
        expect(laFunc.call(deltaMock)).to.be.false
      })

      it("complex optional with inheritance - positive", () => {
        const rule = buildOptionRule([[Alpha]])

        const tokenTypes = [Alpha, ExtendsAlpha, ExtendsAlphaAlpha]
        const alphaMock = new MockParserVar(
          [Alpha, ExtendsAlpha, ExtendsAlphaAlpha],
          [rule],
          tokenTypes
        )
        const extendsAlphaMock = new MockParserVar(
          [ExtendsAlpha],
          [rule],
          tokenTypes
        )
        const extendsAlphaAlphaMock = new MockParserVar(
          [ExtendsAlphaAlpha],
          [rule],
          tokenTypes
        )
        const laFunc = buildLookaheadFuncForOptionalProd(
          rule,
          0,
          PROD_TYPE.OPTION,
          0,
          false
        )

        expect(laFunc.call(alphaMock)).to.be.true
        expect(laFunc.call(extendsAlphaMock)).to.be.true
        expect(laFunc.call(extendsAlphaAlphaMock)).to.be.true
      })

      it("complex optional with inheritance - negative", () => {
        const rule = buildOptionRule([[ExtendsAlpha]])

        const tokenTypes = [Alpha, Gamma, ExtendsAlpha, ExtendsAlphaAlpha]
        const alphaMock = new MockParserVar([Alpha], [rule], tokenTypes)
        const gammaMock = new MockParserVar([Gamma], [rule], tokenTypes)
        const laFunc = buildLookaheadFuncForOptionalProd(
          rule,
          0,
          PROD_TYPE.OPTION,
          0,
          false
        )
        expect(laFunc.call(alphaMock)).to.be.false
        expect(laFunc.call(gammaMock)).to.be.false
      })
    })
  })
})
