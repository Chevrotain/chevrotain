
module chevrotain.gast.spec {

    describe("GAst module", function () {

        describe("the ProdRef class", function () {

            it("will always return a valid empty definition, even if it's ref is unresolved", function () {
                var prodRef = new ProdRef("SomeGrammarRuleName")
                expect(prodRef.definition).to.be.an.instanceof(Array)
            })
        })
    })

}
