import { expect } from "chai"

import { createToken, Parser } from "../src/api"
import { CstParser } from "../src/parse/parser/traits/parser_traits"
import { IToken } from "../api"

describe("Chevrotain's runtime deprecation checks", () => {
  it("Will throw an error if someone tries to use the deprecated Parser class", () => {
    expect(() => new Parser()).to.throw("The Parser class has been deprecated")
    expect(() => new Parser()).to.throw("CstParser or EmbeddedActionsParser")
    expect(() => new Parser()).to.throw(
      "https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_7-0-0"
    )
  })

  it("Will throw an error if someone tries to use the deprecated Parser class", () => {
    const tokA = createToken({ name: "foo", pattern: "bar" })
    class StaticSelfAnalysisParser extends CstParser {
      constructor() {
        super([tokA])
        ;(CstParser as any).performSelfAnalysis()
      }
    }

    expect(() => new StaticSelfAnalysisParser()).to.throw(
      "The **static** `performSelfAnalysis` method has been deprecated"
    )
  })
})
