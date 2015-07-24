
namespace chevrotain.gastBuilder.spec {

    import pt = chevrotain.tree
    import tok = chevrotain.tokens

    class BambaTok extends VirtualToken {}
    class BisliTok extends Token {}

    describe("The ParseTree namespace", function () {

        it("exposes a constructor and three getters accessing the internal token", function () {
            let ptInstance = new pt.ParseTree(new VirtualToken())
            expect(ptInstance.getImage()).to.equal("")
            expect(ptInstance.getColumn()).to.equal(-1)
            expect(ptInstance.getLine()).to.equal(-1)
        })

        it("exposes a factory method that helps create ParseTree", function () {
            let bambaPt = pt.PT(BambaTok)
            expect(bambaPt.payload).to.be.an.instanceof(BambaTok)

            let bisliPt = pt.PT(new BisliTok("bisli", 0, 1, 1), [bambaPt])
            expect(bisliPt.children.length).to.equal(1)
            expect(bisliPt.children[0]).to.equal(bambaPt)
            expect(bisliPt.payload.image).to.equal("bisli")
            expect(bisliPt.payload.startLine).to.equal(1)
            expect(bisliPt.payload.startColumn).to.equal(1)
            expect(bisliPt.payload).to.be.an.instanceof(BisliTok)

            expect(pt.PT(null)).to.equal(null)
            expect(pt.PT(undefined)).to.equal(null)

            expect(() => pt.PT(<any>666)).to.throw()
        })

    })
}
