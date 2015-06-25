
module chevrotain.first.spec {

    import t = test.samples
    import gast = chevrotain.gast
    import matchers = test.matchers

    describe("The Grammar Ast first model", function () {
        "use strict"

        it("can compute the first for a terminal", function () {
            var terminal = new gast.Terminal(t.EntityTok)
            var actual = first(terminal)
            expect(actual.length).to.equal(1)
            expect(actual[0]).to.equal(t.EntityTok)

            var terminal2 = new gast.Terminal(t.CommaTok)
            var actual2 = first(terminal2)
            expect(actual2.length).to.equal(1)
            expect(actual2[0]).to.equal(t.CommaTok)
        })

        it("can compute the first for a Sequence production ", function () {
            var seqProduction = new gast.Flat([new gast.Terminal(t.EntityTok)])
            var actual = first(seqProduction)
            expect(actual.length).to.equal(1)
            expect(actual[0]).to.equal(t.EntityTok)

            var seqProduction2 = new gast.Flat(
                [
                    new gast.Terminal(t.EntityTok),
                    new gast.Option([new gast.Terminal(t.NamespaceTok)])
                ])
            var actual2 = first(seqProduction2)
            expect(actual2.length).to.equal(1)
            expect(actual2[0]).to.equal(t.EntityTok)
        })

        it("can compute the first for an alternatives production ", function () {
            var altProduction = new gast.Alternation(
                [
                    new gast.Terminal(t.EntityTok),
                    new gast.Terminal(t.NamespaceTok),
                    new gast.Terminal(t.TypeTok)

                ])
            var actual = first(altProduction)
            expect(actual.length).to.equal(3)
            expect(actual[0]).to.equal(t.EntityTok)
            expect(actual[1]).to.equal(t.NamespaceTok)
            expect(actual[2]).to.equal(t.TypeTok)

        })

        it("can compute the first for an production with optional prefix", function () {
            var withOptionalPrefix = new gast.Flat(
                [
                    new gast.Option([new gast.Terminal(t.NamespaceTok)]),
                    new gast.Terminal(t.EntityTok)
                ])
            var actual = first(withOptionalPrefix)
            matchers.arrayEqualityNoOrder(actual, [t.NamespaceTok, t.EntityTok])


            var withTwoOptPrefix = new gast.Flat(
                [
                    new gast.Option([new gast.Terminal(t.NamespaceTok)]),
                    new gast.Option([new gast.Terminal(t.ColonTok)]),
                    new gast.Terminal(t.EntityTok),
                    new gast.Option([new gast.Terminal(t.ConstTok)])
                ])
            var actual2 = first(withTwoOptPrefix)
            matchers.arrayEqualityNoOrder(actual2, [t.NamespaceTok, t.ColonTok, t.EntityTok])
        })

    })

}
