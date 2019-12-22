const expect = require("chai").expect
const parseJson = require("./combinator_grammar")

describe("The Combinator Style Custom API Example", () => {
  it("can parse a simple Json without errors", () => {
    const inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
    const parseResult = parseJson(inputText)
    expect(parseResult.lexErrors).to.be.empty
    expect(parseResult.parseErrors).to.be.empty
    expect(parseResult.value.name).to.equal("json")
    expect(parseResult.value.children.object[0].name).to.equal("object")
    expect(
      // lets explore the Parse Tree a bit.
      parseResult.value.children.object[0].children.RCurly[0].startOffset
    ).to.equal(36)
  })

  it("will provide a useful custom error message", () => {
    const c = require("./combinator_api")
    const createToken = require("chevrotain").createToken

    const A = createToken({ name: "A", pattern: /A/ })
    const B = createToken({ name: "B", pattern: /B/ })
    const C = createToken({ name: "C", pattern: /C/ })

    const rule1 = c.choice(c.seq(A, B, C), c.seq(A, B, C)).toRule("rule1")

    // Using a custom errMsgProvider we can create readable error messages for our custom API
    expect(() => c.createParser("myParser", [rule1], [A, B, C])).to.throw(
      "Ambiguous alternatives: <1 ,2> in <choice(seq(A, B, C), seq(A, B, C))> inside <rule1> Rule,\n" +
        "<A, B, C> may appears as a prefix path in all these alternatives."
    )
  })
})
