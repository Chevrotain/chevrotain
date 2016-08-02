var expect = require('chai').expect

describe('Chevrotain minification support', function() {

    it('Cannot be minified without custom compression options', function() {
        expect(function(){
            require("./gen/no_compression.min").parseJson("")
        }).to.throw(/Terminal Token name: \w+ not found/);
    })

    it('Can be minified using selective name mangling', function() {
        var parseJson = require('./gen/selective.min').parseJson
        var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
        var lexAndParseResult = parseJson(inputText)

        expect(lexAndParseResult.lexErrors).to.be.empty
        expect(lexAndParseResult.parseErrors).to.be.empty
    })

    it('Can be minified using disabled mangling', function() {
        // hack to clean the chevrotain Cache because initializing two parsers with
        // the same name will not work correctly.
        require("../node_modules/chevrotain/lib/src/parse/cache").clearCache()
        var parseJson = require('./gen/disable_mangling.min').parseJson
        var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
        var lexAndParseResult = parseJson(inputText)

        expect(lexAndParseResult.lexErrors).to.be.empty
        expect(lexAndParseResult.parseErrors).to.be.empty
    })
})