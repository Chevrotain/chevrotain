module chevrotain.resolver {

    import gast = chevrotain.gast

    export function resolveGrammar(topLevels:lang.HashTable<gast.Rule>):string[] {
        var refResolver = new GastRefResolverVisitor(topLevels)
        refResolver.resolveRefs()
        return refResolver.errors
    }

    export class GastRefResolverVisitor extends gast.GAstVisitor {

        public errors:string[] = []

        constructor(private nameToProd:lang.HashTable<gast.Rule>) { super() }

        public resolveRefs():void {
            _.forEach(this.nameToProd.values(), (prod) => {
                prod.accept(this)
            })
        }

        public visitNonTerminal(node:gast.NonTerminal):void {
            var ref = this.nameToProd.get(node.nonTerminalName)

            if (!ref) {
                this.errors.push("Invalid grammar, reference to rule which is not defined --> " + node.nonTerminalName)
            }
            else {
                node.referencedRule = ref
            }
        }
    }

}
