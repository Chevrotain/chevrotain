var assert = require("assert");
var parseJson = require("./json");

describe('The JSON Grammar', function() {

    it('can parse a simple Json without errors', function() {
        var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}';
        var lexAndParseResult = parseJson(inputText);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    });

    it('can parse a simple Json without errors - Parser implemented using ES6 syntax', function() {
        // only load a file containing ES6 syntax when actually running the test
        // thus if this test is ignored the other tests can still be run in old node.js versions
        var parseJsonES6 = require("./jsonES6");
        var inputText = '{ "arr": [1,null,true], "obj": {"num":666}}';
        var lexAndParseResult = parseJsonES6(inputText);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    });
});
