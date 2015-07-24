
module chevrotain.first.spec {

    import t = specs.samples
    import gast = chevrotain.gast
    import matchers = specs.matchers

    describe("The Grammar Ast first model", function () {
        "use strict"

        it("can compute the first for a terminal", function () {
            let terminal = new gast.Terminal(t.EntityTok)
            let actual = first(terminal)
            expect(actual.length).to.equal(1)
            expect(actual[0]).to.equal(t.EntityTok)

            let terminal2 = new gast.Terminal(t.CommaTok)
            let actual2 = first(terminal2)
            expect(actual2.length).to.equal(1)
            expect(actual2[0]).to.equal(t.CommaTok)
        })

        it("can compute the first for a Sequence production ", function () {
            let seqProduction = new gast.Flat([new gast.Terminal(t.EntityTok)])
            let actual = first(seqProduction)
            expect(actual.length).to.equal(1)
            expect(actual[0]).to.equal(t.EntityTok)

            let seqProduction2 = new gast.Flat(
                [
                    new gast.Terminal(t.EntityTok),
                    new gast.Option([new gast.Terminal(t.NamespaceTok)])
                ])
            let actual2 = first(seqProduction2)
            expect(actual2.length).to.equal(1)
            expect(actual2[0]).to.equal(t.EntityTok)
        })

        it("can compute the first for an alternatives production ", function () {
            let altProduction = new gast.Alternation(
                [
                    new gast.Terminal(t.EntityTok),
                    new gast.Terminal(t.NamespaceTok),
                    new gast.Terminal(t.TypeTok)

                ])
            let actual = first(altProduction)
            expect(actual.length).to.equal(3)
            expect(actual[0]).to.equal(t.EntityTok)
            expect(actual[1]).to.equal(t.NamespaceTok)
            expect(actual[2]).to.equal(t.TypeTok)

        })

        it("can compute the first for an production with optional prefix", function () {
            let withOptionalPrefix = new gast.Flat(
                [
                    new gast.Option([new gast.Terminal(t.NamespaceTok)]),
                    new gast.Terminal(t.EntityTok)
                ])
            let actual = first(withOptionalPrefix)
            matchers.setEquality(actual, [t.NamespaceTok, t.EntityTok])


            let withTwoOptPrefix = new gast.Flat(
                [
                    new gast.Option([new gast.Terminal(t.NamespaceTok)]),
                    new gast.Option([new gast.Terminal(t.ColonTok)]),
                    new gast.Terminal(t.EntityTok),
                    new gast.Option([new gast.Terminal(t.ConstTok)])
                ])
            let actual2 = first(withTwoOptPrefix)
            matchers.setEquality(actual2, [t.NamespaceTok, t.ColonTok, t.EntityTok])
        })

    })

}
