namespace chevrotain.gast {

    import lang = chevrotain.lang

    export function isSequenceProd(prod:IProduction):boolean {
        return prod instanceof Flat ||
            prod instanceof Option ||
            prod instanceof Repetition ||
            prod instanceof RepetitionMandatory ||
            prod instanceof RepetitionMandatoryWithSeparator ||
            prod instanceof RepetitionWithSeparator ||
            prod instanceof Terminal ||
            prod instanceof Rule
    }

    export function isOptionalProd(prod:IProduction, alreadyVisited:NonTerminal[] = []):boolean {
        let isDirectlyOptional = prod instanceof Option ||
            prod instanceof Repetition ||
            prod instanceof RepetitionWithSeparator
        if (isDirectlyOptional) {
            return true
        }

        // note that this can cause infinite loop if one optional empty TOP production has a cyclic dependency with another
        // empty optional top rule
        // may be indirectly optional ((A?B?C?) | (D?E?F?))
        if (prod instanceof Alternation) {
            // for OR its enough for just one of the alternatives to be optional
            return utils.some((<Alternation>prod).definition, (subProd:IProduction) => {
                return isOptionalProd(subProd, alreadyVisited)
            })
        }
        else if (prod instanceof NonTerminal && utils.contains(alreadyVisited, prod)) {
            // avoiding stack overflow due to infinite recursion
            return false
        }
        else if (prod instanceof AbstractProduction) {
            if (prod instanceof NonTerminal) {
                alreadyVisited.push(prod)
            }
            return utils.every((<AbstractProduction>prod).definition, (subProd:IProduction) => {
                return isOptionalProd(subProd, alreadyVisited)
            })
        }
        else {
            return false
        }
    }

    export function isBranchingProd(prod:IProduction):boolean {
        return prod instanceof Alternation
    }

    let productionToDslName = {}
    productionToDslName[lang.functionName(NonTerminal)] = "SUBRULE"
    productionToDslName[lang.functionName(Option)] = "OPTION"
    productionToDslName[lang.functionName(RepetitionMandatory)] = "AT_LEAST_ONE"
    productionToDslName[lang.functionName(RepetitionMandatoryWithSeparator)] = "AT_LEAST_ONE_SEP"
    productionToDslName[lang.functionName(RepetitionWithSeparator)] = "MANY_SEP"
    productionToDslName[lang.functionName(Repetition)] = "MANY"
    productionToDslName[lang.functionName(Alternation)] = "OR"
    productionToDslName[lang.functionName(Terminal)] = "CONSUME"


    export function getProductionDslName(prod:IProductionWithOccurrence):string {
        let clazz = prod.constructor
        let prodName = lang.functionName(clazz)
        return productionToDslName[prodName]
    }

}

