"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tokens_public_1 = require("../../src/scan/tokens_public");
var exceptions_public_1 = require("../../src/parse/exceptions_public");
var lang_extensions_1 = require("../../src/lang/lang_extensions");
describe("Chevrotain's Parsing Exceptions", function () {
    describe("the mappings between a an exception instance and its matching an exception's name for: ", function () {
        var isRunningInNodeJS = module && module.exports;
        var it_node = isRunningInNodeJS ? it : it.skip;
        var dummyToken = tokens_public_1.createTokenInstance(tokens_public_1.EOF, "", -1, -1, -1, -1, -1, -1);
        it_node("EarlyExitException", function () {
            var exceptionInstance = new exceptions_public_1.EarlyExitException("", dummyToken, dummyToken);
            expect(exceptionInstance.name).to.equal(lang_extensions_1.functionName(exceptionInstance));
        });
        it_node("NoViableAltException", function () {
            var exceptionInstance = new exceptions_public_1.NoViableAltException("", dummyToken, dummyToken);
            expect(exceptionInstance.name).to.equal(lang_extensions_1.functionName(exceptionInstance));
        });
        it_node("NotAllInputParsedException", function () {
            var exceptionInstance = new exceptions_public_1.NotAllInputParsedException("", dummyToken);
            expect(exceptionInstance.name).to.equal(lang_extensions_1.functionName(exceptionInstance));
        });
        it_node("MismatchedTokenException", function () {
            var exceptionInstance = new exceptions_public_1.MismatchedTokenException("", dummyToken, dummyToken);
            expect(exceptionInstance.name).to.equal(lang_extensions_1.functionName(exceptionInstance));
        });
    });
});
//# sourceMappingURL=exceptions_spec.js.map