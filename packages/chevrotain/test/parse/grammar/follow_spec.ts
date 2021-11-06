import {
  buildInProdFollowPrefix,
  buildBetweenProdsFollowPrefix,
  ResyncFollowsWalker,
  computeAllProdsFollows
} from "../../../src/parse/grammar/follow"
import { setEquality } from "../../utils/matchers"
import {
  NonTerminal,
  Option,
  Repetition,
  Rule,
  Terminal
} from "../../../src/parse/grammar/gast/gast_public"
import keys from "lodash/keys"
import { expect } from "chai"
import { createToken } from "../../../src/scan/tokens_public"
import { TokenType } from "@chevrotain/types"
import { createDeferredTokenBuilder } from "../../utils/builders"

const getIdentTok = createDeferredTokenBuilder({
  name: "IdentTok",
  pattern: /NA/
})
const getDotTok = createDeferredTokenBuilder({ name: "DotTok", pattern: /NA/ })
const getColonTok = createDeferredTokenBuilder({
  name: "ColonTok",
  pattern: /NA/
})

function buildQualifiedName(): Rule {
  return new Rule({
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

describe("The Grammar Ast Follows model", () => {
  let actionDec: Rule
  let SemicolonTok: TokenType
  let CommaTok: TokenType
  let LParenTok = createToken({ name: "LParenTok", pattern: /NA/ })
  let RParenTok = createToken({ name: "RParenTok", pattern: /NA/ })

  before(() => {
    SemicolonTok = createToken({ name: "SemicolonTok", pattern: /NA/ })
    CommaTok = createToken({ name: "CommaTok", pattern: /NA/ })
    LParenTok = createToken({ name: "LParenTok", pattern: /NA/ })
    RParenTok = createToken({ name: "RParenTok", pattern: /NA/ })
    const LSquareTok = createToken({ name: "LSquareTok", pattern: /NA/ })
    const RSquareTok = createToken({ name: "RSquareTok", pattern: /NA/ })

    const paramSpec = new Rule({
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
            new Terminal({ terminalType: LSquareTok }),
            new Terminal({ terminalType: RSquareTok })
          ]
        })
      ]
    })
    const ActionTok = createToken({ name: "ActionTok", pattern: /NA/ })
    actionDec = new Rule({
      name: "actionDec",
      definition: [
        new Terminal({ terminalType: ActionTok }),
        new Terminal({ terminalType: getIdentTok() }),
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
  it("can build a followNamePrefix from a Terminal", () => {
    const EntityTok = createToken({ name: "EntityTok", pattern: /NA/ })
    const terminal = new Terminal({ terminalType: getIdentTok() })
    const actual = buildInProdFollowPrefix(terminal)
    expect(actual).to.equal("IdentTok1_~IN~_")

    const terminal2 = new Terminal({ terminalType: EntityTok })
    terminal2.idx = 3
    const actual2 = buildInProdFollowPrefix(terminal2)
    expect(actual2).to.equal("EntityTok3_~IN~_")
  })

  it("can build a followName prefix from a TopLevel Production and index", () => {
    const prod = new Rule({ name: "bamba", definition: [] })
    const index = 5

    const actual = buildBetweenProdsFollowPrefix(prod, index)
    expect(actual).to.equal("bamba5_~IN~_")
  })

  it("can compute the follows for Top level production ref in ActionDec", () => {
    const actual = new ResyncFollowsWalker(actionDec).startWalking()
    const actualFollowNames = keys(actual)
    expect(actualFollowNames.length).to.equal(3)
    expect(actual["paramSpec1_~IN~_actionDec"].length).to.equal(2)
    setEquality(actual["paramSpec1_~IN~_actionDec"], [CommaTok, RParenTok])
    expect(actual["paramSpec2_~IN~_actionDec"].length).to.equal(2)
    setEquality(actual["paramSpec1_~IN~_actionDec"], [CommaTok, RParenTok])
    expect(actual["qualifiedName1_~IN~_actionDec"].length).to.equal(1)
    setEquality(actual["qualifiedName1_~IN~_actionDec"], [SemicolonTok])
  })

  it("can compute all follows for a set of top level productions", () => {
    const actual = computeAllProdsFollows([actionDec])
    expect(keys(actual).length).to.equal(3)
  })
})
