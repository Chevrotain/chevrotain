import { IFollowKey, Recoverable } from "./recoverable"
import {
    CstNode,
    IAnyOrAlt,
    ICstVisitor,
    IToken,
    TokenType
} from "../../../api"
import { AbstractNextTerminalAfterProductionWalker } from "../grammar/interpreter"
import { lookAheadSequence, Parser, TokenMatcher } from "../parser_public"
import { TreeBuilder } from "./tree_builder"
import { LooksAhead } from "./looksahead"
import { LexerAdapter } from "./lexer_adapter"

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
    implements Recoverable, TreeBuilder, LooksAhead, LexerAdapter {
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

    getLastExplicitRuleOccurrenceIndex():number {
        return 0;
    }

    getLastExplicitRuleOccurrenceIndexNoCst():number {
        return 0;
    }

    getLastExplicitRuleShortName():string {
        return "";
    }

    getLastExplicitRuleShortNameNoCst():string {
        return "";
    }

    getPreviousExplicitRuleShortName():string {
        return "";
    }

    getPreviousExplicitRuleShortNameNoCst():string {
        return "";
    }

    nestedAltBeforeClause(methodOpts:{ NAME?:string },
                          occurrence:number,
                          methodKeyIdx:number,
                          altIdx:number):{ shortName?:number; nestedName?:string } {
        return undefined;
    }

    nestedRuleBeforeClause(methodOpts:{ NAME?:string }, laKey:number):string {
        return "";
    }

    nestedRuleFinallyClause(laKey:number, nestedName:string):void {
    }

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

    // TODO: this does not get overriden by applyMixins
    set input(newInput: IToken[]) {}
}
