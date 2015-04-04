/// <reference path="../../utils/Matchers.ts" />
/// <reference path="../../../libs/lodash.d.ts" />
/// <reference path="../../../libs/jasmine.d.ts" />

module chevrotain.gast.spec {

    describe("GAst Module", function () {

        describe("the ProdRef class", function () {

            it("will always return a valid empty definition, even if it's ref is unresolved", function () {
                var prodRef = new ProdRef("SomeGrammarRuleName")
                expect(prodRef.definition).toEqual(jasmine.any(Array))
            })
        })
    })

}
