var assert = require("assert");
var parseJson = require("./jsonParser");

describe('The Json Parser', function () {
    it('can parse a simple Json without errors', function () {

        var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}';
        var lexAndParseResult = parseJson(inputText);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    })
});
