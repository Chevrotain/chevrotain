var assert = require("assert");
var parseJson = require("./jsonParser");
var parseJsonES6 = require("./jsonParserES6");

describe('The Json Parser', function () {

    it('can parse a simple Json without errors', function () {
        var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}';
        var lexAndParseResult = parseJson(inputText);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    });

    it('can parse a simple Json without errors - Parser implemented using ES6 syntax', function () {
        var inputText = '{ "arr": [1,null,true], "obj": {"num":666}}';
        var lexAndParseResult = parseJsonES6(inputText);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    });
});
