import { Alternation, NonTerminal, Option, Repetition, RepetitionMandatory, RepetitionMandatoryWithSeparator, RepetitionWithSeparator, Terminal } from "./gast_public";
import { GAstVisitor } from "./gast_visitor_public";
import { IProduction, IProductionWithOccurrence } from "../../../../api";
export declare function isSequenceProd(prod: IProduction): boolean;
export declare function isOptionalProd(prod: IProduction, alreadyVisited?: NonTerminal[]): boolean;
export declare function isBranchingProd(prod: IProduction): boolean;
export declare function getProductionDslName(prod: IProductionWithOccurrence): string;
export declare class DslMethodsCollectorVisitor extends GAstVisitor {
    separator: string;
    dslMethods: {
        option: any[];
        alternation: any[];
        repetition: any[];
        repetitionWithSeparator: any[];
        repetitionMandatory: any[];
        repetitionMandatoryWithSeparator: any[];
    };
    visitTerminal(terminal: Terminal): void;
    visitNonTerminal(subrule: NonTerminal): void;
    visitOption(option: Option): void;
    visitRepetitionWithSeparator(manySep: RepetitionWithSeparator): void;
    visitRepetitionMandatory(atLeastOne: RepetitionMandatory): void;
    visitRepetitionMandatoryWithSeparator(atLeastOneSep: RepetitionMandatoryWithSeparator): void;
    visitRepetition(many: Repetition): void;
    visitAlternation(or: Alternation): void;
}
