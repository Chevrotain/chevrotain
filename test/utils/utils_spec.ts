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

        it("exports a reject utility", () => {
            expect(reject([], (item) => {return true})).to.deep.equal([])
            expect(reject([1, 2, 3], (item) => {return false})).to.deep.equal([1, 2, 3])
            expect(reject([1, 2, 3], (item) => {return true})).to.deep.equal([])
            expect(reject([1, 2, 3], (item) => {return item % 2 === 0})).to.deep.equal([1, 3])
            expect(reject([1, 2, 3], (item) => {return item % 2 === 1})).to.deep.equal([2])
            expect(reject(null, (item) => {return item % 2 === 1})).to.deep.equal([])
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

        it("exports a cloneArr utility", () => {
            expect(cloneArr([1, 2, 3])).to.deep.equal([1, 2, 3])
            expect(cloneArr([])).to.deep.equal([])
            let arr = []
            expect(cloneArr(arr)).to.not.equal(arr)
        })

        it("exports a cloneObj utility", () => {
            expect(cloneObj({bamba: 666, bisli: 777})).to.deep.equal({bamba: 666, bisli: 777})
            let obj = {bamba: 666, bisli: 777}
            expect(cloneObj(obj)).to.not.equal(obj)
            expect(cloneObj(["bamba"])).to.not.have.property("length")
            expect(cloneObj(["bamba"])).to.deep.equal({"0": "bamba"})
        })

        it("exports a find utility", () => {
            expect(find([1, 2, 3], (item) => item === 2)).to.equal(2)
            expect(find([], (item) => item === 2)).to.be.undefined
            let a = {}
            let b = {}
            expect(find([a, b], (item) => item === b)).to.equal(b)
        })

        it("exports a reduce utility", () => {
            expect(reduce([1, 2, 3], (result, item) => {
                return result.concat([item * 2])
            }, [])).to.deep.equal([2, 4, 6])

            expect(reduce({one: 1, two: 2, three: 3}, (result, item) => {
                return result.concat([item * 2])
            }, [])).to.deep.equal([2, 4, 6])
        })

        it("exports a compact utility", () => {
            expect(compact([1, 2, null, 3])).to.deep.equal([1, 2, 3])
            expect(compact([1, undefined, 2, 3])).to.deep.equal([1, 2, 3])
            expect(compact([])).to.deep.equal([])
            expect(compact([1, 2, 3])).to.deep.equal([1, 2, 3])
        })

        it("exports a uniq utility", () => {
            expect(uniq([1, 2, 3, 2])).to.contain.members([1, 2, 3])
            expect(uniq([2, 2, 4, 2], (item) => { return 666 })).to.have.length(1)
            expect(uniq([])).to.deep.equal([])
        })

        it("exports a pick utility", () => {
            expect(pick({bamba: true, bisli: false}, (item) => item)).to.deep.equal({bamba: true})
            expect(pick({}, (item) => item)).to.be.empty
        })

        it("exports a partial utility", () => {
            let add = function (x, y) {
                return x + y
            }
            expect(partial(add)(2, 3)).to.equal(5)
            expect(partial(add, 2)(3)).to.equal(5)
            expect(partial(add, 2, 3)()).to.equal(5)
        })

        it("exports an every utility", () => {
            expect(every([], (item) => {return true})).to.be.true
            // empty set always true...
            expect(every([], (item) => {return false})).to.be.true
            expect(every([1, 2, 3], (item) => {return item % 2 === 0})).to.be.false
            expect(every([2, 4, 6], (item) => {return item % 2 === 0})).to.be.true
        })
    })
}

