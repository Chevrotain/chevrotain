namespace chevrotain.resolver {

    import gast = chevrotain.gast

    export function resolveGrammar(topLevels:lang.HashTable<gast.Rule>):IParserDefinitionError[] {
        let refResolver = new GastRefResolverVisitor(topLevels)
        refResolver.resolveRefs()
        return refResolver.errors
    }

    export class GastRefResolverVisitor extends gast.GAstVisitor {

        public errors:IParserUnresolvedRefDefinitionError[] = []
        private currTopLevel:gast.Rule

        constructor(private nameToTopRule:lang.HashTable<gast.Rule>) { super() }

        public resolveRefs():void {
            utils.forEach(this.nameToTopRule.values(), (prod) => {
                this.currTopLevel = prod
                prod.accept(this)
            })
        }

        public visitNonTerminal(node:gast.NonTerminal):void {
            let ref = this.nameToTopRule.get(node.nonTerminalName)

            if (!ref) {
                let msg = "Invalid grammar, reference to rule which is not defined --> " + node.nonTerminalName
                this.errors.push({
                    message:msg,
                    type:ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF,
                    ruleName: this.currTopLevel.name,
                    unresolvedRefName: node.nonTerminalName
                })
            }
            else {
                node.referencedRule = ref
            }
        }
    }

}
