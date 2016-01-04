namespace chevrotain.utils.spec {

    describe("The Utils functions namespace", () => {

        it("exports a last utility", () => {
            expect(last([1, 2, 3])).to.equal(3)
            expect(last([])).to.equal(undefined)
            expect(last(null)).to.equal(undefined)
        })
    })

}
