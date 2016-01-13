import {gast} from "./gast_public"
import {some, every, contains} from "../../utils/utils"
import {functionName} from "../../lang/lang_extensions"


export function isSequenceProd(prod:gast.IProduction):boolean {
    return prod instanceof gast.Flat ||
        prod instanceof gast.Option ||
        prod instanceof gast.Repetition ||
        prod instanceof gast.RepetitionMandatory ||
        prod instanceof gast.RepetitionMandatoryWithSeparator ||
        prod instanceof gast.RepetitionWithSeparator ||
        prod instanceof gast.Terminal ||
        prod instanceof gast.Rule
}

export function isOptionalProd(prod:gast.IProduction, alreadyVisited:gast.NonTerminal[] = []):boolean {
    let isDirectlyOptional = prod instanceof gast.Option ||
        prod instanceof gast.Repetition ||
        prod instanceof gast.RepetitionWithSeparator
    if (isDirectlyOptional) {
        return true
    }

    // note that this can cause infinite loop if one optional empty TOP production has a cyclic dependency with another
    // empty optional top rule
    // may be indirectly optional ((A?B?C?) | (D?E?F?))
    if (prod instanceof gast.Alternation) {
        // for OR its enough for just one of the alternatives to be optional
        return some((<gast.Alternation>prod).definition, (subProd:gast.IProduction) => {
            return isOptionalProd(subProd, alreadyVisited)
        })
    }
    else if (prod instanceof gast.NonTerminal && contains(alreadyVisited, prod)) {
        // avoiding stack overflow due to infinite recursion
        return false
    }
    else if (prod instanceof gast.AbstractProduction) {
        if (prod instanceof gast.NonTerminal) {
            alreadyVisited.push(prod)
        }
        return every((<gast.AbstractProduction>prod).definition, (subProd:gast.IProduction) => {
            return isOptionalProd(subProd, alreadyVisited)
        })
    }
    else {
        return false
    }
}

export function isBranchingProd(prod:gast.IProduction):boolean {
    return prod instanceof gast.Alternation
}

let productionToDslName = {}
productionToDslName[functionName(gast.NonTerminal)] = "SUBRULE"
productionToDslName[functionName(gast.Option)] = "OPTION"
productionToDslName[functionName(gast.RepetitionMandatory)] = "AT_LEAST_ONE"
productionToDslName[functionName(gast.RepetitionMandatoryWithSeparator)] = "AT_LEAST_ONE_SEP"
productionToDslName[functionName(gast.RepetitionWithSeparator)] = "MANY_SEP"
productionToDslName[functionName(gast.Repetition)] = "MANY"
productionToDslName[functionName(gast.Alternation)] = "OR"
productionToDslName[functionName(gast.Terminal)] = "CONSUME"

export function getProductionDslName(prod:gast.IProductionWithOccurrence):string {
    let clazz = prod.constructor
    let prodName = functionName(clazz)
    return productionToDslName[prodName]
}
