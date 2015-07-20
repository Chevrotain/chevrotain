module chevrotain.resolver.spec {
    import gast = chevrotain.gast

    describe("The RefResolverVisitor", function () {

        it("will fail when trying to resolve a ref to a grammar rule that does not exist", function () {
            var ref = new gast.NonTerminal("missingRule")
            var topLevel = new gast.Rule("TOP", [ref])
            var topLevelRules = new lang.HashTable<gast.Rule>()
            topLevelRules.put("TOP", topLevel)
            var resolver = new GastRefResolverVisitor(topLevelRules)
            resolver.resolveRefs()
            expect(resolver.errors).to.have.lengthOf(1)
            expect(resolver.errors[0]).to.contain("Invalid grammar, reference to rule which is not defined --> missingRule")
        })
    })
}
