/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.tokens.spec {

    import tok = chevrotain.tokens

    // javascript inheritance using object.create
    function extendToken(className:string) {
        var childConstructor:any = function (line, column, image) {
            Token.call(this, line, column, image);
        };
        childConstructor.tokenName = className;
        childConstructor.prototype = Object.create(Token.prototype);
        childConstructor.prototype.constructor = childConstructor;
        return childConstructor;
    }

    var TrueLiteral = extendToken("TrueLiteral");
    class FalseLiteral extends tok.Token {}


    describe("The Chevrotain Tokens module", function () {
        "use strict"

        it("exports a utility function that returns a token's name", function () {
            // FalseLiteral was created with an annonymus function as its constructor yet tokenName(...)
            // should still work correctly on it if the 'tokenName' property has been set on its constructor.
            expect(tokenName(FalseLiteral)).toBe("FalseLiteral")
            expect(tokenName(TrueLiteral)).toBe("TrueLiteral")
        })

    })
}
