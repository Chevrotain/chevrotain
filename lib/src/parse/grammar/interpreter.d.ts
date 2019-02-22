import { RestWalker } from "./rest";
import { TokenMatcher } from "../parser/parser";
import { AbstractProduction, NonTerminal, Repetition, RepetitionMandatory, RepetitionMandatoryWithSeparator, RepetitionWithSeparator, Rule, Terminal } from "./gast/gast_public";
import { IGrammarPath, IProduction, ISyntacticContentAssistPath, IToken, ITokenGrammarPath, TokenType } from "../../../api";
export declare abstract class AbstractNextPossibleTokensWalker extends RestWalker {
    protected topProd: Rule;
    protected path: IGrammarPath;
    protected possibleTokTypes: TokenType[];
    protected ruleStack: string[];
    protected occurrenceStack: number[];
    protected nextProductionName: string;
    protected nextProductionOccurrence: number;
    protected found: boolean;
    protected isAtEndOfPath: boolean;
    constructor(topProd: Rule, path: IGrammarPath);
    startWalking(): TokenType[];
    walk(prod: AbstractProduction, prevRest?: IProduction[]): void;
    walkProdRef(refProd: NonTerminal, currRest: IProduction[], prevRest: IProduction[]): void;
    updateExpectedNext(): void;
}
export declare class NextAfterTokenWalker extends AbstractNextPossibleTokensWalker {
    protected path: ITokenGrammarPath;
    private nextTerminalName;
    private nextTerminalOccurrence;
    constructor(topProd: Rule, path: ITokenGrammarPath);
    walkTerminal(terminal: Terminal, currRest: IProduction[], prevRest: IProduction[]): void;
}
export declare type AlternativesFirstTokens = TokenType[][];
export interface IFirstAfterRepetition {
    token: TokenType;
    occurrence: number;
    isEndOfRule: boolean;
}
/**
 * This walker only "walks" a single "TOP" level in the Grammar Ast, this means
 * it never "follows" production refs
 */
export declare class AbstractNextTerminalAfterProductionWalker extends RestWalker {
    protected topRule: Rule;
    protected occurrence: number;
    protected result: {
        token: any;
        occurrence: any;
        isEndOfRule: any;
    };
    constructor(topRule: Rule, occurrence: number);
    startWalking(): IFirstAfterRepetition;
}
export declare class NextTerminalAfterManyWalker extends AbstractNextTerminalAfterProductionWalker {
    walkMany(manyProd: Repetition, currRest: IProduction[], prevRest: IProduction[]): void;
}
export declare class NextTerminalAfterManySepWalker extends AbstractNextTerminalAfterProductionWalker {
    walkManySep(manySepProd: RepetitionWithSeparator, currRest: IProduction[], prevRest: IProduction[]): void;
}
export declare class NextTerminalAfterAtLeastOneWalker extends AbstractNextTerminalAfterProductionWalker {
    walkAtLeastOne(atLeastOneProd: RepetitionMandatory, currRest: IProduction[], prevRest: IProduction[]): void;
}
export declare class NextTerminalAfterAtLeastOneSepWalker extends AbstractNextTerminalAfterProductionWalker {
    walkAtLeastOneSep(atleastOneSepProd: RepetitionMandatoryWithSeparator, currRest: IProduction[], prevRest: IProduction[]): void;
}
export interface PartialPathAndSuffixes {
    partialPath: TokenType[];
    suffixDef: IProduction[];
}
export declare function possiblePathsFrom(targetDef: IProduction[], maxLength: number, currPath?: any[]): PartialPathAndSuffixes[];
export declare function nextPossibleTokensAfter(initialDef: IProduction[], tokenVector: IToken[], tokMatcher: TokenMatcher, maxLookAhead: number): ISyntacticContentAssistPath[];
