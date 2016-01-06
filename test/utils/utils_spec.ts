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

        it("exports a isString utility", () => {
            expect(isString("")).to.be.true
            expect(isString("bamba")).to.be.true
            expect(isString(66)).to.be.false
            expect(isString(null)).to.be.false
        })

        it("exports a drop utility", () => {
            expect(drop([])).to.deep.equal([])
            expect(drop([1, 2, 3])).to.deep.equal([2, 3])
            expect(drop([1, 2, 3], 2)).to.deep.equal([3])
            expect(drop([1, 2, 3], 3)).to.deep.equal([])
        })

        it("exports a dropRight utility", () => {
            expect(dropRight([])).to.deep.equal([])
            expect(dropRight([1, 2, 3])).to.deep.equal([1, 2])
            expect(dropRight([1, 2, 3], 2)).to.deep.equal([1])
            expect(dropRight([1, 2, 3], 3)).to.deep.equal([])
        })

        it("exports a filter utility", () => {
            expect(filter([], (item) => {return true})).to.deep.equal([])
            expect(filter([1, 2, 3], (item) => {return true})).to.deep.equal([1, 2, 3])
            expect(filter([1, 2, 3], (item) => {return false})).to.deep.equal([])
            expect(filter([1, 2, 3], (item) => {return item % 2 === 0})).to.deep.equal([2])
            expect(filter([1, 2, 3], (item) => {return item % 2 === 1})).to.deep.equal([1, 3])
            expect(filter(null, (item) => {return item % 2 === 1})).to.deep.equal([])
        })

        it("exports a has utility", () => {
            expect(has([1, 2, 3], "0")).to.be.true
            expect(has([1, 2, 3], "5")).to.be.false
            expect(has({}, "bamba")).to.be.false
            expect(has({bamba: 666}, "bamba")).to.be.true
        })

        it("exports a contains utility", () => {
            expect(contains([1, 2, 3], 4)).to.be.false
            expect(contains([1, 2, 3], 2)).to.be.true
            expect(contains([], 2)).to.be.false
        })

    })
}
