import {gast} from "../../../src/parse/grammar/gast_public"
import {HashTable} from "../../../src/lang/lang_extensions"
import {GastRefResolverVisitor} from "../../../src/parse/grammar/resolver"
import {ParserDefinitionErrorType} from "../../../src/parse/parser_public"

describe("The RefResolverVisitor", function () {

    it("will fail when trying to resolve a ref to a grammar rule that does not exist", function () {
        let ref = new gast.NonTerminal("missingRule")
        let topLevel = new gast.Rule("TOP", [ref])
        let topLevelRules = new HashTable<gast.Rule>()
        topLevelRules.put("TOP", topLevel)
        let resolver = new GastRefResolverVisitor(topLevelRules)
        resolver.resolveRefs()
        expect(resolver.errors).to.have.lengthOf(1)
        expect(resolver.errors[0].message).to.contain("Invalid grammar, reference to rule which is not defined --> missingRule")
        expect(resolver.errors[0].type).to.equal(ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF)
        expect(resolver.errors[0].ruleName).to.equal("TOP")
    })
})
