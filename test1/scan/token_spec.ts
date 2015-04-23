/// <reference path="../../src1/scan/tokens.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.tokens.spec {

    describe("The Chevrotain Tokens module", function () {
        "use strict"

        it("exports a None token singleton which always returns the same instance from getInstance", function () {
            var noneToken1 = NoneToken.getInstance();
            var noneToken2 = NoneToken.getInstance();
            expect(noneToken1).toBe(noneToken2);
        })

        it("exports a None token singleton which can't be initialized twice", function () {
            var noneToken1 = NoneToken.getInstance();
            expect(() => { return new NoneToken() }).toThrow((new Error("can't create two instances of a singleton!")))
        })

        it("exports a utility method to initialize a NoneToken", function () {
            var noneToken1 = NONE_TOKEN();
            var noneToken2 = NoneToken.getInstance()
            expect(noneToken1).toBe(noneToken2);
        })

    })
}
