const assert = require("assert")
const parseJson = require("./json")

describe("The JSON Grammar", () => {
    it("can parse a simple Json without errors", () => {
        const inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
        const lexAndParseResult = parseJson(inputText)

        assert.equal(lexAndParseResult.lexErrors.length, 0)
        assert.equal(lexAndParseResult.parseErrors.length, 0)
    })
})
