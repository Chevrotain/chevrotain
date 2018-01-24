import { HashTable } from "../../lang/lang_extensions"
import {
    IParserDefinitionError,
    IParserUnresolvedRefDefinitionError,
    ParserDefinitionErrorType
} from "../parser_public"
import { forEach } from "../../utils/utils"
import { NonTerminal, Rule } from "./gast/gast_public"
import { GAstVisitor } from "./gast/gast_visitor_public"
import {
    defaultGrammarErrorProvider,
    IGrammarResolverErrorMessageProvider
} from "../errors_public"

export function resolveGrammar(
    topLevels: HashTable<Rule>,
    errMsgProvider: IGrammarResolverErrorMessageProvider = defaultGrammarErrorProvider
): IParserDefinitionError[] {
    let refResolver = new GastRefResolverVisitor(topLevels, errMsgProvider)
    refResolver.resolveRefs()
    return refResolver.errors
}

export class GastRefResolverVisitor extends GAstVisitor {
    public errors: IParserUnresolvedRefDefinitionError[] = []
    private currTopLevel: Rule

    constructor(
        private nameToTopRule: HashTable<Rule>,
        private errMsgProvider: IGrammarResolverErrorMessageProvider
    ) {
        super()
    }

    public resolveRefs(): void {
        forEach(this.nameToTopRule.values(), prod => {
            this.currTopLevel = prod
            prod.accept(this)
        })
    }

    public visitNonTerminal(node: NonTerminal): void {
        let ref = this.nameToTopRule.get(node.nonTerminalName)

        if (!ref) {
            let msg = this.errMsgProvider.buildRuleNotFoundError(
                this.currTopLevel,
                node
            )
            this.errors.push({
                message: msg,
                type: ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF,
                ruleName: this.currTopLevel.name,
                unresolvedRefName: node.nonTerminalName
            })
        } else {
            node.referencedRule = ref
        }
    }
}
