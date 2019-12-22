import { first } from "../../../src/parse/grammar/first"
import {
  EntityTok,
  CommaTok,
  NamespaceTok,
  TypeTok,
  ColonTok,
  ConstTok
} from "./samples"
import { setEquality } from "../../utils/matchers"
import {
  Flat,
  Terminal,
  Option,
  Alternation
} from "../../../src/parse/grammar/gast/gast_public"

describe("The Grammar Ast first model", () => {
  it("can compute the first for a terminal", () => {
    let terminal = new Terminal({ terminalType: EntityTok })
    let actual = first(terminal)
    expect(actual.length).to.equal(1)
    expect(actual[0]).to.equal(EntityTok)

    let terminal2 = new Terminal({ terminalType: CommaTok })
    let actual2 = first(terminal2)
    expect(actual2.length).to.equal(1)
    expect(actual2[0]).to.equal(CommaTok)
  })

  it("can compute the first for a Sequence production ", () => {
    let seqProduction = new Flat({
      definition: [new Terminal({ terminalType: EntityTok })]
    })
    let actual = first(seqProduction)
    expect(actual.length).to.equal(1)
    expect(actual[0]).to.equal(EntityTok)

    let seqProduction2 = new Flat({
      definition: [
        new Terminal({ terminalType: EntityTok }),
        new Option({
          definition: [new Terminal({ terminalType: NamespaceTok })]
        })
      ]
    })
    let actual2 = first(seqProduction2)
    expect(actual2.length).to.equal(1)
    expect(actual2[0]).to.equal(EntityTok)
  })

  it("can compute the first for an alternatives production ", () => {
    let altProduction = new Alternation({
      definition: [
        new Flat({
          definition: [new Terminal({ terminalType: EntityTok })]
        }),
        new Flat({
          definition: [new Terminal({ terminalType: NamespaceTok })]
        }),
        new Flat({
          definition: [new Terminal({ terminalType: TypeTok })]
        })
      ]
    })
    let actual = first(altProduction)
    expect(actual.length).to.equal(3)
    expect(actual[0]).to.equal(EntityTok)
    expect(actual[1]).to.equal(NamespaceTok)
    expect(actual[2]).to.equal(TypeTok)
  })

  it("can compute the first for an production with optional prefix", () => {
    let withOptionalPrefix = new Flat({
      definition: [
        new Option({
          definition: [new Terminal({ terminalType: NamespaceTok })]
        }),
        new Terminal({ terminalType: EntityTok })
      ]
    })
    let actual = first(withOptionalPrefix)
    setEquality(actual, [NamespaceTok, EntityTok])

    let withTwoOptPrefix = new Flat({
      definition: [
        new Option({
          definition: [new Terminal({ terminalType: NamespaceTok })]
        }),
        new Option({
          definition: [new Terminal({ terminalType: ColonTok })]
        }),
        new Terminal({ terminalType: EntityTok }),
        new Option({
          definition: [new Terminal({ terminalType: ConstTok })]
        })
      ]
    })
    let actual2 = first(withTwoOptPrefix)
    setEquality(actual2, [NamespaceTok, ColonTok, EntityTok])
  })
})
