import { HashTable } from "../../lang/lang_extensions";
import { Alternation, Option, Repetition, RepetitionMandatory, RepetitionMandatoryWithSeparator, RepetitionWithSeparator, Rule } from "../grammar/gast/gast_public";
import { GAstVisitor } from "../grammar/gast/gast_visitor_public";
import { CstNode, IOptionallyNamedProduction, IProduction, IToken } from "../../../api";
export declare function addTerminalToCst(node: CstNode, token: IToken, tokenTypeName: string): void;
export declare function addNoneTerminalToCst(node: CstNode, ruleName: string, ruleResult: any): void;
export interface DefAndKeyAndName {
    def: IProduction[];
    key: number;
    name: string;
    orgProd: IOptionallyNamedProduction;
}
export declare class NamedDSLMethodsCollectorVisitor extends GAstVisitor {
    result: DefAndKeyAndName[];
    ruleIdx: number;
    constructor(ruleIdx: any);
    private collectNamedDSLMethod;
    visitOption(node: Option): void;
    visitRepetition(node: Repetition): void;
    visitRepetitionMandatory(node: RepetitionMandatory): void;
    visitRepetitionMandatoryWithSeparator(node: RepetitionMandatoryWithSeparator): void;
    visitRepetitionWithSeparator(node: RepetitionWithSeparator): void;
    visitAlternation(node: Alternation): void;
}
export declare function analyzeCst(topRules: Rule[], fullToShortName: HashTable<number>): {
    allRuleNames: string[];
};
