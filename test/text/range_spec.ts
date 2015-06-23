
module chevrotain.range.spec {


    describe("The Chevrotain Range module", function () {

        it("an invalid range can not be created", function () {
            expect(() => { return new Range(5, 1)}).toThrow(new Error("INVALID RANGE"))
            expect(() => { return new Range(-1, 2)}).toThrow(new Error("INVALID RANGE"))
        })


        it("can check if a number is contained in a give range", function () {
            var r = new Range(90, 110)
            expect(r.contains(-4)).toBe(false)
            expect(r.contains(30)).toBe(false)
            expect(r.contains(89)).toBe(false)
            expect(r.contains(90)).toBe(true)
            expect(r.contains(99)).toBe(true)
            expect(r.contains(105)).toBe(true)
            expect(r.contains(110)).toBe(true)
            expect(r.contains(111)).toBe(false)
            expect(r.contains(999)).toBe(false)
        })

        it("can check if it is contained in another range", function () {
            var _10_50 = new Range(10, 50)
            var _1_6 = new Range(1, 6)
            var _5_15 = new Range(5, 15)
            var _20_35 = new Range(20, 35)
            var _45_55 = new Range(45, 55)
            var _51_100 = new Range(51, 100)

            expect(_1_6.isContainedInRange(_10_50)).toBe(false)
            expect(_5_15.isContainedInRange(_10_50)).toBe(false)
            expect(_20_35.isContainedInRange(_10_50)).toBe(true)
            expect(_10_50.isContainedInRange(_10_50)).toBe(true)
            expect(_45_55.isContainedInRange(_10_50)).toBe(false)
            expect(_51_100.isContainedInRange(_10_50)).toBe(false)
        })

        it("can check if it is strictly contained in another range", function () {
            var _10_50 = new Range(10, 50)

            var _1_6 = new Range(1, 6)
            var _10_11 = new Range(10, 11)
            var _5_15 = new Range(5, 15)
            var _20_35 = new Range(20, 35)
            var _45_55 = new Range(45, 55)
            var _49_50 = new Range(49, 50)
            var _51_100 = new Range(51, 100)

            expect(_1_6.isStrictlyContainedInRange(_10_50)).toBe(false)
            expect(_10_11.isStrictlyContainedInRange(_10_50)).toBe(false)
            expect(_5_15.isStrictlyContainedInRange(_10_50)).toBe(false)
            expect(_20_35.isStrictlyContainedInRange(_10_50)).toBe(true)
            expect(_10_50.isStrictlyContainedInRange(_10_50)).toBe(false)
            expect(_45_55.isStrictlyContainedInRange(_10_50)).toBe(false)
            expect(_49_50.isStrictlyContainedInRange(_10_50)).toBe(false)
            expect(_51_100.isStrictlyContainedInRange(_10_50)).toBe(false)
        })


    })
}
