import { Alternation, Flat, NonTerminal, Option, Repetition, RepetitionMandatory, RepetitionMandatoryWithSeparator, RepetitionWithSeparator, Rule, Terminal } from "./gast_public";
import { IProduction } from "../../../../api";
export declare abstract class GAstVisitor {
    visit(node: IProduction): any;
    visitNonTerminal(node: NonTerminal): any;
    visitFlat(node: Flat): any;
    visitOption(node: Option): any;
    visitRepetition(node: Repetition): any;
    visitRepetitionMandatory(node: RepetitionMandatory): any;
    visitRepetitionMandatoryWithSeparator(node: RepetitionMandatoryWithSeparator): any;
    visitRepetitionWithSeparator(node: RepetitionWithSeparator): any;
    visitAlternation(node: Alternation): any;
    visitTerminal(node: Terminal): any;
    visitRule(node: Rule): any;
}
