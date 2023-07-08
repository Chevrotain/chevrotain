import { expect } from "chai"
import { parseFirst, parseSecond, parseThird } from "./multi_start_rules.js"

describe("The Chevrotain support using any rule as a start/top rule", () => {
  it("can invoke the first rule successfully", () => {
    expect(() => {
      parseFirst("A B C")
    }).to.not.throw("sad sad panda")
    expect(() => {
      parseFirst("A")
    }).to.not.throw("sad sad panda")
  })

  it("can invoke the second rule successfully", () => {
    expect(() => {
      parseSecond("B C")
    }).to.not.throw("sad sad panda")
    expect(() => {
      parseSecond("B")
    }).to.not.throw("sad sad panda")
  })

  it("can invoke the third rule successfully", () => {
    expect(() => {
      parseThird("C")
    }).to.not.throw("sad sad panda")
  })
})
