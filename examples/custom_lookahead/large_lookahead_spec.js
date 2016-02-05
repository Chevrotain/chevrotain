var expect = require("chai").expect;
var parse = require("./large_lookahead");

describe("The Chevrotain support for custom lookahead for LL(>1) grammars", function () {

    it("can use custom lookahead functions to distinguish between two alternatives with the same first token", function () {
        expect(parse("export = foo")).to.equal("Assignment");
        expect(parse("export interface")).to.equal("Interface");
    });

});
