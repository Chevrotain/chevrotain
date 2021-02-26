import {
  IdentTok,
  EntityTok,
  actionDec,
  CommaTok,
  RParenTok,
  SemicolonTok
} from "./samples"
import {
  buildInProdFollowPrefix,
  buildBetweenProdsFollowPrefix,
  ResyncFollowsWalker,
  computeAllProdsFollows
} from "../../../src/parse/grammar/follow"
import { setEquality } from "../../utils/matchers"
import { Rule, Terminal } from "../../../src/parse/grammar/gast/gast_public"
import { keys } from "../../../src/utils/utils"

describe("The Grammar Ast Follows model", () => {
  it("can build a followNamePrefix from a Terminal", () => {
    const terminal = new Terminal({ terminalType: IdentTok })
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
