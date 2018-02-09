var expect = require("chai").expect
var _ = require("lodash")

function clearJsonCache() {
    var cacheModule = require("../node_modules/chevrotain/lib/src/parse/cache")
    _.forEach(cacheModule, function(cacheItem) {
        delete cacheItem.JsonParser
    })
}

describe("Chevrotain minification support", () => {
    // hack to clean the chevrotain Cache because initializing multiple parsers with
    // the same name will not work correctly.
    beforeEach(() => {
        clearJsonCache()
    })

    it("Cannot be minified without custom compression options", () => {
        expect(() => {
            require("./gen/no_compression.min").parseJson("")
        }).to.throw(/Terminal Token name: \w+ not found/)
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
