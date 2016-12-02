var parse = require("./predicate_lookahead").parse;
var setMaxAllowed = require("./predicate_lookahead").setMaxAllowed;
var expect = require("chai").expect;

describe("The Chevrotain support for custom lookahead predicates", function() {

    it("can limit the available alternatives in an OR by an some external input number", function() {
        setMaxAllowed(3);
        expect(parse("1").value).to.equal(1);
        expect(parse("2").value).to.equal(2);
        expect(parse("3").value).to.equal(3);

        setMaxAllowed(2);
        expect(parse("1").value).to.equal(1);
        expect(parse("2").value).to.equal(2);
        expect(parse("3").parseErrors).to.not.be.empty;

        setMaxAllowed(1);
        expect(parse("1").value).to.equal(1);
        expect(parse("2").parseErrors).to.not.be.empty;
        expect(parse("3").parseErrors).to.not.be.empty;
    });

});
