
module chevrotain.follow.spec {

    import t = specs.samples
    import gast = chevrotain.gast
    import samples = specs.samples
    import matchers = specs.matchers

    describe("The Grammar Ast Follows model", function () {
        "use strict"

        it("can build a followNamePrefix from a Terminal", function () {
            let terminal = new gast.Terminal(t.IdentTok)
            let actual = buildInProdFollowPrefix(terminal)
            expect(actual).to.equal("IdentTok1_~IN~_")

            let terminal2 = new gast.Terminal(t.EntityTok)
            terminal2.occurrenceInParent = 3
            let actual2 = buildInProdFollowPrefix(terminal2)
            expect(actual2).to.equal("EntityTok3_~IN~_")
        })

        it("can build a followName prefix from a TopLevel Production and index", function () {
            let prod = new gast.Rule("bamba", [])
            let index = 5

            let actual = buildBetweenProdsFollowPrefix(prod, index)
            expect(actual).to.equal("bamba5_~IN~_")
        })

        it("can compute the follows for Top level production ref in ActionDec", function () {
            let actual:any = new ResyncFollowsWalker(samples.actionDec).startWalking()
            let actualFollowNames = actual.keys()
            expect(actualFollowNames.length).to.equal(3)
            expect(actual.get("paramSpec1_~IN~_actionDec").length).to.equal(2)
            matchers.setEquality(actual.get("paramSpec1_~IN~_actionDec"), [t.CommaTok, t.RParenTok])
            expect(actual.get("paramSpec2_~IN~_actionDec").length).to.equal(2)
            matchers.setEquality(actual.get("paramSpec1_~IN~_actionDec"), [t.CommaTok, t.RParenTok])
            expect(actual.get("qualifiedName1_~IN~_actionDec").length).to.equal(1)
            matchers.setEquality(actual.get("qualifiedName1_~IN~_actionDec"), [t.SemicolonTok])
        })

        it("can compute all follows for a set of top level productions", function () {
            let actual = computeAllProdsFollows([samples.actionDec])
            expect(actual.keys().length).to.equal(3)
        })


    })

}
