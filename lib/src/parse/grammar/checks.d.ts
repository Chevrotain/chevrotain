import { IParserAmbiguousAlternativesDefinitionError, IParserEmptyAlternativeDefinitionError } from "../parser/parser";
import { Alternation, NonTerminal, Option, Repetition, RepetitionMandatory, RepetitionMandatoryWithSeparator, RepetitionWithSeparator, Rule, Terminal } from "./gast/gast_public";
import { GAstVisitor } from "./gast/gast_visitor_public";
import { IgnoredParserIssues, IGrammarValidatorErrorMessageProvider, IOptionallyNamedProduction, IParserDefinitionError, IProduction, IProductionWithOccurrence, TokenType } from "../../../api";
export declare function validateGrammar(topLevels: Rule[], maxLookahead: number, tokenTypes: TokenType[], ignoredIssues: IgnoredParserIssues, errMsgProvider: IGrammarValidatorErrorMessageProvider, grammarName: string): IParserDefinitionError[];
export declare function identifyProductionForDuplicates(prod: IProductionWithOccurrence): string;
export declare class OccurrenceValidationCollector extends GAstVisitor {
    allProductions: IProduction[];
    visitNonTerminal(subrule: NonTerminal): void;
    visitOption(option: Option): void;
    visitRepetitionWithSeparator(manySep: RepetitionWithSeparator): void;
    visitRepetitionMandatory(atLeastOne: RepetitionMandatory): void;
    visitRepetitionMandatoryWithSeparator(atLeastOneSep: RepetitionMandatoryWithSeparator): void;
    visitRepetition(many: Repetition): void;
    visitAlternation(or: Alternation): void;
    visitTerminal(terminal: Terminal): void;
}
export declare const validTermsPattern: RegExp;
export declare const validNestedRuleName: RegExp;
export declare function validateRuleName(rule: Rule, errMsgProvider: IGrammarValidatorErrorMessageProvider): IParserDefinitionError[];
export declare function validateNestedRuleName(topLevel: Rule, nestedProd: IOptionallyNamedProduction, errMsgProvider: IGrammarValidatorErrorMessageProvider): IParserDefinitionError[];
export declare function validateTokenName(tokenType: TokenType, errMsgProvider: IGrammarValidatorErrorMessageProvider): IParserDefinitionError[];
export declare function validateRuleDoesNotAlreadyExist(rule: Rule, allRules: Rule[], className: any, errMsgProvider: IGrammarValidatorErrorMessageProvider): IParserDefinitionError[];
export declare function validateRuleIsOverridden(ruleName: string, definedRulesNames: string[], className: any): IParserDefinitionError[];
export declare function validateNoLeftRecursion(topRule: Rule, currRule: Rule, errMsgProvider: IGrammarValidatorErrorMessageProvider, path?: Rule[]): IParserDefinitionError[];
export declare function getFirstNoneTerminal(definition: IProduction[]): Rule[];
export declare function validateEmptyOrAlternative(topLevelRule: Rule, errMsgProvider: IGrammarValidatorErrorMessageProvider): IParserEmptyAlternativeDefinitionError[];
export declare function validateAmbiguousAlternationAlternatives(topLevelRule: Rule, maxLookahead: number, ignoredIssues: IgnoredParserIssues, errMsgProvider: IGrammarValidatorErrorMessageProvider): IParserAmbiguousAlternativesDefinitionError[];
export declare class RepetionCollector extends GAstVisitor {
    allProductions: IProduction[];
    visitRepetitionWithSeparator(manySep: RepetitionWithSeparator): void;
    visitRepetitionMandatory(atLeastOne: RepetitionMandatory): void;
    visitRepetitionMandatoryWithSeparator(atLeastOneSep: RepetitionMandatoryWithSeparator): void;
    visitRepetition(many: Repetition): void;
}
export declare function validateTooManyAlts(topLevelRule: Rule, errMsgProvider: IGrammarValidatorErrorMessageProvider): IParserDefinitionError[];
export declare function validateSomeNonEmptyLookaheadPath(topLevelRules: Rule[], maxLookahead: number, errMsgProvider: IGrammarValidatorErrorMessageProvider): IParserDefinitionError[];
export interface IAmbiguityDescriptor {
    alts: number[];
    path: TokenType[];
}
