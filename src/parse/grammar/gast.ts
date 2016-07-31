import {gast} from "./gast_public"
import {
    some,
    every,
    contains,
    map
} from "../../utils/utils"


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

export function getProductionDslName(prod:gast.IProductionWithOccurrence):string {
    if (prod instanceof gast.NonTerminal) {
        return "SUBRULE"
    }
    else if (prod instanceof gast.Option) {
        return "OPTION"
    }
    else if (prod instanceof gast.Alternation) {
        return "OR"
    }
    else if (prod instanceof gast.RepetitionMandatory) {
        return "AT_LEAST_ONE"
    }
    else if (prod instanceof gast.RepetitionMandatoryWithSeparator) {
        return "AT_LEAST_ONE_SEP"
    }
    else if (prod instanceof gast.RepetitionWithSeparator) {
        return "MANY_SEP"
    }
    else if (prod instanceof gast.Repetition) {
        return "MANY"
    }
    else if (prod instanceof gast.Terminal) {
        return "CONSUME"
    }
    else {
        throw Error("non exhaustive match")
    }
}

class GastCloneVisitor extends gast.GAstVisitor {

    public visitNonTerminal(node:gast.NonTerminal):gast.NonTerminal {
        return new gast.NonTerminal(node.nonTerminalName, undefined, node.occurrenceInParent)
    }

    public visitFlat(node:gast.Flat):gast.Flat {
        let definition = map(node.definition, (currSubDef) => this.visit(currSubDef))
        return new gast.Flat(definition)
    }

    public visitOption(node:gast.Option):gast.Option {
        let definition = map(node.definition, (currSubDef) => this.visit(currSubDef))
        return new gast.Option(definition, node.occurrenceInParent)
    }

    public visitRepetition(node:gast.Repetition):gast.Repetition {
        let definition = map(node.definition, (currSubDef) => this.visit(currSubDef))
        return new gast.Repetition(definition, node.occurrenceInParent)
    }

    public visitRepetitionMandatory(node:gast.RepetitionMandatory):gast.RepetitionMandatory {
        let definition = map(node.definition, (currSubDef) => this.visit(currSubDef))
        return new gast.RepetitionMandatory(definition, node.occurrenceInParent)
    }

    public visitRepetitionMandatoryWithSeparator(node:gast.RepetitionMandatoryWithSeparator):gast.RepetitionMandatoryWithSeparator {
        let definition = map(node.definition, (currSubDef) => this.visit(currSubDef))
        return new gast.RepetitionMandatoryWithSeparator(definition, node.separator, node.occurrenceInParent)
    }

    public visitRepetitionWithSeparator(node:gast.RepetitionWithSeparator):gast.RepetitionWithSeparator {
        let definition = map(node.definition, (currSubDef) => this.visit(currSubDef))
        return new gast.RepetitionWithSeparator(definition, node.separator, node.occurrenceInParent)
    }

    public visitAlternation(node:gast.Alternation):gast.Alternation {
        let definition = map(node.definition, (currSubDef) => this.visit(currSubDef))
        return new gast.Alternation(definition, node.occurrenceInParent)
    }

    public visitTerminal(node:gast.Terminal):gast.Terminal {
        return new gast.Terminal(node.terminalType, node.occurrenceInParent)
    }

    public visitRule(node:gast.Rule):gast.Rule {
        let definition = map(node.definition, (currSubDef) => this.visit(currSubDef))
        return new gast.Rule(node.name, definition, node.orgText)
    }
}

export function cloneProduction<T extends gast.IProduction>(prod:T):T {
    let cloningVisitor = new GastCloneVisitor()
    return cloningVisitor.visit(prod)
}
