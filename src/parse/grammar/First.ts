/// <reference path="GAst.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

module chevrotain.parse.grammar.first {

    import gast = chevrotain.parse.grammar.gast;

    export function first(prod:gast.IProduction, allowRefToOtherProds:boolean = false):Function[] {
        // used to avoid scanning other top level prods when computing only IN RULES
        if (prod instanceof gast.ProdRef) {
            if (!allowRefToOtherProds) {
                return [];
            }
            // is flow is used for seeking next possible token types in content assist
            // in this case we don't want to limit the search inside the current top level rule
            // we want to know what can come next in ANY context
            else {
                // this could in theory cause infinite loops if
                // (1) prod A refs prod B.
                // (2) prod B refs prod A
                // (3) AB can match the empty set
                // in other words a cycle where everything is optional so the first will keep
                // looking ahead for the next optional part and will never exit
                // currently there is no safeguard for this unique edge case because
                // (1) not sure a grammar in which this can happen is useful for anything (productive)
                // (2) if this could happen for our grammar, it WILL happen during testing.
                return first((<gast.ProdRef>prod).ref, allowRefToOtherProds);
            }

        }
        else if (prod instanceof gast.Terminal) {
            return firstForTerminal(<gast.Terminal>prod);
        }
        else if (gast.isSequenceProd(prod)) {
            return firstForSequence(<gast.AbstractProduction>prod, allowRefToOtherProds);
        }
        else if (gast.isBranchingProd(prod)) {
            return firstForBranching(<gast.AbstractProduction>prod, allowRefToOtherProds);
        }
        else {
            throw Error("non exhaustive match");
        }
    }

    export function firstForSequence(prod:gast.AbstractProduction, allowTopLevel:boolean = false):Function[] {
        var firstSet:Function[] = [];
        var seq = prod.definition;
        var nextSubProdIdx = 0;
        var hasInnerProdsRemaining = seq.length > nextSubProdIdx;
        var currSubProd;
        // so we enter the loop at least once (if the definition is not empty
        var isLastInnerProdOptional = true;
        // scan a sequence until it's end or until we have found a NONE optional production in it
        while (hasInnerProdsRemaining && isLastInnerProdOptional) {
            currSubProd = seq[nextSubProdIdx];
            isLastInnerProdOptional = gast.isOptionalProd(currSubProd);
            firstSet = firstSet.concat(first(currSubProd, allowTopLevel));
            nextSubProdIdx = nextSubProdIdx + 1;
            hasInnerProdsRemaining = seq.length > nextSubProdIdx;
        }

        return _.uniq(firstSet);
    }

    export function firstForBranching(prod:gast.AbstractProduction, allowTopLevel:boolean = false):Function[] {
        var allAlternativesFirsts:Function[][] = _.map(prod.definition, (innerProd) => {
            return first(innerProd, allowTopLevel);
        });
        return _.uniq(_.flatten<Function>(allAlternativesFirsts));
    }

    export function firstForTerminal(terminal:gast.Terminal):Function[] {
        return [terminal.terminalType];
    }

}
