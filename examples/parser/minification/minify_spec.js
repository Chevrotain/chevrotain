var expect = require("chai").expect
var _ = require("lodash")

describe("Chevrotain minification support", () => {
    it("Cannot be minified without custom compression options", () => {
        expect(() => {
            require("./gen/no_compression.min").parseJson("")
        }).to.throw(/Terminal Token name: <\w+> not found/)
    })

    it("Can be minified using selective name mangling", () => {
        var parseJson = require("./gen/selective.min").parseJson
        var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
        var lexAndParseResult = parseJson(inputText)

        expect(lexAndParseResult.lexErrors).to.be.empty
        expect(lexAndParseResult.parseErrors).to.be.empty
    })

    it("Can be minified using disabled mangling", () => {
        var parseJson = require("./gen/disable_mangling.min").parseJson
        var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
        var lexAndParseResult = parseJson(inputText)

        expect(lexAndParseResult.lexErrors).to.be.empty
        expect(lexAndParseResult.parseErrors).to.be.empty
    })
})
