import { AtLeastOneSepMethodOpts, ConsumeMethodOpts, DSLMethodOpts, DSLMethodOptsWithErr, GrammarAction, IAnyOrAlt, IParserConfig, IRuleConfig, ISerializedGast, IToken, ManySepMethodOpts, OrMethodOpts, SubruleMethodOpts, TokenType, TokenVocabulary } from "../../../../api";
import { AbstractNextTerminalAfterProductionWalker } from "../../grammar/interpreter";
import { IParserState, TokenMatcher } from "../parser";
import { MixedInParser } from "./parser_traits";
import { HashTable } from "../../../lang/lang_extensions";
import { Rule } from "../../grammar/gast/gast_public";
/**
 * This trait is responsible for the runtime parsing engine
 * Used by the official API (recognizer_api.ts)
 */
export declare class RecognizerEngine {
    isBackTrackingStack: any;
    className: string;
    RULE_STACK: string[];
    RULE_OCCURRENCE_STACK: number[];
    definedRulesNames: string[];
    tokensMap: {
        [fqn: string]: TokenType;
    };
    allRuleNames: string[];
    gastProductionsCache: HashTable<Rule>;
    serializedGrammar: ISerializedGast[];
    shortRuleNameToFull: HashTable<string>;
    fullRuleNameToShort: HashTable<number>;
    ruleShortNameIdx: number;
    tokenMatcher: TokenMatcher;
    initRecognizerEngine(tokenVocabulary: TokenVocabulary, config: IParserConfig): void;
    defineRule<T>(this: MixedInParser, ruleName: string, impl: (...implArgs: any[]) => T, config: IRuleConfig<T>): (idxInCallingRule?: number, ...args: any[]) => T;
    optionInternal<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>, occurrence: number): OUT;
    optionInternalNoCst<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>, occurrence: number): OUT;
    optionInternalLogic<OUT>(this: MixedInParser, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>, occurrence: number, key: number): OUT;
    atLeastOneInternal<OUT>(this: MixedInParser, prodOccurrence: number, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    atLeastOneInternalNoCst<OUT>(this: MixedInParser, prodOccurrence: number, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>): void;
    atLeastOneInternalLogic<OUT>(this: MixedInParser, prodOccurrence: number, actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>, key: number): void;
    atLeastOneSepFirstInternal<OUT>(this: MixedInParser, prodOccurrence: number, options: AtLeastOneSepMethodOpts<OUT>): void;
    atLeastOneSepFirstInternalNoCst<OUT>(this: MixedInParser, prodOccurrence: number, options: AtLeastOneSepMethodOpts<OUT>): void;
    atLeastOneSepFirstInternalLogic<OUT>(this: MixedInParser, prodOccurrence: number, options: AtLeastOneSepMethodOpts<OUT>, key: number): void;
    manyInternal<OUT>(this: MixedInParser, prodOccurrence: number, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    manyInternalNoCst<OUT>(this: MixedInParser, prodOccurrence: number, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>): void;
    manyInternalLogic<OUT>(this: MixedInParser, prodOccurrence: number, actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>, key: number): void;
    manySepFirstInternal<OUT>(this: MixedInParser, prodOccurrence: number, options: ManySepMethodOpts<OUT>): void;
    manySepFirstInternalNoCst<OUT>(this: MixedInParser, prodOccurrence: number, options: ManySepMethodOpts<OUT>): void;
    manySepFirstInternalLogic<OUT>(this: MixedInParser, prodOccurrence: number, options: ManySepMethodOpts<OUT>, key: number): void;
    repetitionSepSecondInternal<OUT>(this: MixedInParser, prodOccurrence: number, separator: TokenType, separatorLookAheadFunc: () => boolean, action: GrammarAction<OUT>, nextTerminalAfterWalker: typeof AbstractNextTerminalAfterProductionWalker): void;
    doSingleRepetition(this: MixedInParser, action: Function): any;
    orInternalNoCst<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>, occurrence: number): T;
    orInternal<T>(this: MixedInParser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>, occurrence: number): T;
    ruleFinallyStateUpdate(this: MixedInParser): void;
    subruleInternal<T>(this: MixedInParser, ruleToCall: (idx: number) => T, idx: number, options?: SubruleMethodOpts): any;
    consumeInternal(this: MixedInParser, tokType: TokenType, idx: number, options: ConsumeMethodOpts): IToken;
    saveRecogState(this: MixedInParser): IParserState;
    reloadRecogState(this: MixedInParser, newState: IParserState): void;
    ruleInvocationStateUpdate(this: MixedInParser, shortName: string, fullName: string, idxInCallingRule: number): void;
    isBackTracking(this: MixedInParser): boolean;
    getCurrRuleFullName(this: MixedInParser): string;
    shortRuleNameToFullName(this: MixedInParser, shortName: string): string;
    isAtEndOfInput(this: MixedInParser): boolean;
    reset(this: MixedInParser): void;
}
