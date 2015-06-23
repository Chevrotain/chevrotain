/// <reference path="../../../src/parse/grammar/lookahead.ts" />
/// <reference path="../../../src/parse/recognizer.ts" />
/// <reference path="samples.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />
/// <reference path="../../utils/matchers.ts" />

module chevrotain.lookahead.spec {

    import samples = test.samples
    import lookahead = chevrotain.lookahead
    import matchers = test.matchers

    class ColonParserMock extends BaseRecognizer {
        protected NEXT_TOKEN():Token {
            return new samples.ColonTok(":", 0, 1, 1)
        }
    }

    class IdentParserMock extends BaseRecognizer {
        protected NEXT_TOKEN():Token {
            return new samples.IdentTok("bamba", 0, 1, 1)
        }
    }

    class CommaParserMock extends BaseRecognizer {
        protected NEXT_TOKEN():Token {
            return new samples.CommaTok(",", 0, 1, 1)
        }
    }

    class EntityParserMock extends BaseRecognizer {
        protected NEXT_TOKEN():Token {
            return new samples.EntityTok(",", 0, 1, 1)
        }
    }

    class KeyParserMock extends BaseRecognizer {
        protected NEXT_TOKEN():Token {
            return new samples.KeyTok(",", 0, 1, 1)
        }
    }

    class ActionParserMock extends BaseRecognizer {
        protected NEXT_TOKEN():Token {
            return new samples.ActionTok(",", 0, 1, 1)
        }
    }


    describe("The Grammar Lookahead module", function () {
        "use strict"

        it("can compute the lookahead function for the first OPTION in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForOption(1, samples.actionDec)

            expect(laFunc.call(new ColonParserMock())).toBe(false)
            expect(laFunc.call(new IdentParserMock())).toBe(true)
        })

        it("can compute the lookahead function for the second OPTION in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForOption(2, samples.actionDec)

            expect(laFunc.call(new ColonParserMock())).toBe(true)
            expect(laFunc.call(new IdentParserMock())).toBe(false)
        })

        it("can compute the lookahead function for the first MANY in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForMany(1, samples.actionDec)

            expect(laFunc.call(new CommaParserMock())).toBe(true)
            expect(laFunc.call(new IdentParserMock())).toBe(false)
        })

        it("can compute the lookahead function for the first MANY in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForOr(1, samples.lotsOfOrs)

            expect(laFunc.call(new CommaParserMock())).toBe(0)
            expect(laFunc.call(new KeyParserMock())).toBe(0)
            expect(laFunc.call(new EntityParserMock())).toBe(1)
            expect(laFunc.call(new ColonParserMock())).toBe(-1)
        })

        it("can compute the lookahead function for a Top Level Rule", function () {
            var laFunc = lookahead.buildLookaheadForTopLevel(samples.actionDec)

            expect(laFunc.call(new ActionParserMock())).toBe(true)
            expect(laFunc.call(new IdentParserMock())).toBe(false)
        })

        it("can compute the lookahead function for a Top Level Rule #2", function () {
            var laFunc = lookahead.buildLookaheadForTopLevel(samples.lotsOfOrs)

            expect(laFunc.call(new CommaParserMock())).toBe(true)
            expect(laFunc.call(new EntityParserMock())).toBe(true)
            expect(laFunc.call(new KeyParserMock())).toBe(true)
            expect(laFunc.call(new ActionParserMock())).toBe(false)
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
            var input = [[A, B], [C, D], [E, C]]
            var ambiguities = lookahead.checkAlternativesAmbiguities(input)
            expect(ambiguities.length).toBe(1)
            expect(ambiguities[0].alts).toEqual([2, 3])
        })
    })


}
