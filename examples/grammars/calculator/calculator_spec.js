var assert = require("assert");
var calc = require("./calculator");

describe("The Calculator Grammar", function() {

    it("can calculate an expression", function() {
        assert.equal(calc("1 + 2").value, 3)
    });

    it("can calculate an expression with operator precedence", function() {
        // if it was evaluated left to right without taking into account precedence the result would have been 9
        assert.equal(calc("1 + 2 * 3").value, 7);
    });

    it("can calculate an expression with operator precedence #2", function() {
        assert.equal(calc("(1 + 2) * 3").value, 9);
    });

    it("can calculate an expression with many parenthesis", function() {
        assert.equal(calc("((((666))))").value, 666);
    })

});
