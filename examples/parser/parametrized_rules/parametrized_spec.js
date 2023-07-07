import { expect } from "chai"
import { NoViableAltException } from "chevrotain"

let parseHello = require("./parametrized")

const POSITIVE = "positive"
const NEGATIVE = "negative"

describe("The Grammar Parametrized Rules example - using ES6 syntax", () => {
  it("can parse a cheerful hello sentence in <positive> mode", () => {
    const inputText = "hello wonderful world"
    const result = parseHello(inputText, POSITIVE)

    expect(result.lexErrors).to.be.empty
    expect(result.parseErrors).to.be.empty
  })

  it("cannot parse a cheerful hello sentence in <negative> mode", () => {
    const inputText = "hello amazing world"
    const result = parseHello(inputText, NEGATIVE)

    expect(result.lexErrors).to.be.empty
    expect(result.parseErrors).to.have.lengthOf(1)
    expect(result.parseErrors[0]).to.be.an.instanceof(NoViableAltException)
  })

  it("cannot parse a sad hello sentence in <positive> mode", () => {
    const inputText = "hello evil world"
    const result = parseHello(inputText, POSITIVE)

    expect(result.lexErrors).to.be.empty
    expect(result.parseErrors).to.have.lengthOf(1)
    expect(result.parseErrors[0]).to.be.an.instanceof(NoViableAltException)
  })

  it("can parse a sad hello sentence in <negative> mode", () => {
    const inputText = "hello cruel world"
    const result = parseHello(inputText, NEGATIVE)

    expect(result.lexErrors).to.be.empty
    expect(result.parseErrors).to.be.empty
  })
})
