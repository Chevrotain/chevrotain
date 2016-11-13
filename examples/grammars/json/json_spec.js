var assert = require("assert");
var parseJson = require("./json");
var parseJsonES6 = require("./json_es6");

describe('The JSON Grammar', function() {

    it('can parse a simple Json without errors', function() {
        var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}';
        var lexAndParseResult = parseJson(inputText);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    });

    it('can parse a simple Json without errors - Parser implemented using ES6 syntax', function() {
        var inputText = '{ "arr": [1,null,true], "obj": {"num":666}}';
        var lexAndParseResult = parseJsonES6(inputText);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    });
});
