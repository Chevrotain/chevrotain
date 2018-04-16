import {
    Alternation,
    Flat,
    IProduction,
    NonTerminal,
    Option,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    RepetitionWithSeparator,
    Rule,
    Terminal
} from "./gast_public"

export abstract class GAstVisitor {
    public visit(node: IProduction): any {
        /* istanbul ignore next */
        if (node instanceof NonTerminal) {
            return this.visitNonTerminal(node)
        } else if (node instanceof Flat) {
            return this.visitFlat(node)
        } else if (node instanceof Option) {
            return this.visitOption(node)
        } else if (node instanceof RepetitionMandatory) {
            return this.visitRepetitionMandatory(node)
        } else if (node instanceof RepetitionMandatoryWithSeparator) {
            return this.visitRepetitionMandatoryWithSeparator(node)
        } else if (node instanceof RepetitionWithSeparator) {
            return this.visitRepetitionWithSeparator(node)
        } else if (node instanceof Repetition) {
            return this.visitRepetition(node)
        } else if (node instanceof Alternation) {
            return this.visitAlternation(node)
        } else if (node instanceof Terminal) {
            return this.visitTerminal(node)
        } else if (node instanceof Rule) {
            return this.visitRule(node)
        } else {
            throw Error("non exhaustive match")
        }
    }

    public visitNonTerminal(node: NonTerminal): any {}

    public visitFlat(node: Flat): any {}

    public visitOption(node: Option): any {}

    public visitRepetition(node: Repetition): any {}

    public visitRepetitionMandatory(node: RepetitionMandatory): any {}

    public visitRepetitionMandatoryWithSeparator(
        node: RepetitionMandatoryWithSeparator
    ): any {}

    public visitRepetitionWithSeparator(node: RepetitionWithSeparator): any {}

    public visitAlternation(node: Alternation): any {}

    public visitTerminal(node: Terminal): any {}

    public visitRule(node: Rule): any {}
}
