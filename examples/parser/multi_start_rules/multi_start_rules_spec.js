import { expect } from "chai"
const rules = require("./multi_start_rules")

describe("The Chevrotain support using any rule as a start/top rule", () => {
  it("can invoke the first rule successfully", () => {
    expect(() => {
      rules.parseFirst("A B C")
    }).to.not.throw("sad sad panda")
    expect(() => {
      rules.parseFirst("A")
    }).to.not.throw("sad sad panda")
  })

  it("can invoke the second rule successfully", () => {
    expect(() => {
      rules.parseSecond("B C")
    }).to.not.throw("sad sad panda")
    expect(() => {
      rules.parseSecond("B")
    }).to.not.throw("sad sad panda")
  })

  it("can invoke the third rule successfully", () => {
    expect(() => {
      rules.parseThird("C")
    }).to.not.throw("sad sad panda")
  })
})
