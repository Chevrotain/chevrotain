import { HashTable } from "../../../src/lang/lang_extensions"
import { GastRefResolverVisitor } from "../../../src/parse/grammar/resolver"
import { ParserDefinitionErrorType } from "../../../src/parse/parser_public"
import { NonTerminal, Rule } from "../../../src/parse/grammar/gast/gast_public"
import { defaultGrammarErrorProvider } from "../../../src/parse/errors_public"

describe("The RefResolverVisitor", () => {
    it("will fail when trying to resolve a ref to a grammar rule that does not exist", () => {
        let ref = new NonTerminal({ nonTerminalName: "missingRule" })
        let topLevel = new Rule({ name: "TOP", definition: [ref] })
        let topLevelRules = new HashTable<Rule>()
        topLevelRules.put("TOP", topLevel)
        let resolver = new GastRefResolverVisitor(
            topLevelRules,
            defaultGrammarErrorProvider
        )
        resolver.resolveRefs()
        expect(resolver.errors).to.have.lengthOf(1)
        expect(resolver.errors[0].message).to.contain(
            "Invalid grammar, reference to a rule which is not defined: ->missingRule<-"
        )
        expect(resolver.errors[0].message).to.contain(
            "inside top level rule: ->TOP<-"
        )
        expect(resolver.errors[0].type).to.equal(
            ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF
        )
        expect(resolver.errors[0].ruleName).to.equal("TOP")
    })
})
