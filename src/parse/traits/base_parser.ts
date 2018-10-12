import { IFollowKey, Recoverable } from "./recoverable"
import {
    AtLeastOneSepMethodOpts,
    ConsumeMethodOpts,
    CstNode,
    DSLMethodOpts,
    DSLMethodOptsWithErr,
    GrammarAction,
    IAnyOrAlt,
    ICstVisitor,
    IRecognitionException,
    IRuleConfig,
    IToken,
    ITokenGrammarPath,
    ManySepMethodOpts,
    OrMethodOpts,
    SubruleMethodOpts,
    TokenType
} from "../../../api"
import { AbstractNextTerminalAfterProductionWalker } from "../grammar/interpreter"
import {
    IParserState,
    lookAheadSequence,
    Parser,
    TokenMatcher
} from "../parser_public"
import { TreeBuilder } from "./tree_builder"
import { LooksAhead } from "./looksahead"
import { LexerAdapter } from "./lexer_adapter"
import { RecognizerApi, RecognizerEngine } from "./recognizer"
import { ErrorHandler } from "./error_handler"
import { PROD_TYPE } from "../grammar/lookahead"

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
        RecognizerEngine,
        RecognizerApi,
        ErrorHandler {
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

    getHumanReadableRuleStack(): string[] {
        return []
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
    ): { new (...args: any[]): ICstVisitor<any, any> } {
        return undefined
    }

    getBaseCstVisitorConstructorWithDefaults(
        this: Parser
    ): { new (...args: any[]): ICstVisitor<any, any> } {
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

    // ---------- RecognizerEngine Trait -----------------
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

    consumeInternal(
        tokType: TokenType,
        idx: number,
        options: ConsumeMethodOpts
    ): IToken {
        return undefined
    }

    reloadRecogState(newState: IParserState): void {}

    ruleFinallyStateUpdate(): void {}

    saveRecogState(): IParserState {
        return undefined
    }

    subruleInternal<T>(
        ruleToCall: (idx: number) => T,
        idx: number,
        options?: SubruleMethodOpts
    ): any {}

    ruleInvocationStateUpdate(
        shortName: string,
        fullName: string,
        idxInCallingRule: number
    ): void {}

    isBackTracking(): boolean {
        return false
    }

    getCurrRuleFullName(): string {
        return ""
    }

    shortRuleNameToFullName(shortName: string): string {
        return undefined
    }

    isAtEndOfInput(): boolean {
        return false
    }

    reset(): void {}

    // ---------- RecognizerAPI Trait -----------------
    AT_LEAST_ONE<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {}

    AT_LEAST_ONE_SEP<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP1<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP2<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP3<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP4<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP5<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP6<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP7<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP8<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    AT_LEAST_ONE_SEP9<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {}

    CONSUME(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME1(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME2(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME3(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME4(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME5(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME6(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME7(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME8(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    CONSUME9(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return undefined
    }

    MANY<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {}

    MANY_SEP<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP1<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP2<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP3<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP4<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP5<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP6<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP7<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP8<OUT>(options: ManySepMethodOpts<OUT>): void {}

    MANY_SEP9<OUT>(options: ManySepMethodOpts<OUT>): void {}

    OPTION<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OPTION9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return undefined
    }

    OR<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR1<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR2<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR3<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR4<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR5<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR6<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR7<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR8<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OR9<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return undefined
    }

    OVERRIDE_RULE<T>(
        name: string,
        impl: (...implArgs: any[]) => T,
        config?: IRuleConfig<T>
    ): (idxInCallingRule?: number, ...args: any[]) => T {
        return function(p1: number, p2: any) {
            return undefined
        }
    }

    RULE<T>(
        name: string,
        implementation: (...implArgs: any[]) => T,
        config?: IRuleConfig<T>
    ): (idxInCallingRule?: number, ...args: any[]) => any | T {
        return function(p1: number, p2: any) {
            return undefined
        }
    }

    SUBRULE<T>(ruleToCall: (idx: number) => T, options?: SubruleMethodOpts): T {
        return undefined
    }

    SUBRULE1<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    SUBRULE2<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    SUBRULE3<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    SUBRULE4<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    SUBRULE5<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    SUBRULE6<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    SUBRULE7<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    SUBRULE8<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    SUBRULE9<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return undefined
    }

    BACKTRACK<T>(
        grammarRule: (...args: any[]) => T,
        args?: any[]
    ): () => boolean {
        return function() {
            return false
        }
    }

    // ---------- ErrorHandler Trait -----------------
    SAVE_ERROR(error: IRecognitionException): IRecognitionException {
        return undefined
    }

    get errors(): IRecognitionException[] {
        return []
    }

    raiseEarlyExitException(
        occurrence: number,
        prodType: PROD_TYPE,
        userDefinedErrMsg: string
    ): void {}

    raiseNoAltException(occurrence: number, errMsgTypes: string): void {}
}
