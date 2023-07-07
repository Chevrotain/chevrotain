import { expect } from "chai"
import { parse, setMaxAllowed } from "./predicate_lookahead.js"

describe("The Chevrotain support for custom lookahead predicates", () => {
  it("can limit the available alternatives in an OR by an some external input number", () => {
    setMaxAllowed(3)
    expect(parse("1").value).to.equal(1)
    expect(parse("2").value).to.equal(2)
    expect(parse("3").value).to.equal(3)

    setMaxAllowed(2)
    expect(parse("1").value).to.equal(1)
    expect(parse("2").value).to.equal(2)
    expect(parse("3").parseErrors).to.not.be.empty

    setMaxAllowed(1)
    expect(parse("1").value).to.equal(1)
    expect(parse("2").parseErrors).to.not.be.empty
    expect(parse("3").parseErrors).to.not.be.empty
  })
})
