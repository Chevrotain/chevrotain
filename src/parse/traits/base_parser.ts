import { IFollowKey, Recoverable } from "./recoverable"
import {
    AtLeastOneSepMethodOpts,
    CstNode,
    DSLMethodOpts,
    DSLMethodOptsWithErr,
    GrammarAction,
    IAnyOrAlt,
    ICstVisitor,
    IRuleConfig,
    IToken,
    ITokenGrammarPath,
    ManySepMethodOpts,
    OrMethodOpts,
    TokenType
} from "../../../api"
import { AbstractNextTerminalAfterProductionWalker } from "../grammar/interpreter"
import { lookAheadSequence, Parser, TokenMatcher } from "../parser_public"
import { TreeBuilder } from "./tree_builder"
import { LooksAhead } from "./looksahead"
import { LexerAdapter } from "./lexer_adapter"
import { RecognizerEngine } from "./recognizer"

// TODO: verification that the BaseParser ONLY contains methods
//       from the traits
/**
 * Empty Implementations of the Parser Traits.
 * The Parser class will extend this BaseParser.
 * This is done to keep the parser class itself cleaner as the
 * pattern to implement mixins in TypeScript requires signatures code duplication.
 * - https://www.typescriptlang.org/docs/handbook/mixins.html
 */
export class BaseParser
    implements
        Recoverable,
        TreeBuilder,
        LooksAhead,
        LexerAdapter,
        RecognizerEngine {
    // Recoverable Trait
    addToResyncTokens(token: IToken, resyncTokens: IToken[]): IToken[] {
        return undefined
    }

    buildFullFollowKeyStack(): IFollowKey[] {
        return undefined
    }

    canPerformInRuleRecovery(
        expectedToken: TokenType,
        follows: TokenType[]
    ): boolean {
        return false
    }

    canRecoverWithSingleTokenDeletion(expectedTokType: TokenType): boolean {
        return false
    }

    canRecoverWithSingleTokenInsertion(
        expectedTokType: TokenType,
        follows: TokenType[]
    ): boolean {
        return false
    }

    canTokenTypeBeInsertedInRecovery(tokType: TokenType): boolean {
        return false
    }

    findReSyncTokenType(): TokenType {
        return undefined
    }

    flattenFollowSet(): TokenType[] {
        return undefined
    }

    getCurrFollowKey(): IFollowKey {
        return undefined
    }

    getFollowSetFromFollowKey(followKey: IFollowKey): TokenType[] {
        return undefined
    }

    getFollowsForInRuleRecovery(
        tokType: TokenType,
        tokIdxInRule: number
    ): TokenType[] {
        return undefined
    }

    getTokenToInsert(tokType: TokenType): IToken {
        return undefined
    }

    isInCurrentRuleReSyncSet(tokenTypeIdx: TokenType): boolean {
        return false
    }

    reSyncTo(tokType: TokenType): IToken[] {
        return undefined
    }

    shouldInRepetitionRecoveryBeTried(
        expectTokAfterLastMatch?: TokenType,
        nextTokIdx?: number
    ): boolean {
        return false
    }

    tryInRepetitionRecovery(
        grammarRule: Function,
        grammarRuleArgs: any[],
        lookAheadFunc: () => boolean,
        expectedTokType: TokenType
    ): void {}

    tryInRuleRecovery(
        expectedTokType: TokenType,
        follows: TokenType[]
    ): IToken {
        return undefined
    }

    attemptInRepetitionRecovery(
        prodFunc: Function,
        args: any[],
        lookaheadFunc: () => boolean,
        dslMethodIdx: number,
        prodOccurrence: number,
        nextToksWalker: typeof AbstractNextTerminalAfterProductionWalker
    ): void {}

    getCurrentGrammarPath(
        this: Parser,
        tokType: TokenType,
        tokIdxInRule: number
    ): ITokenGrammarPath {
        return undefined
    }

    // TreeBuilder Trait
    cstFinallyStateUpdate(): void {}

    cstInvocationStateUpdate(
        fullRuleName: string,
        shortName: string | number
    ): void {}

    cstNestedFinallyStateUpdate(): void {}

    cstNestedInvocationStateUpdate(
        nestedName: string,
        shortName: string | number
    ): void {}

    cstPostNonTerminal(ruleCstResult: CstNode, ruleName: string): void {}

    cstPostTerminal(key: string, consumedToken: IToken): void {}

    getBaseCstVisitorConstructor(
        this: Parser
    ): {
        new (...args: any[]): ICstVisitor<any, any>
    } {
        return undefined
    }

    getBaseCstVisitorConstructorWithDefaults(
        this: Parser
    ): {
        new (...args: any[]): ICstVisitor<any, any>
    } {
        return undefined
    }

    getLastExplicitRuleOccurrenceIndex(): number {
        return 0
    }

    getLastExplicitRuleOccurrenceIndexNoCst(): number {
        return 0
    }

    getLastExplicitRuleShortName(): string {
        return ""
    }

    getLastExplicitRuleShortNameNoCst(): string {
        return ""
    }

    getPreviousExplicitRuleShortName(): string {
        return ""
    }

    getPreviousExplicitRuleShortNameNoCst(): string {
        return ""
    }

    nestedAltBeforeClause(
        methodOpts: { NAME?: string },
        occurrence: number,
        methodKeyIdx: number,
        altIdx: number
    ): { shortName?: number; nestedName?: string } {
        return undefined
    }

    nestedRuleBeforeClause(
        methodOpts: { NAME?: string },
        laKey: number
    ): string {
        return ""
    }

    nestedRuleFinallyClause(laKey: number, nestedName: string): void {}

    nestedRuleFinallyStateUpdate(): void {}

    nestedRuleInvocationStateUpdate(
        nestedRuleName: string,
        shortNameKey: number
    ): void {}

    // LooksAhead Trait
    getKeyForAutomaticLookahead(
        dslMethodIdx: number,
        occurrence: number
    ): number {
        return 0
    }

    getLaFuncFromCache(key: number): Function {
        return undefined
    }

    getLaFuncFromMap(key: number): Function {
        return undefined
    }

    getLaFuncFromObj(key: number): Function {
        return undefined
    }

    getLookaheadFuncFor(
        key: number,
        occurrence: number,
        maxLookahead: number,
        prodType
    ): () => boolean {
        return undefined
    }

    getLookaheadFuncForAtLeastOne(
        key: number,
        occurrence: number
    ): () => boolean {
        return undefined
    }

    getLookaheadFuncForAtLeastOneSep(
        key: number,
        occurrence: number
    ): () => boolean {
        return undefined
    }

    getLookaheadFuncForMany(key: number, occurrence: number): () => boolean {
        return undefined
    }

    getLookaheadFuncForManySep(key: number, occurrence: number): () => boolean {
        return undefined
    }

    getLookaheadFuncForOption(key: number, occurrence: number): () => boolean {
        return undefined
    }

    getLookaheadFuncForOr(
        occurrence: number,
        alts: IAnyOrAlt<any>[]
    ): () => number {
        return undefined
    }

    lookAheadBuilderForAlternatives(
        alts: lookAheadSequence[],
        hasPredicates: boolean,
        tokenMatcher: TokenMatcher,
        dynamicTokensEnabled: boolean
    ): (orAlts?: IAnyOrAlt<any>[]) => number | undefined {
        return undefined
    }

    lookAheadBuilderForOptional(
        alt: lookAheadSequence,
        tokenMatcher: TokenMatcher,
        dynamicTokensEnabled: boolean
    ): () => boolean {
        return undefined
    }

    setLaFuncCache(key: number, value: Function): void {}

    setLaFuncCacheUsingMap(key: number, value: Function): void {}

    setLaFuncUsingObj(key: number, value: Function): void {}

    // LexerAdaper

    moveToTerminatedState(): void {}

    resetLexerState(): void {}

    LA(howMuch: number): IToken {
        return undefined
    }

    SKIP_TOKEN(): IToken {
        return undefined
    }

    consumeToken(): void {}

    exportLexerState(): number {
        return 0
    }

    getLexerPosition(): number {
        return 0
    }

    importLexerState(newState: number): void {}

    set input(newInput: IToken[]) {}

    atLeastOneInternal<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    atLeastOneInternalLogic<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
        key: number
    ): void {}

    atLeastOneInternalNoCst<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    atLeastOneSepFirstInternal<OUT>(
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {}

    atLeastOneSepFirstInternalLogic<OUT>(
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>,
        key: number
    ): void {}

    atLeastOneSepFirstInternalNoCst<OUT>(
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {}

    defineRule<T>(
        ruleName: string,
        impl: (...implArgs: any[]) => T,
        config: IRuleConfig<T>
    ): (idxInCallingRule?: number, ...args: any[]) => T {
        return function(p1: number, p2: any) {
            return undefined
        }
    }

    doSingleRepetition(action: Function): any {}

    manyInternal<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    manyInternalLogic<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        key: number
    ): void {}

    manyInternalNoCst<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    manySepFirstInternal<OUT>(
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>
    ): void {}

    manySepFirstInternalLogic<OUT>(
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>,
        key: number
    ): void {}

    manySepFirstInternalNoCst<OUT>(
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>
    ): void {}

    optionInternal<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number
    ): OUT {
        return undefined
    }

    optionInternalLogic<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number,
        key: number
    ): OUT {
        return undefined
    }

    optionInternalNoCst<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number
    ): OUT {
        return undefined
    }

    orInternal<T>(
        altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>,
        occurrence: number
    ): T {
        return undefined
    }

    orInternalNoCst<T>(
        altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>,
        occurrence: number
    ): T {
        return undefined
    }

    repetitionSepSecondInternal<OUT>(
        prodOccurrence: number,
        separator: TokenType,
        separatorLookAheadFunc: () => boolean,
        action: GrammarAction<OUT>,
        nextTerminalAfterWalker: typeof AbstractNextTerminalAfterProductionWalker
    ): void {}
}
