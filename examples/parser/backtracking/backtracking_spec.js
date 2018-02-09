const expect = require("chai").expect
const parseSample = require("./backtracking")

describe("The Backtracking Example", () => {
    it("can parse a statement with Equals and a very long qualified name", () => {
        const input = "element age : a.b.c.d.e.f = 666;"
        const parseResult = parseSample(input)
        expect(parseResult.parseErrors).to.be.empty
        expect(parseResult.value.children.withEqualsStatement).to.have.lengthOf(
            1
        )
        expect(
            parseResult.value.children.withDefaultStatement
        ).to.have.lengthOf(0)
    })

    it("can parse a statement with Default and a very long qualified name", () => {
        const input = "element age : a.b.c.d.e.f default 666;"
        const parseResult = parseSample(input)
        expect(parseResult.parseErrors).to.be.empty
        expect(parseResult.value.children.withEqualsStatement).to.have.lengthOf(
            0
        )
        expect(
            parseResult.value.children.withDefaultStatement
        ).to.have.lengthOf(1)
    })
})
