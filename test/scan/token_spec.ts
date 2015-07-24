
namespace chevrotain.tokens.spec {

    import tok = chevrotain.tokens

    let TrueLiteral = extendToken("TrueLiteral")
    class FalseLiteral extends Token {}

    describe("The Chevrotain Tokens namespace", function () {
        "use strict"

        it("exports a utility function that returns a token's name", function () {
            // FalseLiteral was created with an anonymous function as its constructor yet tokenName(...)
            // should still work correctly on it if the 'tokenName' property has been set on its constructor.
            expect(tokenName(FalseLiteral)).to.equal("FalseLiteral")
            expect(tokenName(TrueLiteral)).to.equal("TrueLiteral")
        })

        let A = extendToken("A")
        let B = extendToken("B", A)
        B.GROUP = "Special"

        let C = extendToken("C", /\d+/, B)
        let D = extendToken("D", /\w+/, B)

        it("provides an extendToken utility - creating an instance", function () {
            let aInstance = new A("Hello", 0, 1, 1)
            expect(aInstance.image).to.equal("Hello")
            expect(aInstance.offset).to.equal(0)
            expect(aInstance.startLine).to.equal(1)
            expect(aInstance.endLine).to.equal(1)
            expect(aInstance.startColumn).to.equal(1)
            expect(aInstance.endColumn).to.equal(5)
        })

        it("provides an extendToken utility - creating a subclass instance", function () {
            let aInstance = new C("world", 0, 1, 1)
            expect(aInstance.image).to.equal("world")
            expect(aInstance.offset).to.equal(0)
            expect(aInstance.startLine).to.equal(1)
            expect(aInstance.endLine).to.equal(1)
            expect(aInstance.startColumn).to.equal(1)
            expect(aInstance.endColumn).to.equal(5)
        })

        it("provides an extendToken utility - inheritance chain", function () {
            let dInstance = new D("world", 0, 1, 1)
            expect(dInstance).to.be.an.instanceof(A)
            expect(dInstance).to.be.an.instanceof(B)
            expect(dInstance).not.to.be.an.instanceof(C)

            let cInstance = new C("666", 0, 1, 1)
            expect(cInstance).to.be.an.instanceof(A)
            expect(cInstance).to.be.an.instanceof(B)

            let bInstance = new B("666", 0, 1, 1)
            expect(bInstance).to.be.an.instanceof(A)
        })

        it("provides an extendToken utility - static properties inheritance", function () {
            expect(D.GROUP).to.equal("Special")
            expect(C.GROUP).to.equal("Special")
        })
    })
}
