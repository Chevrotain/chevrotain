
namespace chevrotain.first {

    import gast = chevrotain.gast

    export function first(prod:gast.IProduction):Function[] {
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

        }
        else if (prod instanceof gast.Terminal) {
            return firstForTerminal(<gast.Terminal>prod)
        }
        else if (gast.isSequenceProd(prod)) {
            return firstForSequence(<gast.AbstractProduction>prod)
        }
        else if (gast.isBranchingProd(prod)) {
            return firstForBranching(<gast.AbstractProduction>prod)
        }
        else {
            throw Error("non exhaustive match")
        }
    }

    export function firstForSequence(prod:gast.AbstractProduction):Function[] {
        let firstSet:Function[] = []
        let seq = prod.definition
        let nextSubProdIdx = 0
        let hasInnerProdsRemaining = seq.length > nextSubProdIdx
        let currSubProd
        // so we enter the loop at least once (if the definition is not empty
        let isLastInnerProdOptional = true
        // scan a sequence until it's end or until we have found a NONE optional production in it
        while (hasInnerProdsRemaining && isLastInnerProdOptional) {
            currSubProd = seq[nextSubProdIdx]
            isLastInnerProdOptional = gast.isOptionalProd(currSubProd)
            firstSet = firstSet.concat(first(currSubProd))
            nextSubProdIdx = nextSubProdIdx + 1
            hasInnerProdsRemaining = seq.length > nextSubProdIdx
        }

        return _.uniq(firstSet)
    }

    export function firstForBranching(prod:gast.AbstractProduction):Function[] {
        let allAlternativesFirsts:Function[][] = _.map(prod.definition, (innerProd) => {
            return first(innerProd)
        })
        return _.uniq(_.flatten<Function>(allAlternativesFirsts))
    }

    export function firstForTerminal(terminal:gast.Terminal):Function[] {
        return [terminal.terminalType]
    }

}
