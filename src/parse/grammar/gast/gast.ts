import { contains, every, map, some } from "../../../utils/utils"
import {
    AbstractProduction,
    Alternation,
    Flat,
    IProduction,
    IProductionWithOccurrence,
    NonTerminal,
    Option,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    RepetitionWithSeparator,
    Rule,
    Terminal
} from "./gast_public"
import { GAstVisitor } from "./gast_visitor_public"

export function isSequenceProd(prod: IProduction): boolean {
    return (
        prod instanceof Flat ||
        prod instanceof Option ||
        prod instanceof Repetition ||
        prod instanceof RepetitionMandatory ||
        prod instanceof RepetitionMandatoryWithSeparator ||
        prod instanceof RepetitionWithSeparator ||
        prod instanceof Terminal ||
        prod instanceof Rule
    )
}

export function isOptionalProd(
    prod: IProduction,
    alreadyVisited: NonTerminal[] = []
): boolean {
    let isDirectlyOptional =
        prod instanceof Option ||
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
        return some((<Alternation>prod).definition, (subProd: IProduction) => {
            return isOptionalProd(subProd, alreadyVisited)
        })
    } else if (prod instanceof NonTerminal && contains(alreadyVisited, prod)) {
        // avoiding stack overflow due to infinite recursion
        return false
    } else if (prod instanceof AbstractProduction) {
        if (prod instanceof NonTerminal) {
            alreadyVisited.push(prod)
        }
        return every(
            (<AbstractProduction>prod).definition,
            (subProd: IProduction) => {
                return isOptionalProd(subProd, alreadyVisited)
            }
        )
    } else {
        return false
    }
}

export function isBranchingProd(prod: IProduction): boolean {
    return prod instanceof Alternation
}

export function getProductionDslName(prod: IProductionWithOccurrence): string {
    if (prod instanceof NonTerminal) {
        return "SUBRULE"
    } else if (prod instanceof Option) {
        return "OPTION"
    } else if (prod instanceof Alternation) {
        return "OR"
    } else if (prod instanceof RepetitionMandatory) {
        return "AT_LEAST_ONE"
    } else if (prod instanceof RepetitionMandatoryWithSeparator) {
        return "AT_LEAST_ONE_SEP"
    } else if (prod instanceof RepetitionWithSeparator) {
        return "MANY_SEP"
    } else if (prod instanceof Repetition) {
        return "MANY"
    } else if (prod instanceof Terminal) {
        return "CONSUME"
    } else {
        /* istanbul ignore next */
        throw Error("non exhaustive match")
    }
}

class GastCloneVisitor extends GAstVisitor {
    public visitNonTerminal(node: NonTerminal): NonTerminal {
        return new NonTerminal({
            nonTerminalName: node.nonTerminalName,
            idx: node.idx
        })
    }

    public visitFlat(node: Flat): Flat {
        let definition = map(node.definition, currSubDef =>
            this.visit(currSubDef)
        )
        return new Flat({ definition: definition, name: node.name })
    }

    public visitOption(node: Option): Option {
        let definition = map(node.definition, currSubDef =>
            this.visit(currSubDef)
        )
        return new Option({
            definition: definition,
            idx: node.idx,
            name: node.name
        })
    }

    public visitRepetition(node: Repetition): Repetition {
        let definition = map(node.definition, currSubDef =>
            this.visit(currSubDef)
        )
        return new Repetition({
            definition: definition,
            idx: node.idx,
            name: node.name
        })
    }

    public visitRepetitionMandatory(
        node: RepetitionMandatory
    ): RepetitionMandatory {
        let definition = map(node.definition, currSubDef =>
            this.visit(currSubDef)
        )
        return new RepetitionMandatory({
            definition: definition,
            idx: node.idx,
            name: node.name
        })
    }

    public visitRepetitionMandatoryWithSeparator(
        node: RepetitionMandatoryWithSeparator
    ): RepetitionMandatoryWithSeparator {
        let definition = map(node.definition, currSubDef =>
            this.visit(currSubDef)
        )

        return new RepetitionMandatoryWithSeparator({
            definition: definition,
            separator: node.separator,
            idx: node.idx,
            name: node.name
        })
    }

    public visitRepetitionWithSeparator(
        node: RepetitionWithSeparator
    ): RepetitionWithSeparator {
        let definition = map(node.definition, currSubDef =>
            this.visit(currSubDef)
        )
        return new RepetitionWithSeparator({
            definition: definition,
            separator: node.separator,
            idx: node.idx,
            name: node.name
        })
    }

    public visitAlternation(node: Alternation): Alternation {
        let definition = map(node.definition, currSubDef =>
            this.visit(currSubDef)
        )
        return new Alternation({
            definition: definition,
            idx: node.idx,
            name: node.name
        })
    }

    public visitTerminal(node: Terminal): Terminal {
        return new Terminal({
            terminalType: node.terminalType,
            idx: node.idx
        })
    }

    public visitRule(node: Rule): Rule {
        let definition = map(node.definition, currSubDef =>
            this.visit(currSubDef)
        )
        return new Rule({
            name: node.name,
            definition: definition,
            orgText: node.orgText
        })
    }
}

export function cloneProduction<T extends IProduction>(prod: T): T {
    let cloningVisitor = new GastCloneVisitor()
    return cloningVisitor.visit(prod)
}
