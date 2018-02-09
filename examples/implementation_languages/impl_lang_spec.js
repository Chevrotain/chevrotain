const assert = require("assert")

function createSanityTest(languageName, parseJson) {
    it("works with: " + languageName, () => {
        const inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
        const lexAndParseResult = parseJson(inputText)

        assert.equal(lexAndParseResult.lexErrors.length, 0)
        assert.equal(lexAndParseResult.parseErrors.length, 0)
    })
}

describe("The ability to use Chevrotain using different implementation languages", () => {
    createSanityTest("ECMAScript 5", require("./ecma5/ecma5_json"))
    createSanityTest("ECMAScript 6/2015", require("./ecma6/ecma6_json"))
    createSanityTest(
        "TypeScript",
        require("./typescript/typescript_json").parseJson
    )
    createSanityTest(
        "CoffeeScript",
        require("./coffeescript/coffeescript_json")
    )
})
