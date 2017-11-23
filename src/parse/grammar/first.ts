import { gast } from "./gast_public"
import { isSequenceProd, isBranchingProd, isOptionalProd } from "./gast"
import { uniq, map, flatten } from "../../utils/utils"
import { TokenType } from "../../scan/lexer_public"

export function first(prod: gast.IProduction): TokenType[] {
    if (prod instanceof gast.NonTerminal) {
        // this could in theory cause infinite loops if
        // (1) prod A refs prod B.
        // (2) prod B refs prod A
        // (3) AB can match the empty set
        // in other words a cycle where everything is optional so the first will keep
        // looking ahead for the next optional part and will never exit
        // currently there is no safeguard for this unique edge case because
        // (1) not sure a grammar in which this can happen is useful for anything (productive)
        return first((<gast.NonTerminal>prod).referencedRule)
    } else if (prod instanceof gast.Terminal) {
        return firstForTerminal(<gast.Terminal>prod)
    } else if (isSequenceProd(prod)) {
        return firstForSequence(<gast.AbstractProduction>prod)
    } else if (isBranchingProd(prod)) {
        return firstForBranching(<gast.AbstractProduction>prod)
    } else {
        /* istanbul ignore next */
        throw Error("non exhaustive match")
    }
}

export function firstForSequence(prod: gast.AbstractProduction): TokenType[] {
    let firstSet: TokenType[] = []
    let seq = prod.definition
    let nextSubProdIdx = 0
    let hasInnerProdsRemaining = seq.length > nextSubProdIdx
    let currSubProd
    // so we enter the loop at least once (if the definition is not empty
    let isLastInnerProdOptional = true
    // scan a sequence until it's end or until we have found a NONE optional production in it
    while (hasInnerProdsRemaining && isLastInnerProdOptional) {
        currSubProd = seq[nextSubProdIdx]
        isLastInnerProdOptional = isOptionalProd(currSubProd)
        firstSet = firstSet.concat(first(currSubProd))
        nextSubProdIdx = nextSubProdIdx + 1
        hasInnerProdsRemaining = seq.length > nextSubProdIdx
    }

    return uniq(firstSet)
}

export function firstForBranching(prod: gast.AbstractProduction): TokenType[] {
    let allAlternativesFirsts: TokenType[][] = map(
        prod.definition,
        innerProd => {
            return first(innerProd)
        }
    )
    return uniq(flatten<TokenType>(allAlternativesFirsts))
}

export function firstForTerminal(terminal: gast.Terminal): TokenType[] {
    return [terminal.terminalType]
}
