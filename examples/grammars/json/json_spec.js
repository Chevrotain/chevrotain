const { expect } = require("chai")
const { parse } = require("./json")

describe("The JSON Grammar", () => {
    it("can parse a simple Json without errors", () => {
        const inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
        const parseResult = parse(inputText)

        expect(parseResult.lexErrors).to.be.empty
        expect(parseResult.parseErrors).to.be.empty
    })
})
