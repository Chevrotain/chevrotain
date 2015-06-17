/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.tokens.spec {

    import tok = chevrotain.tokens

    var TrueLiteral = tok.extendToken("TrueLiteral");
    class FalseLiteral extends tok.Token {}

    describe("The Chevrotain Tokens module", function () {
        "use strict"

        it("exports a utility function that returns a token's name", function () {
            // FalseLiteral was created with an anonymous function as its constructor yet tokenName(...)
            // should still work correctly on it if the 'tokenName' property has been set on its constructor.
            expect(tokenName(FalseLiteral)).toBe("FalseLiteral")
            expect(tokenName(TrueLiteral)).toBe("TrueLiteral")
        })


        var A = tok.extendToken("A")
        var B = tok.extendToken("B", A)
        B.GROUP = "Special"

        var C = tok.extendToken("C", /\d+/, B)
        var D = tok.extendToken("D", /\w+/, B)

        it("provides an extendToken utility - creating an instance", function () {
            var aInstance = new A("Hello", 0, 1, 1)
            expect(aInstance.image).toBe("Hello")
            expect(aInstance.offset).toBe(0)
            expect(aInstance.startLine).toBe(1)
            expect(aInstance.endLine).toBe(1)
            expect(aInstance.startColumn).toBe(1)
            expect(aInstance.endColumn).toBe(5)
        })

        it("provides an extendToken utility - creating a subclass instance", function () {
            var aInstance = new C("world", 0, 1, 1)
            expect(aInstance.image).toBe("world")
            expect(aInstance.offset).toBe(0)
            expect(aInstance.startLine).toBe(1)
            expect(aInstance.endLine).toBe(1)
            expect(aInstance.startColumn).toBe(1)
            expect(aInstance.endColumn).toBe(5)
        })

        it("provides an extendToken utility - inheritance chain", function () {
            var dInstance = new D("world", 0, 1, 1)
            expect(dInstance).toEqual(jasmine.any(A))
            expect(dInstance).toEqual(jasmine.any(B))
            expect(dInstance).not.toEqual(jasmine.any(C))

            var cInstance = new C("666", 0, 1, 1)
            expect(cInstance).toEqual(jasmine.any(A))
            expect(cInstance).toEqual(jasmine.any(B))

            var bInstance = new B("666", 0, 1, 1)
            expect(bInstance).toEqual(jasmine.any(A))
        })

        it("provides an extendToken utility - static properties inheritance", function () {
            expect(D.GROUP).toBe("Special")
            expect(C.GROUP).toBe("Special")
        })
    })
}
