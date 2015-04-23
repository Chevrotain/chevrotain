/// <reference path="../../../src/parse/grammar/lookahead.ts" />
/// <reference path="../../../src/parse/recognizer.ts" />
/// <reference path="samples.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />
/// <reference path="../../utils/matchers.ts" />

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

    class CommaParserMock extends recog.BaseRecognizer {
        protected NEXT_TOKEN():t.Token {
            return new samples.CommaTok(1, 1, ",")
        }
    }

    describe("The Grammar Lookahead model", function () {
        "use strict"

        it("can compute the lookahead function for the first OPTION in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForOption(1, "actionDec", samples.actionDec)

            expect(laFunc.call(new ColonParserMock())).toBe(false)
            expect(laFunc.call(new IdentParserMock())).toBe(true)
        })

        it("can compute the lookahead function for the second OPTION in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForOption(2, "actionDec", samples.actionDec)

            expect(laFunc.call(new ColonParserMock())).toBe(true)
            expect(laFunc.call(new IdentParserMock())).toBe(false)
        })

        it("can compute the lookahead function for the first MANY in ActionDec", function () {
            var laFunc = lookahead.buildLookaheadForMany(1, "actionDec", samples.actionDec)

            expect(laFunc.call(new CommaParserMock())).toBe(true)
            expect(laFunc.call(new IdentParserMock())).toBe(false)
        })
    })

}
