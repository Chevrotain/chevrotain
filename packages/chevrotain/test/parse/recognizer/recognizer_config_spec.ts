import {
  EmbeddedActionsParser,
  CstParser
} from "../../../src/parse/parser/traits/parser_traits"
import { createToken } from "../../../src/scan/tokens_public"
import { expect } from "chai"

describe("The Recognizer's Configuration", () => {
  it("default config values - empty config", () => {
    const A = createToken({ name: "A" })

    class InvalidNodeLocationTrackingOption extends CstParser {
      constructor() {
        super([A], { nodeLocationTracking: <any>"oops" })
      }
    }

    expect(() => new InvalidNodeLocationTrackingOption()).to.throw(
      'Invalid <nodeLocationTracking> config option: "oops"'
    )
  })

  it("default config values - empty config", () => {
    const A = createToken({ name: "A" })

    class EmptyConfigParser extends EmbeddedActionsParser {
      constructor() {
        super([A], {})
      }
    }

    const parser = new EmptyConfigParser()
    expect((<any>parser).recoveryEnabled).to.be.false
    expect((<any>parser).maxLookahead).to.equal(3)
    expect((<any>parser).nodeLocationTracking).to.be.equal("none")
  })

  it("default config values - no config", () => {
    const A = createToken({ name: "A" })

    class NoConfigParser extends EmbeddedActionsParser {
      constructor() {
        super([A])
      }
    }

    const parser = new NoConfigParser()
    expect((<any>parser).recoveryEnabled).to.be.false
    expect((<any>parser).maxLookahead).to.equal(3)
    expect((<any>parser).nodeLocationTracking).to.be.equal("none")
  })

  it("default config values - no config", () => {
    const A = createToken({ name: "A" })

    const invalidConfig = { ignoredIssues: {} }
    class IgnoredIssuesParser extends EmbeddedActionsParser {
      constructor() {
        super([A], invalidConfig as any)
      }
    }
    expect(() => new IgnoredIssuesParser()).to.throw(
      "The <ignoredIssues> IParserConfig property has been deprecated"
    )
  })
})
