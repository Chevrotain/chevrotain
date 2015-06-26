module chevrotain.gast {

    import lang = chevrotain.lang

    export function isSequenceProd(prod:IProduction):boolean {
        return prod instanceof Flat ||
            prod instanceof Option ||
            prod instanceof Repetition ||
            prod instanceof RepetitionMandatory ||
            prod instanceof Terminal ||
            prod instanceof Rule
    }

    export function isOptionalProd(prod:IProduction):boolean {
        var isDirectlyOptional = prod instanceof Option || prod instanceof Repetition
        if (isDirectlyOptional) {
            return true
        }

        // note that this can cause infinite loop if one optional empty TOP production has a cyclic dependency with another
        // empty optional top rule
        // may be indirectly optional ((A?B?C?) | (D?E?F?))
        if (prod instanceof Alternation) {
            // for OR its enough for just one of the alternatives to be optional
            return _.some((<Alternation>prod).definition, (subProd:IProduction) => {
                return isOptionalProd(subProd)
            })
        }
        else if (prod instanceof AbstractProduction) {
            return _.every((<AbstractProduction>prod).definition, (subProd:IProduction) => {
                return isOptionalProd(subProd)
            })
        }
        else {
            return false
        }
    }

    export function isBranchingProd(prod:IProduction):boolean {
        return prod instanceof Alternation
    }

    var productionToDslName = {}
    productionToDslName[lang.functionName(NonTerminal)] = "SUBRULE"
    productionToDslName[lang.functionName(Option)] = "OPTION"
    productionToDslName[lang.functionName(RepetitionMandatory)] = "AT_LEAST_ONE"
    productionToDslName[lang.functionName(Repetition)] = "MANY"
    productionToDslName[lang.functionName(Alternation)] = "OR"
    productionToDslName[lang.functionName(Terminal)] = "CONSUME"


    export function getProductionDslName(prod:IProductionWithOccurrence):string {
        var clazz = prod.constructor
        var prodName = lang.functionName(clazz)
        return productionToDslName[prodName]
    }

}

