/// <reference path="Samples.ts" />
/// <reference path="../../../src/parse/grammar/Follow.ts" />
/// <reference path="../../../src/scan/Tokens.ts" />
/// <reference path="../../../src/parse/grammar/GAst.ts" />
/// <reference path="../../utils/Matchers.ts" />
/// <reference path="../../../libs/lodash.d.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />


module chevrotain.parse.grammar.follow.spec {

    import t = test.parser.grammar.samples;
    import gast = chevrotain.parse.grammar.gast;
    import samples = test.parser.grammar.samples;
    import matchers = test.matchers;

    describe("The Grammar Ast Follows model", function () {
        "use strict";

        it("can build a followNamePrefix from a Terminal", function () {
            var terminal = new gast.Terminal(t.IdentTok);
            var actual = buildInProdFollowPrefix(terminal);
            expect(actual).toBe("Ident1_IN_");

            var terminal2 = new gast.Terminal(t.EntityTok);
            terminal2.occurrenceInParent = 3;
            var actual2 = buildInProdFollowPrefix(terminal2);
            expect(actual2).toBe("Entity3_IN_");
        });

        it("can build a followName prefix from a TopLevel Production and index", function () {
            var prod = new gast.TOP_LEVEL("bamba", []);
            var index = 5;

            var actual = buildBetweenProdsFollowPrefix(prod, index);
            expect(actual).toBe("bamba5_IN_");
        });

        it("can compute the follows for Top level production ref in ActionDec", function () {
            var actual:any = new ResyncFollowsWalker(samples.actionDec).startWalking();
            var actualPairs = actual.entries();
            expect(actualPairs.length).toBe(3);
            expect(actual.get('ParamSpec1_IN_actionDec').length).toBe(2);
            matchers.arrayEqualityNoOrder(actual.get('ParamSpec1_IN_actionDec'), [t.CommaTok, t.RParenTok]);
            expect(actual.get('ParamSpec2_IN_actionDec').length).toBe(2);
            matchers.arrayEqualityNoOrder(actual.get('ParamSpec1_IN_actionDec'), [t.CommaTok, t.RParenTok]);
            expect(actual.get('qualifiedName1_IN_actionDec').length).toBe(1);
            matchers.arrayEqualityNoOrder(actual.get('qualifiedName1_IN_actionDec'), [t.SemicolonTok]);
        });

        it("can compute all follows for a set of top level productions", function () {
            var actual = computeAllProdsFollows([samples.actionDec]);
            expect(actual.entries().length).toBe(3);
        });


    });

}
