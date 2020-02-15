import { expect } from "chai"

import { Parser } from "../src/api"

describe("Chevrotain's runtime deprecation checks", () => {
  it("Will throw an error if someone tries to use the deprecated Parser class", () => {
    expect(() => new Parser()).to.throw("The Parser class has been deprecated")
    expect(() => new Parser()).to.throw("CstParser or EmbeddedActionsParser")
    expect(() => new Parser()).to.throw(
      "https://sap.github.io/chevrotain/docs/changes/BREAKING_CHANGES.html#_7-0-0"
    )
  })
})
