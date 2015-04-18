/// <reference path="../../../src/parse/grammar/Lookahead.ts" />
/// <reference path="../../../src/parse/Recognizer.ts" />
/// <reference path="Samples.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />
/// <reference path="../../utils/Matchers.ts" />

module chevrotain.lookahead.spec {

    import recog = chevrotain.recognizer
    import samples = test.samples
    import lookahead = chevrotain.lookahead
    import matchers = test.matchers
    import t = chevrotain.tokens

    class ColonParserMock extends recog.BaseRecognizer {
        protected NEXT_TOKEN():t.Token {
            return new samples.ColonTok(1, 1, ":")
        }
    }

    class IdentParserMock extends recog.BaseRecognizer {
        protected NEXT_TOKEN():t.Token {
            return new samples.IdentTok(1, 1, "bamba")
        }
    }

    describe("The Grammar Lookahead model", function () {
        "use strict"

        it("can compute the lookahead function for the first Option in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForOption(1, "actionDec", samples.actionDec)

            expect(laFunc.call(new ColonParserMock())).toBe(false)
            expect(laFunc.call(new IdentParserMock())).toBe(true)
        })

        it("can compute the lookahead function for the second Option in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForOption(2, "actionDec", samples.actionDec)

            expect(laFunc.call(new ColonParserMock())).toBe(true)
            expect(laFunc.call(new IdentParserMock())).toBe(false)
        })
    })

}
