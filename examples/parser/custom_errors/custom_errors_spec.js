import { expect } from "chai"
import {
  parseEarlyExit,
  parseMismatch,
  parseMismatchOverride,
  parseNoViable,
  parseRedundant
} from "./custom_errors.js"

describe("The Chevrotain support for custom error provider", () => {
  it("can customize a misMatchToken exception", () => {
    const errorsOverride = parseMismatch("A C")
    expect(errorsOverride).to.have.lengthOf(1)
    expect(errorsOverride[0].message).to.equal(
      "expecting Bravo at end of mis_match"
    )

    // we only modified the error for Bravo mismatches
    const errorsDefault = parseMismatch("C")
    expect(errorsDefault).to.have.lengthOf(1)
    expect(errorsDefault[0].message).to.equal(
      "Expecting token of type --> Alpha <-- but found --> 'C' <--"
    )
  })

  it("can customize a misMatchToken exception by overriding", () => {
    const errorsOverride = parseMismatchOverride("A C")
    expect(errorsOverride).to.have.lengthOf(1)
    expect(errorsOverride[0].message).to.equal("We want Bravo!!!")
  })

  it("can customize a NotAllInputParsed exception", () => {
    const errors = parseRedundant("A B C")
    expect(errors).to.have.lengthOf(1)
    expect(errors[0].message).to.equal(
      "very bad dog! you still have some input remaining at offset:4"
    )
  })

  it("can customize a NoViableAlt exception", () => {
    const errors = parseNoViable("C")
    expect(errors).to.have.lengthOf(1)
    expect(errors[0].message).to.equal(
      "Expecting: one of these possible Token sequences:\n  1. [Alpha]\n  2. [Bravo]\nbut found: 'C'"
    )
  })

  it("can customize a EarlyExit exception", () => {
    const errors = parseEarlyExit("A")
    expect(errors).to.have.lengthOf(1)
    expect(errors[0].message).to.equal(
      "Esperando por lo menos una iteración de: Bravo"
    )
  })
})
