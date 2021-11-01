import { upperFirst } from "../src/api"
import { expect } from "chai"

describe("The Utils functions namespace", () => {
  it("exports a upperFirst utility", () => {
    expect(upperFirst("a")).to.equal("A")
    expect(upperFirst("abc")).to.equal("Abc")
    expect(upperFirst("Abc")).to.equal("Abc")
    expect(upperFirst("aBc")).to.equal("ABc")
    expect(upperFirst("😀Bc")).to.equal("😀Bc")
    expect(upperFirst("åbc")).to.equal("Åbc")
    expect(upperFirst("")).to.equal("")
  })
})
