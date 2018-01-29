import { NonTerminal, Rule } from "./gast_public"
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
    defaultGrammarErrorProvider,
    IGrammarErrorMessageProvider
} from "../../errors_public"

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
    ignoredIssues: IgnoredParserIssues
    grammarName: string
    errMsgProvider?: IGrammarErrorMessageProvider
}): IParserDefinitionError[] {
    return orgValidateGrammar(
        options.rules,
        options.maxLookahead,
        options.tokenTypes,
        options.ignoredIssues,
        options.errMsgProvider
            ? options.errMsgProvider
            : defaultGrammarErrorProvider,
        options.grammarName
    )
}
