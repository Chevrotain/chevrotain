import {gast} from "../../../src/parse/grammar/gast_public"

describe("GAst namespace", () => {

    describe("the ProdRef class", () => {

        it("will always return a valid empty definition, even if it's ref is unresolved", () => {
            let prodRef = new gast.NonTerminal("SomeGrammarRuleName")
            expect(prodRef.definition).to.be.an.instanceof(Array)
        })
    })
})
