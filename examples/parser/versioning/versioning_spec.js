var assert = require("assert")
var parseSelect = require("./versioning")

var VERSION_1 = 1
var VERSION_2 = 2

describe("The Grammar Versioning example", function() {
    it("can parse a simple Select statement with Version >1< grammar", function() {
        var inputText = "SELECT name FROM employees"
        var lexAndParseResult = parseSelect(inputText, VERSION_1)

        assert.equal(lexAndParseResult.lexErrors.length, 0)
        assert.equal(lexAndParseResult.parseErrors.length, 0)
    })

    it("can parse a simple Select statement with Version >2< grammar", function() {
        var inputText = "SELECT name FROM employees , managers"
        var lexAndParseResult = parseSelect(inputText, VERSION_2)

        assert.equal(lexAndParseResult.lexErrors.length, 0)
        assert.equal(lexAndParseResult.parseErrors.length, 0)
    })

    it("can NOT parse Version2 input using Version1 grammar", function() {
        // this input is invalid for V1 because there are multipile table names in the 'FROM' clause.
        var inputText = "SELECT name FROM employees , managers"
        var lexAndParseResult = parseSelect(inputText, VERSION_1)

        assert.equal(lexAndParseResult.lexErrors.length, 0)
        assert.equal(lexAndParseResult.parseErrors.length, 1) // has errors
    })
})
