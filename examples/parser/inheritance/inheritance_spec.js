var assert = require("assert");
var parseCommand = require("./inheritance");

var ENGLISH = "english";
var GERMAN = "german";

describe('The Advanced Inheritance Parser Example', function() {

    it('can parse commands in english', function() {
        var inputText = 'clean the room after cooking some sausages';
        var lexAndParseResult = parseCommand(inputText, ENGLISH);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    });

    it('can parse commands in german', function() {
        var inputText = 'kochen wurstchen und raum den raum auf';
        var lexAndParseResult = parseCommand(inputText, GERMAN);

        assert.equal(lexAndParseResult.lexErrors.length, 0);
        assert.equal(lexAndParseResult.parseErrors.length, 0);
    })

});
