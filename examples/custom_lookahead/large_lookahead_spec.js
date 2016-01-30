var assert = require("assert");
var parse = require("./large_lookahead");

describe("The Chevrotain support for custom lookahead for LL(>1) grammars", function () {

    it("can use custom lookahead functions to distinguish between two alternatives with the same first token", function () {
        assert.equal(parse("export = foo"), "Assignment");
        assert.equal(parse("export interface"), "Interface");
    });

});
