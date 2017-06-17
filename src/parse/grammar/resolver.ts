import { HashTable } from "../../lang/lang_extensions"
import {
    IParserDefinitionError,
    IParserUnresolvedRefDefinitionError,
    ParserDefinitionErrorType
} from "../parser_public"
import { gast } from "./gast_public"
import { forEach } from "../../utils/utils"

export function resolveGrammar(
    topLevels: HashTable<gast.Rule>
): IParserDefinitionError[] {
    let refResolver = new GastRefResolverVisitor(topLevels)
    refResolver.resolveRefs()
    return refResolver.errors
}

export class GastRefResolverVisitor extends gast.GAstVisitor {
    public errors: IParserUnresolvedRefDefinitionError[] = []
    private currTopLevel: gast.Rule

    constructor(private nameToTopRule: HashTable<gast.Rule>) {
        super()
    }

    public resolveRefs(): void {
        forEach(this.nameToTopRule.values(), prod => {
            this.currTopLevel = prod
            prod.accept(this)
        })
    }

    public visitNonTerminal(node: gast.NonTerminal): void {
        let ref = this.nameToTopRule.get(node.nonTerminalName)

        if (!ref) {
            let msg =
                "Invalid grammar, reference to a rule which is not defined: ->" +
                node.nonTerminalName +
                "<-\n" +
                "inside top level rule: ->" +
                this.currTopLevel.name +
                "<-"
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
