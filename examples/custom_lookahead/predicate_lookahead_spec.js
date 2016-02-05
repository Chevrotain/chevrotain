var parse = require("./predicate_lookahead").parse;
var setMaxAllowed = require("./predicate_lookahead").setMaxAllowed;
var expect = require("chai").expect;

describe.only("The Chevrotain support for custom lookahead predicates", function () {

    it("can limit the available alternatives in an OR by an some external input number", function () {
        setMaxAllowed(3);
        expect(parse("1")).to.equal(1);
        expect(parse("2")).to.equal(2);
        expect(parse("3")).to.equal(3);

        setMaxAllowed(2);
        expect(parse("1")).to.equal(1);
        expect(parse("2")).to.equal(2);
        expect(function () {parse("3")}).to.throw("sad sad panda, parsing errors detected");

        setMaxAllowed(1);
        expect(parse("1")).to.equal(1);
        expect(function () {parse("2")}).to.throw("sad sad panda, parsing errors detected");
        expect(function () {parse("3")}).to.throw("sad sad panda, parsing errors detected");
    });

});
