
module chevrotain.lookahead.spec {

    import samples = specs.samples
    import lookahead = chevrotain.lookahead
    import matchers = specs.matchers

    class ColonParserMock extends Parser {
        protected NEXT_TOKEN():Token {
            return new samples.ColonTok(":", 0, 1, 1)
        }
    }

    class IdentParserMock extends Parser {
        protected NEXT_TOKEN():Token {
            return new samples.IdentTok("bamba", 0, 1, 1)
        }
    }

    class CommaParserMock extends Parser {
        protected NEXT_TOKEN():Token {
            return new samples.CommaTok(",", 0, 1, 1)
        }
    }

    class EntityParserMock extends Parser {
        protected NEXT_TOKEN():Token {
            return new samples.EntityTok(",", 0, 1, 1)
        }
    }

    class KeyParserMock extends Parser {
        protected NEXT_TOKEN():Token {
            return new samples.KeyTok(",", 0, 1, 1)
        }
    }

    class ActionParserMock extends Parser {
        protected NEXT_TOKEN():Token {
            return new samples.ActionTok(",", 0, 1, 1)
        }
    }


    describe("The Grammar Lookahead module", function () {
        "use strict"

        it("can compute the lookahead function for the first OPTION in ActionDec", function () {
            let laFunc = lookahead.buildLookaheadForOption(1, samples.actionDec)

            expect(laFunc.call(new ColonParserMock([], []))).to.equal(false)
            expect(laFunc.call(new IdentParserMock([], []))).to.equal(true)
        })

        it("can compute the lookahead function for the second OPTION in ActionDec", function () {
            let laFunc = lookahead.buildLookaheadForOption(2, samples.actionDec)

            expect(laFunc.call(new ColonParserMock([], []))).to.equal(true)
            expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
        })

        it("can compute the lookahead function for the first MANY in ActionDec", function () {
            let laFunc = lookahead.buildLookaheadForMany(1, samples.actionDec)

            expect(laFunc.call(new CommaParserMock([], []))).to.equal(true)
            expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
        })

        it("can compute the lookahead function for the first MANY in ActionDec", function () {
            let laFunc = lookahead.buildLookaheadForOr(1, samples.lotsOfOrs)

            expect(laFunc.call(new CommaParserMock([], []))).to.equal(0)
            expect(laFunc.call(new KeyParserMock([], []))).to.equal(0)
            expect(laFunc.call(new EntityParserMock([], []))).to.equal(1)
            expect(laFunc.call(new ColonParserMock([], []))).to.equal(-1)
        })

        it("can compute the lookahead function for a Top Level Rule", function () {
            let laFunc = lookahead.buildLookaheadForTopLevel(samples.actionDec)

            expect(laFunc.call(new ActionParserMock([], []))).to.equal(true)
            expect(laFunc.call(new IdentParserMock([], []))).to.equal(false)
        })

        it("can compute the lookahead function for a Top Level Rule #2", function () {
            let laFunc = lookahead.buildLookaheadForTopLevel(samples.lotsOfOrs)

            expect(laFunc.call(new CommaParserMock([], []))).to.equal(true)
            expect(laFunc.call(new EntityParserMock([], []))).to.equal(true)
            expect(laFunc.call(new KeyParserMock([], []))).to.equal(true)
            expect(laFunc.call(new ActionParserMock([], []))).to.equal(false)
        })
    })


    class A extends Token {}
    class B extends Token {}
    class C extends Token {}
    class D extends Token {}
    class E extends Token {}

    describe("The Grammar Lookahead module", function () {
        "use strict"

        it("can detect ambiguities when calculating lookahead functions for OR alternatives", function () {
            let input = [[A, B], [C, D], [E, C]]
            let ambiguities = lookahead.checkAlternativesAmbiguities(input)
            expect(ambiguities.length).to.equal(1)
            expect(ambiguities[0].alts).to.deep.equal([2, 3])
        })
    })


}
