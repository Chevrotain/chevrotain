
module chevrotain.gastBuilder.spec {

    import pt = chevrotain.tree
    import tok = chevrotain.tokens

    class BambaTok extends VirtualToken {}
    class BisliTok extends Token {}

    describe("The ParseTree module", function () {

        it("exposes a constructor and three getters accessing the internal token", function () {
            var ptInstance = new pt.ParseTree(new VirtualToken())
            expect(ptInstance.getImage()).toBe("")
            expect(ptInstance.getColumn()).toBe(-1)
            expect(ptInstance.getLine()).toBe(-1)
        })

        it("exposes a factory method that helps create ParseTree", function () {
            var bambaPt = pt.PT(BambaTok)
            expect(bambaPt.payload).toEqual(jasmine.any(BambaTok))

            var bisliPt = pt.PT(new BisliTok("bisli", 0, 1, 1), [bambaPt])
            expect(bisliPt.children.length).toBe(1)
            expect(bisliPt.children[0]).toBe(bambaPt)
            expect(bisliPt.payload.image).toBe("bisli")
            expect(bisliPt.payload.startLine).toBe(1)
            expect(bisliPt.payload.startColumn).toBe(1)
            expect(bisliPt.payload).toEqual(jasmine.any(BisliTok))

            expect(pt.PT(null)).toBe(null)
            expect(pt.PT(undefined)).toBe(null)

            expect(() => pt.PT(<any>666)).toThrow()
        })

    })
}
