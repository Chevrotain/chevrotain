import {gast} from "../../../src/parse/grammar/gast_public"
import {getProductionDslName} from "../../../src/parse/grammar/gast"
import {Token} from "../../../src/scan/tokens_public"

describe("GAst namespace", () => {

    describe("the ProdRef class", () => {

        it("will always return a valid empty definition, even if it's ref is unresolved", () => {
            let prodRef = new gast.NonTerminal("SomeGrammarRuleName")
            expect(prodRef.definition).to.be.an.instanceof(Array)
        })
    })

    describe("the mappings between a GAst instance and its matching DSL method name for: ", () => {

        class Comma extends Token {}

        it("Terminal", () => {
            let gastInstance = new gast.Terminal(Comma)
            expect(getProductionDslName(gastInstance)).to.equal("CONSUME")
        })

        it("NonTerminal", () => {
            let gastInstance = new gast.NonTerminal("bamba")
            expect(getProductionDslName(gastInstance)).to.equal("SUBRULE")
        })

        it("Option", () => {
            let gastInstance = new gast.Option([])
            expect(getProductionDslName(gastInstance)).to.equal("OPTION")
        })

        it("Alternation", () => {
            let gastInstance = new gast.Alternation([])
            expect(getProductionDslName(gastInstance)).to.equal("OR")
        })

        it("RepetitionMandatory", () => {
            let gastInstance = new gast.RepetitionMandatory([])
            expect(getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE")
        })

        it("RepetitionMandatoryWithSeparator", () => {
            let gastInstance = new gast.RepetitionMandatoryWithSeparator([], Comma)
            expect(getProductionDslName(gastInstance)).to.equal("AT_LEAST_ONE_SEP")
        })

        it("RepetitionWithSeparator", () => {
            let gastInstance = new gast.RepetitionWithSeparator([], Comma)
            expect(getProductionDslName(gastInstance)).to.equal("MANY_SEP")
        })

        it("Repetition", () => {
            let gastInstance = new gast.Repetition([])
            expect(getProductionDslName(gastInstance)).to.equal("MANY")
        })

    })
})
