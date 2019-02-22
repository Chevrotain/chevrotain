"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tokens_public_1 = require("../../src/scan/tokens_public");
var lexer_public_1 = require("../../src/scan/lexer_public");
var tokens_public_2 = require("../../src/scan/tokens_public");
var tokens_1 = require("../../src/scan/tokens");
describe("The Chevrotain Tokens namespace", function () {
    context("createToken", function () {
        var TrueLiteral = tokens_public_1.createToken({ name: "TrueLiteral" });
        var FalseLiteral = /** @class */ (function () {
            function FalseLiteral() {
            }
            return FalseLiteral;
        }());
        it("exports a utility function that returns a token's name", function () {
            // FalseLiteral was created with an anonymous function as its constructor yet tokenName(...)
            // should still work correctly on it if the 'tokenName' property has been set on its constructor.
            expect(tokens_public_1.tokenName(FalseLiteral)).to.equal("FalseLiteral");
            expect(tokens_public_1.tokenName(TrueLiteral)).to.equal("TrueLiteral");
        });
        var A = tokens_public_1.createToken({ name: "A" });
        var B = tokens_public_1.createToken({ name: "B", categories: A });
        B.GROUP = "Special";
        var C = tokens_public_1.createToken({
            name: "C",
            pattern: /\d+/,
            categories: B
        });
        var D = tokens_public_1.createToken({
            name: "D",
            pattern: /\w+/,
            categories: B
        });
        var Plus = tokens_public_1.createToken({ name: "Plus", pattern: /\+/ });
        Plus.LABEL = "+";
        it("provides an createTokenInstance utility - creating an instance", function () {
            var aInstance = tokens_public_2.createTokenInstance(A, "Hello", 0, 4, 1, 1, 1, 5);
            expect(aInstance.image).to.equal("Hello");
            expect(aInstance.startOffset).to.equal(0);
            expect(aInstance.endOffset).to.equal(4);
            expect(aInstance.startLine).to.equal(1);
            expect(aInstance.endLine).to.equal(1);
            expect(aInstance.startColumn).to.equal(1);
            expect(aInstance.endColumn).to.equal(5);
        });
        it("provides an extendToken utility - creating a subclass instance", function () {
            var aInstance = tokens_public_2.createTokenInstance(A, "World", 0, 4, 1, 1, 1, 5);
            expect(aInstance.image).to.equal("World");
            expect(aInstance.startOffset).to.equal(0);
            expect(aInstance.endOffset).to.equal(4);
            expect(aInstance.startLine).to.equal(1);
            expect(aInstance.endLine).to.equal(1);
            expect(aInstance.startColumn).to.equal(1);
            expect(aInstance.endColumn).to.equal(5);
        });
        it("Allows customization of the label", function () {
            // Default to class name
            expect(tokens_public_1.tokenLabel(B)).to.equal("B");
            // Unless there's a LABEL property
            expect(tokens_public_1.tokenLabel(Plus)).to.equal("+");
        });
        it("provides a utility to verify if a token instance matches a Token Type", function () {
            var ATokRegular = tokens_public_1.createToken({
                name: "ATokRegular"
            });
            var BTokRegular = tokens_public_1.createToken({
                name: "BTokRegular"
            });
            var AInstanceRegular = tokens_public_2.createTokenInstance(ATokRegular, "a", -1, -1, -1, -1, -1, -1);
            var BInstanceRegular = tokens_public_2.createTokenInstance(BTokRegular, "b", -1, -1, -1, -1, -1, -1);
            expect(tokens_public_1.tokenMatcher(AInstanceRegular, ATokRegular)).to.be.true;
            expect(tokens_public_1.tokenMatcher(AInstanceRegular, BTokRegular)).to.be.false;
            expect(tokens_public_1.tokenMatcher(BInstanceRegular, BTokRegular)).to.be.true;
            expect(tokens_public_1.tokenMatcher(BInstanceRegular, ATokRegular)).to.be.false;
        });
        it("Will augment Token Constructors with additional metadata basic", function () {
            var A = tokens_public_1.createToken({ name: "A" });
            var B = tokens_public_1.createToken({ name: "B" });
            expect(A.tokenTypeIdx).to.be.greaterThan(0);
            expect(B.tokenTypeIdx).to.be.greaterThan(A.tokenTypeIdx);
            expect(A.categoryMatches).to.be.an.instanceOf(Array);
            expect(A.categoryMatches).to.be.empty;
            expect(B.categoryMatches).to.be.an.instanceOf(Array);
            expect(B.categoryMatches).to.be.empty;
        });
        it("can define a token Label via the createToken utilities", function () {
            var A = tokens_public_1.createToken({
                name: "A",
                label: "bamba"
            });
            expect(tokens_public_1.tokenLabel(A)).to.equal("bamba");
        });
        it("can define a POP_MODE via the createToken utilities", function () {
            var A = tokens_public_1.createToken({
                name: "A",
                pop_mode: true
            });
            expect(A).to.haveOwnProperty("POP_MODE");
            expect(A.POP_MODE).to.be.true;
        });
        it("can define a PUSH_MODE via the createToken utilities", function () {
            var A = tokens_public_1.createToken({
                name: "A",
                push_mode: "attribute"
            });
            expect(A).to.haveOwnProperty("PUSH_MODE");
            expect(A.PUSH_MODE).to.equal("attribute");
        });
        it("can define a LONGER_ALT via the createToken utilities", function () {
            var A = tokens_public_1.createToken({ name: "A" });
            var B = tokens_public_1.createToken({ name: "B", longer_alt: A });
            expect(B).to.haveOwnProperty("LONGER_ALT");
            expect(B.LONGER_ALT).to.equal(A);
        });
        it("can define a token group via the createToken utilities", function () {
            var A = tokens_public_1.createToken({
                name: "A",
                group: lexer_public_1.Lexer.SKIPPED
            });
            expect(A).to.haveOwnProperty("GROUP");
            expect(A.GROUP).to.equal(lexer_public_1.Lexer.SKIPPED);
        });
        it("Will throw when using the deprecated parent flag", function () {
            expect(function () {
                return tokens_public_1.createToken({
                    name: "A",
                    parent: "oops"
                });
            }).to.throw("The parent property is no longer supported");
        });
        it("will not go into infinite loop due to cyclic categories", function () {
            var A = tokens_public_1.createToken({ name: "A" });
            var B = tokens_public_1.createToken({ name: "B", categories: [A] });
            tokens_1.singleAssignCategoriesToksMap([A], B);
        });
    });
});
//# sourceMappingURL=token_spec.js.map