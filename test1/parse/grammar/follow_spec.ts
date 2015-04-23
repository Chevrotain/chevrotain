/// <reference path="samples.ts" />
/// <reference path="../../../src1/parse/grammar/follow.ts" />
/// <reference path="../../../src1/scan/tokens.ts" />
/// <reference path="../../../src1/parse/grammar/gast.ts" />
/// <reference path="../../utils/matchers.ts" />
/// <reference path="../../../libs/lodash.d.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />


module chevrotain.follow.spec {

    import t = test.samples
    import gast = chevrotain.gast
    import samples = test.samples
    import matchers = test.matchers

    describe("The Grammar Ast Follows model", function () {
        "use strict"

        it("can build a followNamePrefix from a Terminal", function () {
            var terminal = new gast.Terminal(t.IdentTok)
            var actual = buildInProdFollowPrefix(terminal)
            expect(actual).toBe("Ident1_IN_")

            var terminal2 = new gast.Terminal(t.EntityTok)
            terminal2.occurrenceInParent = 3
            var actual2 = buildInProdFollowPrefix(terminal2)
            expect(actual2).toBe("Entity3_IN_")
        })

        it("can build a followName prefix from a TopLevel Production and index", function () {
            var prod = new gast.TOP_LEVEL("bamba", [])
            var index = 5

            var actual = buildBetweenProdsFollowPrefix(prod, index)
            expect(actual).toBe("bamba5_IN_")
        })

        it("can compute the follows for Top level production ref in ActionDec", function () {
            var actual:any = new ResyncFollowsWalker(samples.actionDec).startWalking()
            var actualFollowNames = actual.keys()
            expect(actualFollowNames.length).toBe(3)
            expect(actual.get("paramSpec1_IN_actionDec").length).toBe(2)
            matchers.arrayEqualityNoOrder(actual.get("paramSpec1_IN_actionDec"), [t.CommaTok, t.RParenTok])
            expect(actual.get("paramSpec2_IN_actionDec").length).toBe(2)
            matchers.arrayEqualityNoOrder(actual.get("paramSpec1_IN_actionDec"), [t.CommaTok, t.RParenTok])
            expect(actual.get("qualifiedName1_IN_actionDec").length).toBe(1)
            matchers.arrayEqualityNoOrder(actual.get("qualifiedName1_IN_actionDec"), [t.SemicolonTok])
        })

        it("can compute all follows for a set of top level productions", function () {
            var actual = computeAllProdsFollows([samples.actionDec])
            expect(actual.keys().length).toBe(3)
        })


    })

}
