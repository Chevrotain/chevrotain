"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tokens_public_1 = require("../../src/scan/tokens_public");
var lexer_public_1 = require("../../src/scan/lexer_public");
var reg_exp_1 = require("../../src/scan/reg_exp");
describe("The Chevrotain regexp analysis", function () {
    it("Will re-attempt none 'optimized' patterns if the optimization failed", function () {
        // won't be automatically optimized due to the '|' meta characters
        var Boolean = tokens_public_1.createToken({
            name: "Boolean",
            pattern: /true|false/,
            // But we provide the hints so it can be optimized
            start_chars_hint: ["t", "f"]
        });
        // simple string can perform optimization
        var Function = tokens_public_1.createToken({ name: "Function", pattern: "function" });
        // won't be optimized due to the '\w' and '+'
        var Name = tokens_public_1.createToken({ name: "False", pattern: /\w+/ });
        var WhiteSpace = tokens_public_1.createToken({
            name: "WhiteSpace",
            pattern: /\s+/,
            group: lexer_public_1.Lexer.SKIPPED,
            line_breaks: true
        });
        var allTokens = [WhiteSpace, Boolean, Function, Name];
        var JsonLexer = new lexer_public_1.Lexer(allTokens);
        var lexResult = JsonLexer.tokenize("fool");
        expect(lexResult.tokens).to.have.lengthOf(1);
        expect(lexResult.tokens[0].tokenType).to.equal(Name);
    });
});
describe("the regExp analysis", function () {
    context("first codes", function () {
        it("can compute for string literal", function () {
            expect(reg_exp_1.getStartCodes(/"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/)).to.deep.equal([34]);
        });
        it("can compute with assertions", function () {
            expect(reg_exp_1.getStartCodes(/^$\b\Ba/)).to.deep.equal([97]);
        });
        it("can compute ranges", function () {
            expect(reg_exp_1.getStartCodes(/[\n-\r]/)).to.deep.equal([10, 11, 12, 13]);
        });
        it("can compute with optional quantifiers", function () {
            expect(reg_exp_1.getStartCodes(/b*a/)).to.deep.equal([98, 97]);
        });
        it("will not compute when using complements", function () {
            expect(reg_exp_1.getStartCodes(/\D/)).to.be.empty;
        });
        it("Can compute for ignore case", function () {
            expect(reg_exp_1.getStartCodes(/w|A/i)).to.deep.equal([119, 87, 65, 97]);
        });
        it("will not compute when using complements #2", function () {
            expect(reg_exp_1.getStartCodes(/[^a-z]/, true)).to.be.empty;
        });
    });
    context("can match charCode", function () {
        it("with simple character valid", function () {
            expect(reg_exp_1.canMatchCharCode([10, 13], /\n/)).to.be.true;
        });
        it("with simple character invalid", function () {
            expect(reg_exp_1.canMatchCharCode([10, 13], /a/)).to.be.false;
        });
        it("with range valid", function () {
            expect(reg_exp_1.canMatchCharCode([13], /[\n-a]/)).to.be.true;
        });
        it("with range invalid", function () {
            expect(reg_exp_1.canMatchCharCode([10, 13], /a-z/)).to.be.false;
        });
        it("with range complement valid", function () {
            expect(reg_exp_1.canMatchCharCode([13], /[^a]/)).to.be.true;
        });
        it("with range complement invalid", function () {
            expect(reg_exp_1.canMatchCharCode([13], /[^\r]/)).to.be.false;
        });
    });
});
//# sourceMappingURL=regexp_spec.js.map