import { IProductionWithOccurrence, Rule } from "./gast_public"
import {
    IgnoredParserIssues,
    IParserDefinitionError
} from "../../parser_public"
import { forEach } from "../../../utils/utils"
import { HashTable } from "../../../lang/lang_extensions"
import { resolveGrammar as orgResolveGrammar } from "../resolver"
import { TokenType } from "../../../scan/lexer_public"
import { validateGrammar as orgValidateGrammar } from "../checks"
import {
    defaultGrammarValidatorErrorProvider,
    IGrammarValidatorErrorMessageProvider
} from "../../errors_public"
import { DslMethodsCollectorVisitor } from "./gast"

export function resolveGrammar(options: {
    rules: Rule[]
}): IParserDefinitionError[] {
    const topRulesTable = new HashTable<Rule>()
    forEach(options.rules, rule => {
        topRulesTable.put(rule.name, rule)
    })
    return orgResolveGrammar(topRulesTable)
}

export function validateGrammar(options: {
    rules: Rule[]
    maxLookahead: number
    tokenTypes: TokenType[]
    grammarName: string
    errMsgProvider?: IGrammarValidatorErrorMessageProvider
    ignoredIssues?: IgnoredParserIssues
}): IParserDefinitionError[] {
    return orgValidateGrammar(
        options.rules,
        options.maxLookahead,
        options.tokenTypes,
        options.ignoredIssues,
        options.errMsgProvider
            ? options.errMsgProvider
            : defaultGrammarValidatorErrorProvider,
        options.grammarName
    )
}

export function assignOccurrenceIndices(options: { rules: Rule[] }): void {
    forEach(options.rules, currRule => {
        const methodsCollector = new DslMethodsCollectorVisitor()
        currRule.accept(methodsCollector)
        forEach(methodsCollector.dslMethods, methods => {
            forEach(
                methods,
                (currMethod: IProductionWithOccurrence, arrIdx) => {
                    currMethod.idx = arrIdx + 1
                }
            )
        })
    })
}
