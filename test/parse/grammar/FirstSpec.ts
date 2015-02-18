/// <reference path="../../../src/parse/grammar/Follow.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />
/// <reference path="Samples.ts" />
/// <reference path="../../utils/Matchers.ts" />

module chevrotain.parse.grammar.first.spec {

    import t = test.parser.grammar.samples;
    import gast = chevrotain.parse.grammar.gast;
    import matchers = test.matchers;

    describe("The Grammar Ast first model", function () {
        "use strict";

        it("can compute the first for a terminal", function () {
            var terminal = new gast.Terminal(t.EntityTok);
            var actual = first(terminal);
            expect(actual.length).toBe(1);
            expect(actual[0]).toBe(t.EntityTok);

            var terminal2 = new gast.Terminal(t.CommaTok);
            var actual2 = first(terminal2);
            expect(actual2.length).toBe(1);
            expect(actual2[0]).toBe(t.CommaTok);
        });

        it("can compute the first for a Sequence production ", function () {
            var seqProduction = new gast.FLAT([new gast.Terminal(t.EntityTok)]);
            var actual = first(seqProduction);
            expect(actual.length).toBe(1);
            expect(actual[0]).toBe(t.EntityTok);

            var seqProduction2 = new gast.FLAT(
                [
                    new gast.Terminal(t.EntityTok),
                    new gast.OPTION([new gast.Terminal(t.NamespaceTok)])
                ]);
            var actual2 = first(seqProduction2);
            expect(actual2.length).toBe(1);
            expect(actual2[0]).toBe(t.EntityTok);
        });

        it("can compute the first for an alternatives production ", function () {
            var altProduction = new gast.OR(
                [
                    new gast.Terminal(t.EntityTok),
                    new gast.Terminal(t.NamespaceTok),
                    new gast.Terminal(t.TypeTok)

                ]);
            var actual = first(altProduction);
            expect(actual.length).toBe(3);
            expect(actual[0]).toBe(t.EntityTok);
            expect(actual[1]).toBe(t.NamespaceTok);
            expect(actual[2]).toBe(t.TypeTok);

        });

        it("can compute the first for an production with optional prefix", function () {
            var withOptionalPrefix = new gast.FLAT(
                [
                    new gast.OPTION([new gast.Terminal(t.NamespaceTok)]),
                    new gast.Terminal(t.EntityTok)
                ]);
            var actual = first(withOptionalPrefix);
            matchers.arrayEqualityNoOrder(actual, [t.NamespaceTok, t.EntityTok]);


            var withTwoOptPrefix = new gast.FLAT(
                [
                    new gast.OPTION([new gast.Terminal(t.NamespaceTok)]),
                    new gast.OPTION([new gast.Terminal(t.ColonTok)]),
                    new gast.Terminal(t.EntityTok),
                    new gast.OPTION([new gast.Terminal(t.ConstTok)])
                ]);
            var actual2 = first(withTwoOptPrefix);
            matchers.arrayEqualityNoOrder(actual2, [t.NamespaceTok, t.ColonTok, t.EntityTok]);
        });

    });

}
