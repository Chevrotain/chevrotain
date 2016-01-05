namespace chevrotain.utils.spec {

    describe("The Utils functions namespace", () => {

        it("exports a last utility", () => {
            expect(last([1, 2, 3])).to.equal(3)
            expect(last([])).to.equal(undefined)
            expect(last(null)).to.equal(undefined)
        })

        it("exports a forEach utility", () => {
            forEach([1, 2, 3], (item, idx) => {
                expect(item).to.equal(idx + 1)
            })

            forEach(null, (item) => {
                throw Error("call back should not be invoked for none array")
            })

            forEach([], (item) => {
                throw Error("call back should not be invoked for empty array")
            })
        })
    })
}
