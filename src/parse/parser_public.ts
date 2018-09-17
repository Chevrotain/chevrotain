import {
    EarlyExitException,
    isRecognitionException,
    MismatchedTokenException,
    NotAllInputParsedException,
    NoViableAltException
} from "./exceptions_public"
import { classNameFromInstance, HashTable } from "../lang/lang_extensions"
import { validateRuleIsOverridden } from "./grammar/checks"
import {
    cloneArr,
    cloneObj,
    contains,
    defaults,
    dropRight,
    every,
    find,
    first,
    flatten,
    forEach,
    has,
    isArray,
    isEmpty,
    isES2015MapSupported,
    isFunction,
    isObject,
    isUndefined,
    map,
    NOOP,
    reduce,
    some,
    uniq,
    values
} from "../utils/utils"
import { computeAllProdsFollows } from "./grammar/follow"
import { createTokenInstance, EOF, tokenName } from "../scan/tokens_public"
import {
    buildAlternativesLookAheadFunc,
    buildLookaheadFuncForOptionalProd,
    buildLookaheadFuncForOr,
    buildSingleAlternativeLookaheadFunction,
    getLookaheadPathsForOptionalProd,
    getLookaheadPathsForOr,
    PROD_TYPE
} from "./grammar/lookahead"
import { buildTopProduction, deserializeGrammar } from "./gast_builder"
import {
    AbstractNextTerminalAfterProductionWalker,
    IFirstAfterRepetition,
    NextAfterTokenWalker,
    nextPossibleTokensAfter,
    NextTerminalAfterAtLeastOneSepWalker,
    NextTerminalAfterAtLeastOneWalker,
    NextTerminalAfterManySepWalker,
    NextTerminalAfterManyWalker
} from "./grammar/interpreter"
import { IN } from "./constants"
import {
    augmentTokenTypes,
    isTokenType,
    tokenStructuredMatcher,
    tokenStructuredMatcherNoCategories
} from "../scan/tokens"
import { addNoneTerminalToCst, addTerminalToCst, analyzeCst } from "./cst/cst"
import {
    AT_LEAST_ONE_IDX,
    AT_LEAST_ONE_SEP_IDX,
    BITS_FOR_METHOD_IDX,
    BITS_FOR_OCCURRENCE_IDX,
    getKeyForAltIndex,
    getKeyForAutomaticLookahead,
    MANY_IDX,
    MANY_SEP_IDX,
    OPTION_IDX,
    OR_IDX
} from "./grammar/keys"
import {
    createBaseSemanticVisitorConstructor,
    createBaseVisitorConstructorWithDefaults
} from "./cst/cst_visitor"
import {
    defaultGrammarValidatorErrorProvider,
    defaultParserErrorProvider
} from "./errors_public"
import { Rule, serializeGrammar } from "./grammar/gast/gast_public"
import {
    resolveGrammar,
    validateGrammar
} from "./grammar/gast/gast_resolver_public"
import {
    AtLeastOneSepMethodOpts,
    ConsumeMethodOpts,
    CstNode,
    DSLMethodOpts,
    DSLMethodOptsWithErr,
    GrammarAction,
    IAnyOrAlt,
    ICstVisitor,
    IgnoredParserIssues,
    IOrAltWithGate,
    IParserConfig,
    IParserDefinitionError,
    IParserErrorMessageProvider,
    IRecognitionException,
    IRuleConfig,
    ISeparatedIterationResult,
    ISerializedGast,
    ISyntacticContentAssistPath,
    IToken,
    ITokenGrammarPath,
    ManySepMethodOpts,
    OrMethodOpts,
    SubruleMethodOpts,
    TokenType,
    TokenVocabulary
} from "../../api"

const IN_RULE_RECOVERY_EXCEPTION = "InRuleRecoveryException"
export const END_OF_FILE = createTokenInstance(
    EOF,
    "",
    NaN,
    NaN,
    NaN,
    NaN,
    NaN,
    NaN
)
Object.freeze(END_OF_FILE)

export type TokenMatcher = (token: IToken, tokType: TokenType) => boolean

export type lookAheadSequence = TokenType[][]

const DEFAULT_PARSER_CONFIG: IParserConfig = Object.freeze({
    recoveryEnabled: false,
    maxLookahead: 4,
    ignoredIssues: <any>{},
    dynamicTokensEnabled: false,
    outputCst: false,
    errorMessageProvider: defaultParserErrorProvider,
    serializedGrammar: null
})

const DEFAULT_RULE_CONFIG: IRuleConfig<any> = Object.freeze({
    recoveryValueFunc: () => undefined,
    resyncEnabled: true
})

export enum ParserDefinitionErrorType {
    INVALID_RULE_NAME = 0,
    DUPLICATE_RULE_NAME = 1,
    INVALID_RULE_OVERRIDE = 2,
    DUPLICATE_PRODUCTIONS = 3,
    UNRESOLVED_SUBRULE_REF = 4,
    LEFT_RECURSION = 5,
    NONE_LAST_EMPTY_ALT = 6,
    AMBIGUOUS_ALTS = 7,
    CONFLICT_TOKENS_RULES_NAMESPACE = 8,
    INVALID_TOKEN_NAME = 9,
    INVALID_NESTED_RULE_NAME = 10,
    DUPLICATE_NESTED_NAME = 11,
    NO_NON_EMPTY_LOOKAHEAD = 12,
    AMBIGUOUS_PREFIX_ALTS = 13,
    TOO_MANY_ALTS = 14
}

export interface IParserDuplicatesDefinitionError
    extends IParserDefinitionError {
    dslName: string
    occurrence: number
    parameter?: string
}

export interface IParserEmptyAlternativeDefinitionError
    extends IParserDefinitionError {
    occurrence: number
    alternative: number
}

export interface IParserAmbiguousAlternativesDefinitionError
    extends IParserDefinitionError {
    occurrence: number
    alternatives: number[]
}

export interface IParserUnresolvedRefDefinitionError
    extends IParserDefinitionError {
    unresolvedRefName: string
}

interface IFollowKey {
    ruleName: string
    idxInCallingRule: number
    inRule: string
}

interface IParserState {
    errors: IRecognitionException[]
    lexerState: any
    RULE_STACK: string[]
    CST_STACK: CstNode[]
    LAST_EXPLICIT_RULE_STACK: number[]
}

export type Predicate = () => boolean

export function EMPTY_ALT<T>(value: T = undefined): () => T {
    return function() {
        return value
    }
}

let EOF_FOLLOW_KEY: any = {}

export class Parser {
    static NO_RESYNC: boolean = false
    // Set this flag to true if you don't want the Parser to throw error when problems in it's definition are detected.
    // (normally during the parser's constructor).
    // This is a design time flag, it will not affect the runtime error handling of the parser, just design time errors,
    // for example: duplicate rule names, referencing an unresolved subrule, ect...
    // This flag should not be enabled during normal usage, it is used in special situations, for example when
    // needing to display the parser definition errors in some GUI(online playground).
    static DEFER_DEFINITION_ERRORS_HANDLING: boolean = false

    /**
     *  @deprecated use the **instance** method with the same name instead
     */
    static performSelfAnalysis(parserInstance: Parser): void {
        parserInstance.performSelfAnalysis()
    }

    public performSelfAnalysis(): void {
        let defErrorsMsgs

        this.selfAnalysisDone = true
        let className = classNameFromInstance(this)

        let productions = this.gastProductionsCache
        if (this.serializedGrammar) {
            const rules = deserializeGrammar(
                this.serializedGrammar,
                this.tokensMap
            )
            forEach(rules, rule => {
                this.gastProductionsCache.put(rule.name, rule)
            })
        }

        let resolverErrors = resolveGrammar({
            rules: productions.values()
        })
        this.definitionErrors.push.apply(this.definitionErrors, resolverErrors) // mutability for the win?

        // only perform additional grammar validations IFF no resolving errors have occurred.
        // as unresolved grammar may lead to unhandled runtime exceptions in the follow up validations.
        if (isEmpty(resolverErrors)) {
            let validationErrors = validateGrammar({
                rules: productions.values(),
                maxLookahead: this.maxLookahead,
                tokenTypes: values(this.tokensMap),
                ignoredIssues: this.ignoredIssues,
                errMsgProvider: defaultGrammarValidatorErrorProvider,
                grammarName: className
            })

            this.definitionErrors.push.apply(
                this.definitionErrors,
                validationErrors
            ) // mutability for the win?
        }

        if (isEmpty(this.definitionErrors)) {
            // this analysis may fail if the grammar is not perfectly valid
            let allFollows = computeAllProdsFollows(productions.values())
            this.resyncFollows = allFollows
        }

        let cstAnalysisResult = analyzeCst(
            productions.values(),
            this.fullRuleNameToShort
        )
        this.allRuleNames = cstAnalysisResult.allRuleNames

        if (
            !Parser.DEFER_DEFINITION_ERRORS_HANDLING &&
            !isEmpty(this.definitionErrors)
        ) {
            defErrorsMsgs = map(
                this.definitionErrors,
                defError => defError.message
            )
            throw new Error(
                `Parser Definition Errors detected:\n ${defErrorsMsgs.join(
                    "\n-------------------------------\n"
                )}`
            )
        }
    }

    // caching
    protected resyncFollows: HashTable<TokenType[]> = new HashTable<
        TokenType[]
    >()
    protected allRuleNames: string[] = []
    protected baseCstVisitorConstructor: Function
    protected baseCstVisitorWithDefaultsConstructor: Function
    protected gastProductionsCache: HashTable<Rule> = new HashTable<Rule>()

    protected _errors: IRecognitionException[] = []

    // These configuration properties are also assigned in the constructor
    // This is a little bit of duplication but seems to help with performance regression on V8
    // Probably due to hidden class changes.
    /**
     * This flag enables or disables error recovery (fault tolerance) of the parser.
     * If this flag is disabled the parser will halt on the first error.
     */
    protected recoveryEnabled: boolean = DEFAULT_PARSER_CONFIG.recoveryEnabled
    protected dynamicTokensEnabled: boolean =
        DEFAULT_PARSER_CONFIG.dynamicTokensEnabled
    protected maxLookahead: number = DEFAULT_PARSER_CONFIG.maxLookahead
    protected ignoredIssues: IgnoredParserIssues =
        DEFAULT_PARSER_CONFIG.ignoredIssues
    protected outputCst: boolean = DEFAULT_PARSER_CONFIG.outputCst
    protected serializedGrammar: ISerializedGast[] =
        DEFAULT_PARSER_CONFIG.serializedGrammar

    // adapters
    protected errorMessageProvider: IParserErrorMessageProvider =
        DEFAULT_PARSER_CONFIG.errorMessageProvider

    protected isBackTrackingStack = []
    protected className: string = "Parser"
    protected RULE_STACK: string[] = []
    protected RULE_OCCURRENCE_STACK: number[] = []
    protected CST_STACK: CstNode[] = []
    protected tokensMap: { [fqn: string]: TokenType } = {}

    /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
    private lookAheadFuncsCache: any = isES2015MapSupported() ? new Map() : []
    private firstAfterRepMap = new HashTable<IFirstAfterRepetition>()
    private definitionErrors: IParserDefinitionError[] = []
    private definedRulesNames: string[] = []

    private shortRuleNameToFull = new HashTable<string>()
    private fullRuleNameToShort = new HashTable<number>()

    // The shortName Index must be coded "after" the first 8bits to enable building unique lookahead keys
    private ruleShortNameIdx = 256
    private tokenMatcher: TokenMatcher = tokenStructuredMatcherNoCategories
    private LAST_EXPLICIT_RULE_STACK: number[] = []
    private selfAnalysisDone = false

    // lexerState
    private tokVector: IToken[] = []
    private tokVectorLength = 0
    private currIdx: number = -1

    constructor(
        input: IToken[],
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig = DEFAULT_PARSER_CONFIG
    ) {
        this.input = input

        // configuration
        this.recoveryEnabled = has(config, "recoveryEnabled")
            ? config.recoveryEnabled
            : DEFAULT_PARSER_CONFIG.recoveryEnabled

        // performance optimization, NOOP will be inlined which
        // effectively means that this optional feature does not exist
        // when not used.
        if (!this.recoveryEnabled) {
            this.attemptInRepetitionRecovery = NOOP
        }

        this.dynamicTokensEnabled = has(config, "dynamicTokensEnabled")
            ? config.dynamicTokensEnabled
            : DEFAULT_PARSER_CONFIG.dynamicTokensEnabled

        this.maxLookahead = has(config, "maxLookahead")
            ? config.maxLookahead
            : DEFAULT_PARSER_CONFIG.maxLookahead

        this.ignoredIssues = has(config, "ignoredIssues")
            ? config.ignoredIssues
            : DEFAULT_PARSER_CONFIG.ignoredIssues

        this.outputCst = has(config, "outputCst")
            ? config.outputCst
            : DEFAULT_PARSER_CONFIG.outputCst

        this.errorMessageProvider = defaults(
            config.errorMessageProvider,
            DEFAULT_PARSER_CONFIG.errorMessageProvider
        )

        this.serializedGrammar = has(config, "serializedGrammar")
            ? config.serializedGrammar
            : DEFAULT_PARSER_CONFIG.serializedGrammar

        // Performance optimization on newer engines that support ES6 Map
        // For larger Maps this is slightly faster than using a plain object (array in our case).
        /* istanbul ignore else - The else branch will be tested on older node.js versions and IE11 */
        if (isES2015MapSupported()) {
            this.getLaFuncFromCache = this.getLaFuncFromMap
            this.setLaFuncCache = this.setLaFuncCacheUsingMap
        } else {
            this.getLaFuncFromCache = this.getLaFuncFromObj
            this.setLaFuncCache = this.setLaFuncUsingObj
        }

        if (!this.outputCst) {
            this.cstInvocationStateUpdate = NOOP
            this.cstFinallyStateUpdate = NOOP
            this.cstPostTerminal = NOOP
            this.cstPostNonTerminal = NOOP
            this.getLastExplicitRuleShortName = this.getLastExplicitRuleShortNameNoCst
            this.getPreviousExplicitRuleShortName = this.getPreviousExplicitRuleShortNameNoCst
            this.getLastExplicitRuleOccurrenceIndex = this.getLastExplicitRuleOccurrenceIndexNoCst
            this.manyInternal = this.manyInternalNoCst
            this.orInternal = this.orInternalNoCst
            this.optionInternal = this.optionInternalNoCst
            this.atLeastOneInternal = this.atLeastOneInternalNoCst
            this.manySepFirstInternal = this.manySepFirstInternalNoCst
            this.atLeastOneSepFirstInternal = this.atLeastOneSepFirstInternalNoCst
        }

        this.className = classNameFromInstance(this)

        if (isArray(tokenVocabulary)) {
            this.tokensMap = <any>reduce(
                <any>tokenVocabulary,
                (acc, tokenClazz: TokenType) => {
                    acc[tokenName(tokenClazz)] = tokenClazz
                    return acc
                },
                {}
            )
        } else if (
            has(tokenVocabulary, "modes") &&
            every(flatten(values((<any>tokenVocabulary).modes)), isTokenType)
        ) {
            let allTokenTypes = flatten(values((<any>tokenVocabulary).modes))
            let uniqueTokens = uniq(allTokenTypes)
            this.tokensMap = <any>reduce(
                uniqueTokens,
                (acc, tokenClazz: TokenType) => {
                    acc[tokenName(tokenClazz)] = tokenClazz
                    return acc
                },
                {}
            )
        } else if (isObject(tokenVocabulary)) {
            this.tokensMap = cloneObj(tokenVocabulary)
        } else {
            throw new Error(
                "<tokensDictionary> argument must be An Array of Token constructors" +
                    " A dictionary of Token constructors or an IMultiModeLexerDefinition"
            )
        }

        const noTokenCategoriesUsed = every(
            values(tokenVocabulary),
            tokenConstructor => isEmpty(tokenConstructor.categoryMatches)
        )
        this.tokenMatcher = noTokenCategoriesUsed
            ? tokenStructuredMatcherNoCategories
            : tokenStructuredMatcher

        // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
        // parsed with a clear error message ("expecting EOF but found ...")
        /* tslint:disable */
        this.tokensMap["EOF"] = EOF
        /* tslint:enable */

        // Because ES2015+ syntax should be supported for creating Token classes
        // We cannot assume that the Token classes were created using the "extendToken" utilities
        // Therefore we must augment the Token classes both on Lexer initialization and on Parser initialization
        augmentTokenTypes(values(this.tokensMap))
    }

    public get errors(): IRecognitionException[] {
        return cloneArr(this._errors)
    }

    public set errors(newErrors: IRecognitionException[]) {
        this._errors = newErrors
    }

    public reset(): void {
        this.resetLexerState()

        this.isBackTrackingStack = []
        this.errors = []
        this.RULE_STACK = []
        this.LAST_EXPLICIT_RULE_STACK = []
        this.CST_STACK = []
        this.RULE_OCCURRENCE_STACK = []
    }

    public isAtEndOfInput(): boolean {
        return this.tokenMatcher(this.LA(1), EOF)
    }

    public getBaseCstVisitorConstructor(): {
        new (...args: any[]): ICstVisitor<any, any>
    } {
        if (isUndefined(this.baseCstVisitorConstructor)) {
            const newBaseCstVisitorConstructor = createBaseSemanticVisitorConstructor(
                this.className,
                this.allRuleNames
            )
            this.baseCstVisitorConstructor = newBaseCstVisitorConstructor
            return newBaseCstVisitorConstructor
        }

        return <any>this.baseCstVisitorConstructor
    }

    public getBaseCstVisitorConstructorWithDefaults(): {
        new (...args: any[]): ICstVisitor<any, any>
    } {
        if (isUndefined(this.baseCstVisitorWithDefaultsConstructor)) {
            const newConstructor = createBaseVisitorConstructorWithDefaults(
                this.className,
                this.allRuleNames,
                this.getBaseCstVisitorConstructor()
            )
            this.baseCstVisitorWithDefaultsConstructor = newConstructor
            return newConstructor
        }

        return <any>this.baseCstVisitorWithDefaultsConstructor
    }

    public getGAstProductions(): HashTable<Rule> {
        return this.gastProductionsCache
    }

    public getSerializedGastProductions(): ISerializedGast[] {
        return serializeGrammar(this.gastProductionsCache.values())
    }

    public computeContentAssist(
        startRuleName: string,
        precedingInput: IToken[]
    ): ISyntacticContentAssistPath[] {
        let startRuleGast = this.gastProductionsCache.get(startRuleName)

        if (isUndefined(startRuleGast)) {
            throw Error(
                `Rule ->${startRuleName}<- does not exist in this grammar.`
            )
        }

        return nextPossibleTokensAfter(
            [startRuleGast],
            precedingInput,
            this.tokenMatcher,
            this.maxLookahead
        )
    }

    BACKTRACK<T>(
        grammarRule: (...args: any[]) => T,
        args?: any[]
    ): () => boolean {
        return function() {
            // save org state
            this.isBackTrackingStack.push(1)
            const orgState = this.saveRecogState()
            try {
                grammarRule.apply(this, args)
                // if no exception was thrown we have succeed parsing the rule.
                return true
            } catch (e) {
                if (isRecognitionException(e)) {
                    return false
                } else {
                    throw e
                }
            } finally {
                this.reloadRecogState(orgState)
                this.isBackTrackingStack.pop()
            }
        }
    }

    protected SAVE_ERROR(error: IRecognitionException): IRecognitionException {
        if (isRecognitionException(error)) {
            error.context = {
                ruleStack: this.getHumanReadableRuleStack(),
                ruleOccurrenceStack: cloneArr(this.RULE_OCCURRENCE_STACK)
            }
            this._errors.push(error)
            return error
        } else {
            throw Error(
                "Trying to save an Error which is not a RecognitionException"
            )
        }
    }

    protected isBackTracking(): boolean {
        return !isEmpty(this.isBackTrackingStack)
    }

    protected getCurrRuleFullName(): string {
        let shortName = this.getLastExplicitRuleShortName()
        return this.shortRuleNameToFull.get(shortName)
    }

    protected shortRuleNameToFullName(shortName: string) {
        return this.shortRuleNameToFull.get(shortName)
    }

    protected getHumanReadableRuleStack(): string[] {
        if (!isEmpty(this.LAST_EXPLICIT_RULE_STACK)) {
            return map(this.LAST_EXPLICIT_RULE_STACK, currIdx =>
                this.shortRuleNameToFullName(this.RULE_STACK[currIdx])
            )
        } else {
            return map(this.RULE_STACK, currShortName =>
                this.shortRuleNameToFullName(currShortName)
            )
        }
    }

    // Parsing DSL
    public CONSUME(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 0, options)
    }

    public CONSUME1(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 1, options)
    }

    public CONSUME2(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 2, options)
    }

    public CONSUME3(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 3, options)
    }

    public CONSUME4(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 4, options)
    }

    public CONSUME5(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 5, options)
    }

    public CONSUME6(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 6, options)
    }

    public CONSUME7(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 7, options)
    }

    public CONSUME8(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 8, options)
    }

    public CONSUME9(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 9, options)
    }

    public SUBRULE<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 0, options)
    }

    public SUBRULE1<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 1, options)
    }

    public SUBRULE2<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 2, options)
    }

    public SUBRULE3<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 3, options)
    }

    public SUBRULE4<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 4, options)
    }

    public SUBRULE5<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 5, options)
    }

    public SUBRULE6<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 6, options)
    }

    public SUBRULE7<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 7, options)
    }

    public SUBRULE8<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 8, options)
    }

    public SUBRULE9<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 9, options)
    }

    public OPTION<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 0)
    }

    public OPTION1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 1)
    }

    public OPTION2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 2)
    }

    public OPTION3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 3)
    }

    public OPTION4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 4)
    }

    public OPTION5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 5)
    }

    public OPTION6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 6)
    }

    public OPTION7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 7)
    }

    public OPTION8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 8)
    }

    public OPTION9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 9)
    }

    public OR<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 0)
    }

    public OR1<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 1)
    }

    public OR2<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 2)
    }

    public OR3<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 3)
    }

    public OR4<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 4)
    }

    public OR5<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 5)
    }

    public OR6<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 6)
    }

    public OR7<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 7)
    }

    public OR8<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 8)
    }

    public OR9<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 9)
    }

    public MANY<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(0, actionORMethodDef, [])
    }

    public MANY1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(1, actionORMethodDef, [])
    }

    public MANY2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(2, actionORMethodDef, [])
    }

    public MANY3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(3, actionORMethodDef, [])
    }

    public MANY4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(4, actionORMethodDef, [])
    }

    public MANY5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(5, actionORMethodDef, [])
    }

    public MANY6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(6, actionORMethodDef, [])
    }

    public MANY7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(7, actionORMethodDef, [])
    }

    public MANY8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(8, actionORMethodDef, [])
    }

    public MANY9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(9, actionORMethodDef, [])
    }

    public MANY_SEP<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(0, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP1<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(1, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP2<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(2, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP3<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(3, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP4<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(4, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP5<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(5, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP6<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(6, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP7<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(7, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP8<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(8, options, {
            values: [],
            separators: []
        })
    }

    public MANY_SEP9<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(9, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(0, actionORMethodDef, [])
    }

    public AT_LEAST_ONE1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(1, actionORMethodDef, [])
    }

    public AT_LEAST_ONE2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(2, actionORMethodDef, [])
    }

    public AT_LEAST_ONE3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(3, actionORMethodDef, [])
    }

    public AT_LEAST_ONE4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(4, actionORMethodDef, [])
    }

    public AT_LEAST_ONE5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(5, actionORMethodDef, [])
    }

    public AT_LEAST_ONE6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(6, actionORMethodDef, [])
    }

    public AT_LEAST_ONE7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(7, actionORMethodDef, [])
    }

    public AT_LEAST_ONE8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(8, actionORMethodDef, [])
    }

    public AT_LEAST_ONE9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(9, actionORMethodDef, [])
    }

    public AT_LEAST_ONE_SEP<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(0, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP1<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(1, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP2<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(2, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP3<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(3, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP4<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(4, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP5<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(5, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP6<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(6, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP7<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(7, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP8<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(8, options, {
            values: [],
            separators: []
        })
    }

    public AT_LEAST_ONE_SEP9<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(9, options, {
            values: [],
            separators: []
        })
    }

    public RULE<T>(
        name: string,
        implementation: (...implArgs: any[]) => T,
        // TODO: how to describe the optional return type of CSTNode? T|CstNode is not good because it is not backward
        // compatible, T|any is very general...
        config: IRuleConfig<T> = DEFAULT_RULE_CONFIG
    ): (idxInCallingRule?: number, ...args: any[]) => T | any {
        if (contains(this.definedRulesNames, name)) {
            const errMsg = defaultGrammarValidatorErrorProvider.buildDuplicateRuleNameError(
                {
                    topLevelRule: name,
                    grammarName: this.className
                }
            )

            const error = {
                message: errMsg,
                type: ParserDefinitionErrorType.DUPLICATE_RULE_NAME,
                ruleName: name
            }
            this.definitionErrors.push(error)
        }

        this.definedRulesNames.push(name)

        // only build the gast representation once.
        if (
            !this.gastProductionsCache.containsKey(name) &&
            !this.serializedGrammar
        ) {
            let gastProduction = buildTopProduction(
                implementation.toString(),
                name,
                this.tokensMap
            )
            this.gastProductionsCache.put(name, gastProduction)
        }

        let ruleImplementation = this.defineRule(name, implementation, config)
        this[name] = ruleImplementation
        return ruleImplementation
    }

    public OVERRIDE_RULE<T>(
        name: string,
        impl: (...implArgs: any[]) => T,
        config: IRuleConfig<T> = DEFAULT_RULE_CONFIG
    ): (idxInCallingRule?: number, ...args: any[]) => T {
        let ruleErrors = []
        ruleErrors = ruleErrors.concat(
            validateRuleIsOverridden(
                name,
                this.definedRulesNames,
                this.className
            )
        )
        this.definitionErrors.push.apply(this.definitionErrors, ruleErrors) // mutability for the win

        // Avoid constructing the GAST if we have serialized it
        if (!this.serializedGrammar) {
            let gastProduction = buildTopProduction(
                impl.toString(),
                name,
                this.tokensMap
            )
            this.gastProductionsCache.put(name, gastProduction)
        }

        let ruleImplementation = this.defineRule(name, impl, config)
        this[name] = ruleImplementation
        return ruleImplementation
    }

    public getTokenToInsert(tokType: TokenType): IToken {
        let tokToInsert = createTokenInstance(
            tokType,
            "",
            NaN,
            NaN,
            NaN,
            NaN,
            NaN,
            NaN
        )
        tokToInsert.isInsertedInRecovery = true
        return tokToInsert
    }

    public canTokenTypeBeInsertedInRecovery(tokType: TokenType) {
        return true
    }

    protected ruleInvocationStateUpdate(
        shortName: string,
        fullName: string,
        idxInCallingRule: number
    ): void {
        this.RULE_OCCURRENCE_STACK.push(idxInCallingRule)
        this.RULE_STACK.push(shortName)
        // NOOP when cst is disabled
        this.cstInvocationStateUpdate(fullName, shortName)
    }

    protected ruleFinallyStateUpdate(): void {
        this.RULE_STACK.pop()
        this.RULE_OCCURRENCE_STACK.pop()

        // NOOP when cst is disabled
        this.cstFinallyStateUpdate()

        if (this.RULE_STACK.length === 0 && !this.isAtEndOfInput()) {
            let firstRedundantTok = this.LA(1)
            let errMsg = this.errorMessageProvider.buildNotAllInputParsedMessage(
                {
                    firstRedundant: firstRedundantTok,
                    ruleName: this.getCurrRuleFullName()
                }
            )
            this.SAVE_ERROR(
                new NotAllInputParsedException(errMsg, firstRedundantTok)
            )
        }
    }

    protected nestedRuleInvocationStateUpdate(
        nestedRuleName: string,
        shortNameKey: number
    ): void {
        this.RULE_OCCURRENCE_STACK.push(1)
        this.RULE_STACK.push(<any>shortNameKey)
        this.cstNestedInvocationStateUpdate(nestedRuleName, shortNameKey)
    }

    protected nestedRuleFinallyStateUpdate(): void {
        this.RULE_STACK.pop()
        this.RULE_OCCURRENCE_STACK.pop()

        // NOOP when cst is disabled
        this.cstNestedFinallyStateUpdate()
    }

    protected getCurrentGrammarPath(
        tokType: TokenType,
        tokIdxInRule: number
    ): ITokenGrammarPath {
        let pathRuleStack: string[] = this.getHumanReadableRuleStack()
        let pathOccurrenceStack: number[] = cloneArr(this.RULE_OCCURRENCE_STACK)
        let grammarPath: any = {
            ruleStack: pathRuleStack,
            occurrenceStack: pathOccurrenceStack,
            lastTok: tokType,
            lastTokOccurrence: tokIdxInRule
        }

        return grammarPath
    }

    // TODO: should this be a member method or a utility? it does not have any state or usage of 'this'...
    // TODO: should this be more explicitly part of the public API?
    public getNextPossibleTokenTypes(
        grammarPath: ITokenGrammarPath
    ): TokenType[] {
        let topRuleName = first(grammarPath.ruleStack)
        let gastProductions = this.getGAstProductions()
        let topProduction = gastProductions.get(topRuleName)
        let nextPossibleTokenTypes = new NextAfterTokenWalker(
            topProduction,
            grammarPath
        ).startWalking()
        return nextPossibleTokenTypes
    }

    protected subruleInternal<T>(
        ruleToCall: (idx: number) => T,
        idx: number,
        options?: SubruleMethodOpts
    ) {
        let ruleResult
        try {
            const args = options !== undefined ? options.ARGS : undefined
            ruleResult = ruleToCall.call(this, idx, args)
            this.cstPostNonTerminal(
                ruleResult,
                options !== undefined && options.LABEL !== undefined
                    ? options.LABEL
                    : (<any>ruleToCall).ruleName
            )
            return ruleResult
        } catch (e) {
            if (isRecognitionException(e) && e.partialCstResult !== undefined) {
                this.cstPostNonTerminal(
                    e.partialCstResult,
                    options !== undefined && options.LABEL !== undefined
                        ? options.LABEL
                        : (<any>ruleToCall).ruleName
                )

                delete e.partialCstResult
            }
            throw e
        }
    }

    /**
     * @param tokType - The Type of Token we wish to consume (Reference to its constructor function).
     * @param idx - Occurrence index of consumed token in the invoking parser rule text
     *         for example:
     *         IDENT (DOT IDENT)*
     *         the first ident will have idx 1 and the second one idx 2
     *         * note that for the second ident the idx is always 2 even if its invoked 30 times in the same rule
     *           the idx is about the position in grammar (source code) and has nothing to do with a specific invocation
     *           details.
     * @param options -
     *
     * @returns {Token} - The consumed Token.
     */
    protected consumeInternal(
        tokType: TokenType,
        idx: number,
        options: ConsumeMethodOpts
    ): IToken {
        let consumedToken
        try {
            let nextToken = this.LA(1)
            if (this.tokenMatcher(nextToken, tokType) === true) {
                this.consumeToken()
                consumedToken = nextToken
            } else {
                let msg
                let previousToken = this.LA(0)
                if (options !== undefined && options.ERR_MSG) {
                    msg = options.ERR_MSG
                } else {
                    msg = this.errorMessageProvider.buildMismatchTokenMessage({
                        expected: tokType,
                        actual: nextToken,
                        previous: previousToken,
                        ruleName: this.getCurrRuleFullName()
                    })
                }
                throw this.SAVE_ERROR(
                    new MismatchedTokenException(msg, nextToken, previousToken)
                )
            }
        } catch (eFromConsumption) {
            // no recovery allowed during backtracking, otherwise backtracking may recover invalid syntax and accept it
            // but the original syntax could have been parsed successfully without any backtracking + recovery
            if (
                this.recoveryEnabled &&
                // TODO: more robust checking of the exception type. Perhaps Typescript extending expressions?
                eFromConsumption.name === "MismatchedTokenException" &&
                !this.isBackTracking()
            ) {
                let follows = this.getFollowsForInRuleRecovery(
                    <any>tokType,
                    idx
                )
                try {
                    consumedToken = this.tryInRuleRecovery(
                        <any>tokType,
                        follows
                    )
                } catch (eFromInRuleRecovery) {
                    if (
                        eFromInRuleRecovery.name === IN_RULE_RECOVERY_EXCEPTION
                    ) {
                        // failed in RuleRecovery.
                        // throw the original error in order to trigger reSync error recovery
                        throw eFromConsumption
                    } else {
                        throw eFromInRuleRecovery
                    }
                }
            } else {
                throw eFromConsumption
            }
        }

        this.cstPostTerminal(
            options !== undefined && options.LABEL !== undefined
                ? options.LABEL
                : tokType.tokenName,
            consumedToken
        )
        return consumedToken
    }

    // other functionality
    private saveRecogState(): IParserState {
        // errors is a getter which will clone the errors array
        let savedErrors = this.errors
        let savedRuleStack = cloneArr(this.RULE_STACK)
        return {
            errors: savedErrors,
            lexerState: this.exportLexerState(),
            RULE_STACK: savedRuleStack,
            CST_STACK: this.CST_STACK,
            LAST_EXPLICIT_RULE_STACK: this.LAST_EXPLICIT_RULE_STACK
        }
    }

    private reloadRecogState(newState: IParserState) {
        this.errors = newState.errors
        this.importLexerState(newState.lexerState)
        this.RULE_STACK = newState.RULE_STACK
    }

    private defineRule<T>(
        ruleName: string,
        impl: (...implArgs: any[]) => T,
        config: IRuleConfig<T>
    ): (idxInCallingRule?: number, ...args: any[]) => T {
        if (this.selfAnalysisDone) {
            throw Error(
                `Grammar rule <${ruleName}> may not be defined after the 'performSelfAnalysis' method has been called'\n` +
                    `Make sure that all grammar rule definitions are done before 'performSelfAnalysis' is called.`
            )
        }
        let resyncEnabled = has(config, "resyncEnabled")
            ? config.resyncEnabled
            : DEFAULT_RULE_CONFIG.resyncEnabled
        let recoveryValueFunc = has(config, "recoveryValueFunc")
            ? config.recoveryValueFunc
            : DEFAULT_RULE_CONFIG.recoveryValueFunc

        // performance optimization: Use small integers as keys for the longer human readable "full" rule names.
        // this greatly improves Map access time (as much as 8% for some performance benchmarks).
        /* tslint:disable */
        let shortName =
            this.ruleShortNameIdx <<
            (BITS_FOR_METHOD_IDX + BITS_FOR_OCCURRENCE_IDX)
        /* tslint:enable */

        this.ruleShortNameIdx++
        this.shortRuleNameToFull.put(shortName, ruleName)
        this.fullRuleNameToShort.put(ruleName, shortName)

        function invokeRuleWithTry(args: any[]) {
            try {
                // TODO: dynamically get rid of this?
                if (this.outputCst === true) {
                    impl.apply(this, args)
                    return this.CST_STACK[this.CST_STACK.length - 1]
                } else {
                    return impl.apply(this, args)
                }
            } catch (e) {
                let isFirstInvokedRule = this.RULE_STACK.length === 1
                // note the reSync is always enabled for the first rule invocation, because we must always be able to
                // reSync with EOF and just output some INVALID ParseTree
                // during backtracking reSync recovery is disabled, otherwise we can't be certain the backtracking
                // path is really the most valid one
                let reSyncEnabled =
                    resyncEnabled &&
                    !this.isBackTracking() &&
                    this.recoveryEnabled

                if (isRecognitionException(e)) {
                    if (reSyncEnabled) {
                        let reSyncTokType = this.findReSyncTokenType()
                        if (this.isInCurrentRuleReSyncSet(reSyncTokType)) {
                            e.resyncedTokens = this.reSyncTo(reSyncTokType)
                            if (this.outputCst) {
                                let partialCstResult = this.CST_STACK[
                                    this.CST_STACK.length - 1
                                ]
                                partialCstResult.recoveredNode = true
                                return partialCstResult
                            } else {
                                return recoveryValueFunc()
                            }
                        } else {
                            if (this.outputCst) {
                                const partialCstResult = this.CST_STACK[
                                    this.CST_STACK.length - 1
                                ]
                                partialCstResult.recoveredNode = true
                                e.partialCstResult = partialCstResult
                            }
                            // to be handled Further up the call stack
                            throw e
                        }
                    } else if (isFirstInvokedRule) {
                        // otherwise a Redundant input error will be created as well and we cannot guarantee that this is indeed the case
                        this.moveToTerminatedState()
                        // the parser should never throw one of its own errors outside its flow.
                        // even if error recovery is disabled
                        return recoveryValueFunc()
                    } else {
                        // to be handled Further up the call stack
                        throw e
                    }
                } else {
                    // some other Error type which we don't know how to handle (for example a built in JavaScript Error)
                    throw e
                }
            } finally {
                this.ruleFinallyStateUpdate()
            }
        }

        let wrappedGrammarRule

        wrappedGrammarRule = function(
            idxInCallingRule: number = 0,
            args: any[]
        ) {
            this.ruleInvocationStateUpdate(
                shortName,
                ruleName,
                idxInCallingRule
            )
            return invokeRuleWithTry.call(this, args)
        }

        let ruleNamePropName = "ruleName"
        wrappedGrammarRule[ruleNamePropName] = ruleName
        return wrappedGrammarRule
    }

    private tryInRepetitionRecovery(
        grammarRule: Function,
        grammarRuleArgs: any[],
        lookAheadFunc: () => boolean,
        expectedTokType: TokenType
    ): void {
        // TODO: can the resyncTokenType be cached?
        let reSyncTokType = this.findReSyncTokenType()
        let savedLexerState = this.exportLexerState()
        let resyncedTokens = []
        let passedResyncPoint = false

        let nextTokenWithoutResync = this.LA(1)
        let currToken = this.LA(1)

        let generateErrorMessage = () => {
            let previousToken = this.LA(0)
            // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
            // the error that would have been thrown
            let msg = this.errorMessageProvider.buildMismatchTokenMessage({
                expected: expectedTokType,
                actual: nextTokenWithoutResync,
                previous: previousToken,
                ruleName: this.getCurrRuleFullName()
            })
            let error = new MismatchedTokenException(
                msg,
                nextTokenWithoutResync,
                this.LA(0)
            )
            // the first token here will be the original cause of the error, this is not part of the resyncedTokens property.
            error.resyncedTokens = dropRight(resyncedTokens)
            this.SAVE_ERROR(error)
        }

        while (!passedResyncPoint) {
            // re-synced to a point where we can safely exit the repetition/
            if (this.tokenMatcher(currToken, expectedTokType)) {
                generateErrorMessage()
                return // must return here to avoid reverting the inputIdx
            } else if (lookAheadFunc.call(this)) {
                // we skipped enough tokens so we can resync right back into another iteration of the repetition grammar rule
                generateErrorMessage()
                // recursive invocation in other to support multiple re-syncs in the same top level repetition grammar rule
                grammarRule.apply(this, grammarRuleArgs)
                return // must return here to avoid reverting the inputIdx
            } else if (this.tokenMatcher(currToken, reSyncTokType)) {
                passedResyncPoint = true
            } else {
                currToken = this.SKIP_TOKEN()
                this.addToResyncTokens(currToken, resyncedTokens)
            }
        }

        // we were unable to find a CLOSER point to resync inside the Repetition, reset the state.
        // The parsing exception we were trying to prevent will happen in the NEXT parsing step. it may be handled by
        // "between rules" resync recovery later in the flow.
        this.importLexerState(savedLexerState)
    }

    private shouldInRepetitionRecoveryBeTried(
        expectTokAfterLastMatch?: TokenType,
        nextTokIdx?: number
    ): boolean {
        // arguments to try and perform resync into the next iteration of the many are missing
        if (expectTokAfterLastMatch === undefined || nextTokIdx === undefined) {
            return false
        }

        // no need to recover, next token is what we expect...
        if (this.tokenMatcher(this.LA(1), expectTokAfterLastMatch)) {
            return false
        }

        // error recovery is disabled during backtracking as it can make the parser ignore a valid grammar path
        // and prefer some backtracking path that includes recovered errors.
        if (this.isBackTracking()) {
            return false
        }

        // if we can perform inRule recovery (single token insertion or deletion) we always prefer that recovery algorithm
        // because if it works, it makes the least amount of changes to the input stream (greedy algorithm)
        //noinspection RedundantIfStatementJS
        if (
            this.canPerformInRuleRecovery(
                expectTokAfterLastMatch,
                this.getFollowsForInRuleRecovery(
                    expectTokAfterLastMatch,
                    nextTokIdx
                )
            )
        ) {
            return false
        }

        return true
    }

    // Error Recovery functionality
    private getFollowsForInRuleRecovery(
        tokType: TokenType,
        tokIdxInRule: number
    ): TokenType[] {
        let grammarPath = this.getCurrentGrammarPath(tokType, tokIdxInRule)
        let follows = this.getNextPossibleTokenTypes(grammarPath)
        return follows
    }

    private tryInRuleRecovery(
        expectedTokType: TokenType,
        follows: TokenType[]
    ): IToken {
        if (this.canRecoverWithSingleTokenInsertion(expectedTokType, follows)) {
            let tokToInsert = this.getTokenToInsert(expectedTokType)
            return tokToInsert
        }

        if (this.canRecoverWithSingleTokenDeletion(expectedTokType)) {
            let nextTok = this.SKIP_TOKEN()
            this.consumeToken()
            return nextTok
        }

        throw new InRuleRecoveryException("sad sad panda")
    }

    private canPerformInRuleRecovery(
        expectedToken: TokenType,
        follows: TokenType[]
    ): boolean {
        return (
            this.canRecoverWithSingleTokenInsertion(expectedToken, follows) ||
            this.canRecoverWithSingleTokenDeletion(expectedToken)
        )
    }

    private canRecoverWithSingleTokenInsertion(
        expectedTokType: TokenType,
        follows: TokenType[]
    ): boolean {
        if (!this.canTokenTypeBeInsertedInRecovery(expectedTokType)) {
            return false
        }

        // must know the possible following tokens to perform single token insertion
        if (isEmpty(follows)) {
            return false
        }

        let mismatchedTok = this.LA(1)
        let isMisMatchedTokInFollows =
            find(follows, (possibleFollowsTokType: TokenType) => {
                return this.tokenMatcher(mismatchedTok, possibleFollowsTokType)
            }) !== undefined

        return isMisMatchedTokInFollows
    }

    private canRecoverWithSingleTokenDeletion(
        expectedTokType: TokenType
    ): boolean {
        let isNextTokenWhatIsExpected = this.tokenMatcher(
            this.LA(2),
            expectedTokType
        )
        return isNextTokenWhatIsExpected
    }

    private isInCurrentRuleReSyncSet(tokenTypeIdx: TokenType): boolean {
        let followKey = this.getCurrFollowKey()
        let currentRuleReSyncSet = this.getFollowSetFromFollowKey(followKey)
        return contains(currentRuleReSyncSet, tokenTypeIdx)
    }

    private findReSyncTokenType(): TokenType {
        let allPossibleReSyncTokTypes = this.flattenFollowSet()
        // this loop will always terminate as EOF is always in the follow stack and also always (virtually) in the input
        let nextToken = this.LA(1)
        let k = 2
        while (true) {
            let nextTokenType: any = nextToken.tokenType
            if (contains(allPossibleReSyncTokTypes, nextTokenType)) {
                return nextTokenType
            }
            nextToken = this.LA(k)
            k++
        }
    }

    private getCurrFollowKey(): IFollowKey {
        // the length is at least one as we always add the ruleName to the stack before invoking the rule.
        if (this.RULE_STACK.length === 1) {
            return EOF_FOLLOW_KEY
        }

        let currRuleShortName = this.getLastExplicitRuleShortName()
        let currRuleIdx = this.getLastExplicitRuleOccurrenceIndex()
        let prevRuleShortName = this.getPreviousExplicitRuleShortName()

        return {
            ruleName: this.shortRuleNameToFullName(currRuleShortName),
            idxInCallingRule: currRuleIdx,
            inRule: this.shortRuleNameToFullName(prevRuleShortName)
        }
    }

    private buildFullFollowKeyStack(): IFollowKey[] {
        let explicitRuleStack = this.RULE_STACK
        let explicitOccurrenceStack = this.RULE_OCCURRENCE_STACK

        if (!isEmpty(this.LAST_EXPLICIT_RULE_STACK)) {
            explicitRuleStack = map(
                this.LAST_EXPLICIT_RULE_STACK,
                idx => this.RULE_STACK[idx]
            )
            explicitOccurrenceStack = map(
                this.LAST_EXPLICIT_RULE_STACK,
                idx => this.RULE_OCCURRENCE_STACK[idx]
            )
        }

        // TODO: only iterate over explicit rules here
        return map(explicitRuleStack, (ruleName, idx) => {
            if (idx === 0) {
                return EOF_FOLLOW_KEY
            }
            return {
                ruleName: this.shortRuleNameToFullName(ruleName),
                idxInCallingRule: explicitOccurrenceStack[idx],
                inRule: this.shortRuleNameToFullName(explicitRuleStack[idx - 1])
            }
        })
    }

    private flattenFollowSet(): TokenType[] {
        let followStack = map(this.buildFullFollowKeyStack(), currKey => {
            return this.getFollowSetFromFollowKey(currKey)
        })
        return <any>flatten(followStack)
    }

    private getFollowSetFromFollowKey(followKey: IFollowKey): TokenType[] {
        if (followKey === EOF_FOLLOW_KEY) {
            return [EOF]
        }

        let followName =
            followKey.ruleName +
            followKey.idxInCallingRule +
            IN +
            followKey.inRule

        return this.resyncFollows.get(followName)
    }

    // It does not make any sense to include a virtual EOF token in the list of resynced tokens
    // as EOF does not really exist and thus does not contain any useful information (line/column numbers)
    private addToResyncTokens(token: IToken, resyncTokens: IToken[]): IToken[] {
        if (!this.tokenMatcher(token, EOF)) {
            resyncTokens.push(token)
        }
        return resyncTokens
    }

    private reSyncTo(tokType: TokenType): IToken[] {
        let resyncedTokens = []
        let nextTok = this.LA(1)
        while (this.tokenMatcher(nextTok, tokType) === false) {
            nextTok = this.SKIP_TOKEN()
            this.addToResyncTokens(nextTok, resyncedTokens)
        }
        // the last token is not part of the error.
        return dropRight(resyncedTokens)
    }

    private attemptInRepetitionRecovery(
        prodFunc: Function,
        args: any[],
        lookaheadFunc: () => boolean,
        dslMethodIdx: number,
        prodOccurrence: number,
        nextToksWalker: typeof AbstractNextTerminalAfterProductionWalker
    ) {
        let key = this.getKeyForAutomaticLookahead(dslMethodIdx, prodOccurrence)
        let firstAfterRepInfo = this.firstAfterRepMap.get(<any>key)
        if (firstAfterRepInfo === undefined) {
            let currRuleName = this.getCurrRuleFullName()
            let ruleGrammar = this.getGAstProductions().get(currRuleName)
            let walker: AbstractNextTerminalAfterProductionWalker = new nextToksWalker(
                ruleGrammar,
                prodOccurrence
            )
            firstAfterRepInfo = walker.startWalking()
            this.firstAfterRepMap.put(key, firstAfterRepInfo)
        }

        let expectTokAfterLastMatch = firstAfterRepInfo.token
        let nextTokIdx = firstAfterRepInfo.occurrence
        let isEndOfRule = firstAfterRepInfo.isEndOfRule

        // special edge case of a TOP most repetition after which the input should END.
        // this will force an attempt for inRule recovery in that scenario.
        if (
            this.RULE_STACK.length === 1 &&
            isEndOfRule &&
            expectTokAfterLastMatch === undefined
        ) {
            expectTokAfterLastMatch = EOF
            nextTokIdx = 1
        }

        if (
            this.shouldInRepetitionRecoveryBeTried(
                expectTokAfterLastMatch,
                nextTokIdx
            )
        ) {
            // TODO: performance optimization: instead of passing the original args here, we modify
            // the args param (or create a new one) and make sure the lookahead func is explicitly provided
            // to avoid searching the cache for it once more.
            this.tryInRepetitionRecovery(
                prodFunc,
                args,
                lookaheadFunc,
                expectTokAfterLastMatch
            )
        }
    }

    private cstNestedInvocationStateUpdate(
        nestedName: string,
        shortName: string | number
    ): void {
        this.CST_STACK.push({
            name: nestedName,
            fullName:
                this.shortRuleNameToFull.get(
                    this.getLastExplicitRuleShortName()
                ) + nestedName,
            children: {}
        })
    }

    private cstInvocationStateUpdate(
        fullRuleName: string,
        shortName: string | number
    ): void {
        this.LAST_EXPLICIT_RULE_STACK.push(this.RULE_STACK.length - 1)
        this.CST_STACK.push({
            name: fullRuleName,
            children: {}
        })
    }

    private cstFinallyStateUpdate(): void {
        this.LAST_EXPLICIT_RULE_STACK.pop()
        this.CST_STACK.pop()
    }

    private cstNestedFinallyStateUpdate(): void {
        this.CST_STACK.pop()
    }

    // Implementation of parsing DSL
    private optionInternal<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number
    ): OUT {
        let key = this.getKeyForAutomaticLookahead(OPTION_IDX, occurrence)
        let nestedName = this.nestedRuleBeforeClause(
            actionORMethodDef as DSLMethodOpts<OUT>,
            key
        )
        try {
            return this.optionInternalLogic(actionORMethodDef, occurrence, key)
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(key, nestedName)
            }
        }
    }

    private optionInternalNoCst<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number
    ): OUT {
        let key = this.getKeyForAutomaticLookahead(OPTION_IDX, occurrence)
        return this.optionInternalLogic(actionORMethodDef, occurrence, key)
    }

    private optionInternalLogic<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number,
        key: number
    ): OUT {
        let lookAheadFunc = this.getLookaheadFuncForOption(key, occurrence)
        let action
        let predicate
        if ((<DSLMethodOpts<OUT>>actionORMethodDef).DEF !== undefined) {
            action = (<DSLMethodOpts<OUT>>actionORMethodDef).DEF
            predicate = (<DSLMethodOpts<OUT>>actionORMethodDef).GATE
            // predicate present
            if (predicate !== undefined) {
                let orgLookaheadFunction = lookAheadFunc
                lookAheadFunc = () => {
                    return (
                        predicate.call(this) && orgLookaheadFunction.call(this)
                    )
                }
            }
        } else {
            action = actionORMethodDef
        }

        if (lookAheadFunc.call(this) === true) {
            return action.call(this)
        }
        return undefined
    }

    private atLeastOneInternal<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
        result: OUT[]
    ): OUT[] {
        let laKey = this.getKeyForAutomaticLookahead(
            AT_LEAST_ONE_IDX,
            prodOccurrence
        )
        let nestedName = this.nestedRuleBeforeClause(
            actionORMethodDef as DSLMethodOptsWithErr<OUT>,
            laKey
        )
        try {
            return this.atLeastOneInternalLogic(
                prodOccurrence,
                actionORMethodDef,
                result,
                laKey
            )
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    private atLeastOneInternalNoCst<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
        result: OUT[]
    ): OUT[] {
        let key = this.getKeyForAutomaticLookahead(
            AT_LEAST_ONE_IDX,
            prodOccurrence
        )
        return this.atLeastOneInternalLogic(
            prodOccurrence,
            actionORMethodDef,
            result,
            key
        )
    }

    private atLeastOneInternalLogic<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
        result: OUT[],
        key: number
    ): OUT[] {
        let lookAheadFunc = this.getLookaheadFuncForAtLeastOne(
            key,
            prodOccurrence
        )

        let action
        let predicate
        if ((<DSLMethodOptsWithErr<OUT>>actionORMethodDef).DEF !== undefined) {
            action = (<DSLMethodOptsWithErr<OUT>>actionORMethodDef).DEF
            predicate = (<DSLMethodOptsWithErr<OUT>>actionORMethodDef).GATE
            // predicate present
            if (predicate !== undefined) {
                let orgLookaheadFunction = lookAheadFunc
                lookAheadFunc = () => {
                    return (
                        predicate.call(this) && orgLookaheadFunction.call(this)
                    )
                }
            }
        } else {
            action = actionORMethodDef
        }

        if ((<Function>lookAheadFunc).call(this) === true) {
            result.push((<any>action).call(this))
            while ((<Function>lookAheadFunc).call(this) === true) {
                result.push(this.doSingleRepetition(action))
            }
        } else {
            throw this.raiseEarlyExitException(
                prodOccurrence,
                PROD_TYPE.REPETITION_MANDATORY,
                (<DSLMethodOptsWithErr<OUT>>actionORMethodDef).ERR_MSG
            )
        }

        // note that while it may seem that this can cause an error because by using a recursive call to
        // AT_LEAST_ONE we change the grammar to AT_LEAST_TWO, AT_LEAST_THREE ... , the possible recursive call
        // from the tryInRepetitionRecovery(...) will only happen IFF there really are TWO/THREE/.... items.

        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
        this.attemptInRepetitionRecovery(
            this.atLeastOneInternal,
            [prodOccurrence, actionORMethodDef, result],
            <any>lookAheadFunc,
            AT_LEAST_ONE_IDX,
            prodOccurrence,
            NextTerminalAfterAtLeastOneWalker
        )

        return result
    }

    private atLeastOneSepFirstInternal<OUT>(
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>,
        result: ISeparatedIterationResult<OUT>
    ): ISeparatedIterationResult<OUT> {
        let laKey = this.getKeyForAutomaticLookahead(
            AT_LEAST_ONE_SEP_IDX,
            prodOccurrence
        )
        let nestedName = this.nestedRuleBeforeClause(options, laKey)
        try {
            return this.atLeastOneSepFirstInternalLogic(
                prodOccurrence,
                options,
                result,
                laKey
            )
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    private atLeastOneSepFirstInternalNoCst<OUT>(
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>,
        result: ISeparatedIterationResult<OUT>
    ): ISeparatedIterationResult<OUT> {
        let laKey = this.getKeyForAutomaticLookahead(
            AT_LEAST_ONE_SEP_IDX,
            prodOccurrence
        )
        return this.atLeastOneSepFirstInternalLogic(
            prodOccurrence,
            options,
            result,
            laKey
        )
    }

    private atLeastOneSepFirstInternalLogic<OUT>(
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>,
        result: ISeparatedIterationResult<OUT>,
        key: number
    ): ISeparatedIterationResult<OUT> {
        let action = options.DEF
        let separator = options.SEP

        let firstIterationLookaheadFunc = this.getLookaheadFuncForAtLeastOneSep(
            key,
            prodOccurrence
        )

        let values = result.values
        let separators = result.separators

        // 1st iteration
        if (firstIterationLookaheadFunc.call(this) === true) {
            values.push((<GrammarAction<OUT>>action).call(this))

            //  TODO: Optimization can move this function construction into "attemptInRepetitionRecovery"
            //  because it is only needed in error recovery scenarios.
            let separatorLookAheadFunc = () => {
                return this.tokenMatcher(this.LA(1), separator)
            }

            // 2nd..nth iterations
            while (this.tokenMatcher(this.LA(1), separator) === true) {
                // note that this CONSUME will never enter recovery because
                // the separatorLookAheadFunc checks that the separator really does exist.
                separators.push(this.CONSUME(separator))
                // No need for checking infinite loop here due to consuming the separator.
                values.push((<GrammarAction<OUT>>action).call(this))
            }

            // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
            this.attemptInRepetitionRecovery(
                this.repetitionSepSecondInternal,
                [
                    prodOccurrence,
                    separator,
                    separatorLookAheadFunc,
                    action,
                    NextTerminalAfterAtLeastOneSepWalker,
                    result
                ],
                separatorLookAheadFunc,
                AT_LEAST_ONE_SEP_IDX,
                prodOccurrence,
                NextTerminalAfterAtLeastOneSepWalker
            )
        } else {
            throw this.raiseEarlyExitException(
                prodOccurrence,
                PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
                options.ERR_MSG
            )
        }

        return result
    }

    private manyInternal<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        result: OUT[]
    ): OUT[] {
        let laKey = this.getKeyForAutomaticLookahead(MANY_IDX, prodOccurrence)
        let nestedName = this.nestedRuleBeforeClause(
            actionORMethodDef as DSLMethodOpts<OUT>,
            laKey
        )
        try {
            return this.manyInternalLogic(
                prodOccurrence,
                actionORMethodDef,
                result,
                laKey
            )
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    private manyInternalNoCst<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        result: OUT[]
    ): OUT[] {
        let laKey = this.getKeyForAutomaticLookahead(MANY_IDX, prodOccurrence)
        return this.manyInternalLogic(
            prodOccurrence,
            actionORMethodDef,
            result,
            laKey
        )
    }

    private manyInternalLogic<OUT>(
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        result: OUT[],
        key: number
    ): OUT[] {
        let lookaheadFunction = this.getLookaheadFuncForMany(
            key,
            prodOccurrence
        )

        let action
        let predicate
        if ((<DSLMethodOpts<OUT>>actionORMethodDef).DEF !== undefined) {
            action = (<DSLMethodOpts<OUT>>actionORMethodDef).DEF
            predicate = (<DSLMethodOpts<OUT>>actionORMethodDef).GATE
            // predicate present
            if (predicate !== undefined) {
                let orgLookaheadFunction = lookaheadFunction
                lookaheadFunction = () => {
                    return (
                        predicate.call(this) && orgLookaheadFunction.call(this)
                    )
                }
            }
        } else {
            action = actionORMethodDef
        }

        while (lookaheadFunction.call(this)) {
            result.push(this.doSingleRepetition(action))
        }

        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
        this.attemptInRepetitionRecovery(
            this.manyInternal,
            [prodOccurrence, actionORMethodDef, result],
            <any>lookaheadFunction,
            MANY_IDX,
            prodOccurrence,
            NextTerminalAfterManyWalker
        )

        return result
    }

    private manySepFirstInternal<OUT>(
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>,
        result: ISeparatedIterationResult<OUT>
    ): ISeparatedIterationResult<OUT> {
        let laKey = this.getKeyForAutomaticLookahead(
            MANY_SEP_IDX,
            prodOccurrence
        )
        let nestedName = this.nestedRuleBeforeClause(options, laKey)
        try {
            return this.manySepFirstInternalLogic(
                prodOccurrence,
                options,
                result,
                laKey
            )
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    private manySepFirstInternalNoCst<OUT>(
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>,
        result: ISeparatedIterationResult<OUT>
    ): ISeparatedIterationResult<OUT> {
        let laKey = this.getKeyForAutomaticLookahead(
            MANY_SEP_IDX,
            prodOccurrence
        )
        return this.manySepFirstInternalLogic(
            prodOccurrence,
            options,
            result,
            laKey
        )
    }

    private manySepFirstInternalLogic<OUT>(
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>,
        result: ISeparatedIterationResult<OUT>,
        key: number
    ): ISeparatedIterationResult<OUT> {
        let action = options.DEF
        let separator = options.SEP

        let firstIterationLaFunc = this.getLookaheadFuncForManySep(
            key,
            prodOccurrence
        )

        let values = result.values
        let separators = result.separators

        // 1st iteration
        if (firstIterationLaFunc.call(this) === true) {
            values.push(action.call(this))

            let separatorLookAheadFunc = () => {
                return this.tokenMatcher(this.LA(1), separator)
            }
            // 2nd..nth iterations
            while (this.tokenMatcher(this.LA(1), separator) === true) {
                // note that this CONSUME will never enter recovery because
                // the separatorLookAheadFunc checks that the separator really does exist.
                separators.push(this.CONSUME(separator))
                // No need for checking infinite loop here due to consuming the separator.
                values.push(action.call(this))
            }

            // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
            this.attemptInRepetitionRecovery(
                this.repetitionSepSecondInternal,
                [
                    prodOccurrence,
                    separator,
                    separatorLookAheadFunc,
                    action,
                    NextTerminalAfterManySepWalker,
                    result
                ],
                separatorLookAheadFunc,
                MANY_SEP_IDX,
                prodOccurrence,
                NextTerminalAfterManySepWalker
            )
        }
        return result
    }

    private repetitionSepSecondInternal<OUT>(
        prodOccurrence: number,
        separator: TokenType,
        separatorLookAheadFunc: () => boolean,
        action: GrammarAction<OUT>,
        nextTerminalAfterWalker: typeof AbstractNextTerminalAfterProductionWalker,
        result: ISeparatedIterationResult<OUT>
    ): void {
        while (separatorLookAheadFunc()) {
            // note that this CONSUME will never enter recovery because
            // the separatorLookAheadFunc checks that the separator really does exist.
            result.separators.push(this.CONSUME(separator))
            result.values.push(action.call(this))
        }

        // we can only arrive to this function after an error
        // has occurred (hence the name 'second') so the following
        // IF will always be entered, its possible to remove it...
        // however it is kept to avoid confusion and be consistent.
        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
        /* istanbul ignore else */
        this.attemptInRepetitionRecovery(
            this.repetitionSepSecondInternal,
            [
                prodOccurrence,
                separator,
                separatorLookAheadFunc,
                action,
                nextTerminalAfterWalker,
                result
            ],
            separatorLookAheadFunc,
            AT_LEAST_ONE_SEP_IDX,
            prodOccurrence,
            nextTerminalAfterWalker
        )
    }

    private doSingleRepetition(action: Function): any {
        const beforeIteration = this.getLexerPosition()
        const result = action.call(this)
        const afterIteration = this.getLexerPosition()

        if (afterIteration === beforeIteration) {
            throw Error(
                "Infinite loop detected\n" +
                    "\tSee: https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#INFINITE_LOOP\n" +
                    "\tFor Further details."
            )
        }

        return result
    }

    private orInternalNoCst<T>(
        altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>,
        occurrence: number
    ): T {
        let alts = isArray(altsOrOpts)
            ? (altsOrOpts as IAnyOrAlt<T>[])
            : (altsOrOpts as OrMethodOpts<T>).DEF
        let laFunc = this.getLookaheadFuncForOr(occurrence, alts)
        let altIdxToTake = laFunc.call(this, alts)
        if (altIdxToTake !== undefined) {
            let chosenAlternative: any = alts[altIdxToTake]
            return chosenAlternative.ALT.call(this)
        }
        this.raiseNoAltException(
            occurrence,
            (altsOrOpts as OrMethodOpts<T>).ERR_MSG
        )
    }

    private orInternal<T>(
        altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>,
        occurrence: number
    ): T {
        let laKey = this.getKeyForAutomaticLookahead(OR_IDX, occurrence)
        let nestedName = this.nestedRuleBeforeClause(
            <OrMethodOpts<T>>altsOrOpts,
            laKey
        )

        try {
            let alts = isArray(altsOrOpts)
                ? (altsOrOpts as IAnyOrAlt<T>[])
                : (altsOrOpts as OrMethodOpts<T>).DEF

            let laFunc = this.getLookaheadFuncForOr(occurrence, alts)
            let altIdxToTake = laFunc.call(this, alts)
            if (altIdxToTake !== undefined) {
                let chosenAlternative: any = alts[altIdxToTake]
                let nestedAltBeforeClauseResult = this.nestedAltBeforeClause(
                    chosenAlternative,
                    occurrence,
                    OR_IDX,
                    altIdxToTake
                )
                try {
                    return chosenAlternative.ALT.call(this)
                } finally {
                    if (nestedAltBeforeClauseResult !== undefined) {
                        this.nestedRuleFinallyClause(
                            nestedAltBeforeClauseResult.shortName,
                            nestedAltBeforeClauseResult.nestedName
                        )
                    }
                }
            }
            this.raiseNoAltException(
                occurrence,
                (altsOrOpts as OrMethodOpts<T>).ERR_MSG
            )
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    // this actually returns a number, but it is always used as a string (object prop key)
    private getKeyForAutomaticLookahead(
        dslMethodIdx: number,
        occurrence: number
    ): number {
        let currRuleShortName: any = this.getLastExplicitRuleShortName()
        return getKeyForAutomaticLookahead(
            currRuleShortName,
            dslMethodIdx,
            occurrence
        )
    }

    private getLookaheadFuncForOr(
        occurrence: number,
        alts: IAnyOrAlt<any>[]
    ): () => number {
        let key = this.getKeyForAutomaticLookahead(OR_IDX, occurrence)
        let laFunc: any = this.getLaFuncFromCache(key)
        if (laFunc === undefined) {
            let ruleName = this.getCurrRuleFullName()
            let ruleGrammar = this.getGAstProductions().get(ruleName)
            // note that hasPredicates is only computed once.
            let hasPredicates = some(alts, currAlt =>
                isFunction((<IOrAltWithGate<any>>currAlt).GATE)
            )
            laFunc = buildLookaheadFuncForOr(
                occurrence,
                ruleGrammar,
                this.maxLookahead,
                hasPredicates,
                this.dynamicTokensEnabled,
                this.lookAheadBuilderForAlternatives
            )
            this.setLaFuncCache(key, laFunc)
            return laFunc
        } else {
            return laFunc
        }
    }

    // Automatic lookahead calculation
    private getLookaheadFuncForOption(
        key: number,
        occurrence: number
    ): () => boolean {
        return this.getLookaheadFuncFor(
            key,
            occurrence,
            this.maxLookahead,
            PROD_TYPE.OPTION
        )
    }

    private getLookaheadFuncForMany(
        key: number,
        occurrence: number
    ): () => boolean {
        return this.getLookaheadFuncFor(
            key,
            occurrence,
            this.maxLookahead,
            PROD_TYPE.REPETITION
        )
    }

    private getLookaheadFuncForManySep(
        key: number,
        occurrence: number
    ): () => boolean {
        return this.getLookaheadFuncFor(
            key,
            occurrence,
            this.maxLookahead,
            PROD_TYPE.REPETITION_WITH_SEPARATOR
        )
    }

    private getLookaheadFuncForAtLeastOne(
        key: number,
        occurrence: number
    ): () => boolean {
        return this.getLookaheadFuncFor(
            key,
            occurrence,
            this.maxLookahead,
            PROD_TYPE.REPETITION_MANDATORY
        )
    }

    private getLookaheadFuncForAtLeastOneSep(
        key: number,
        occurrence: number
    ): () => boolean {
        return this.getLookaheadFuncFor(
            key,
            occurrence,
            this.maxLookahead,
            PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR
        )
    }

    // TODO: consider caching the error message computed information
    private raiseNoAltException(occurrence: number, errMsgTypes: string): void {
        let ruleName = this.getCurrRuleFullName()
        let ruleGrammar = this.getGAstProductions().get(ruleName)
        // TODO: getLookaheadPathsForOr can be slow for large enough maxLookahead and certain grammars, consider caching ?
        let lookAheadPathsPerAlternative = getLookaheadPathsForOr(
            occurrence,
            ruleGrammar,
            this.maxLookahead
        )

        let actualTokens = []
        for (let i = 1; i < this.maxLookahead; i++) {
            actualTokens.push(this.LA(i))
        }
        let previousToken = this.LA(0)

        let errMsg = this.errorMessageProvider.buildNoViableAltMessage({
            expectedPathsPerAlt: lookAheadPathsPerAlternative,
            actual: actualTokens,
            previous: previousToken,
            customUserDescription: errMsgTypes,
            ruleName: this.getCurrRuleFullName()
        })

        throw this.SAVE_ERROR(
            new NoViableAltException(errMsg, this.LA(1), previousToken)
        )
    }

    private getLookaheadFuncFor(
        key: number,
        occurrence: number,
        maxLookahead: number,
        prodType
    ): () => boolean {
        let laFunc = <any>this.getLaFuncFromCache(key)
        if (laFunc === undefined) {
            let ruleName = this.getCurrRuleFullName()
            let ruleGrammar = this.getGAstProductions().get(ruleName)
            laFunc = buildLookaheadFuncForOptionalProd(
                occurrence,
                ruleGrammar,
                maxLookahead,
                this.dynamicTokensEnabled,
                prodType,
                this.lookAheadBuilderForOptional
            )
            this.setLaFuncCache(key, laFunc)
            return laFunc
        } else {
            return laFunc
        }
    }

    // TODO: consider caching the error message computed information
    private raiseEarlyExitException(
        occurrence: number,
        prodType: PROD_TYPE,
        userDefinedErrMsg: string
    ): void {
        let ruleName = this.getCurrRuleFullName()
        let ruleGrammar = this.getGAstProductions().get(ruleName)
        let lookAheadPathsPerAlternative = getLookaheadPathsForOptionalProd(
            occurrence,
            ruleGrammar,
            prodType,
            this.maxLookahead
        )
        let insideProdPaths = lookAheadPathsPerAlternative[0]
        let actualTokens = []
        for (let i = 1; i < this.maxLookahead; i++) {
            actualTokens.push(this.LA(i))
        }
        let msg = this.errorMessageProvider.buildEarlyExitMessage({
            expectedIterationPaths: insideProdPaths,
            actual: actualTokens,
            previous: this.LA(0),
            customUserDescription: userDefinedErrMsg,
            ruleName: ruleName
        })

        throw this.SAVE_ERROR(
            new EarlyExitException(msg, this.LA(1), this.LA(0))
        )
    }

    private getLastExplicitRuleShortName(): string {
        let lastExplictIndex = this.LAST_EXPLICIT_RULE_STACK[
            this.LAST_EXPLICIT_RULE_STACK.length - 1
        ]
        return this.RULE_STACK[lastExplictIndex]
    }

    private getLastExplicitRuleShortNameNoCst(): string {
        let ruleStack = this.RULE_STACK
        return ruleStack[ruleStack.length - 1]
    }

    private getPreviousExplicitRuleShortName(): string {
        let lastExplicitIndex = this.LAST_EXPLICIT_RULE_STACK[
            this.LAST_EXPLICIT_RULE_STACK.length - 2
        ]
        return this.RULE_STACK[lastExplicitIndex]
    }

    private getPreviousExplicitRuleShortNameNoCst(): string {
        let ruleStack = this.RULE_STACK
        return ruleStack[ruleStack.length - 2]
    }

    private getLastExplicitRuleOccurrenceIndex(): number {
        let lastExplicitIndex = this.LAST_EXPLICIT_RULE_STACK[
            this.LAST_EXPLICIT_RULE_STACK.length - 1
        ]
        return this.RULE_OCCURRENCE_STACK[lastExplicitIndex]
    }

    private getLastExplicitRuleOccurrenceIndexNoCst(): number {
        let occurrenceStack = this.RULE_OCCURRENCE_STACK
        return occurrenceStack[occurrenceStack.length - 1]
    }

    private nestedRuleBeforeClause(
        methodOpts: { NAME?: string },
        laKey: number
    ): string {
        let nestedName
        if (methodOpts.NAME !== undefined) {
            nestedName = methodOpts.NAME
            this.nestedRuleInvocationStateUpdate(nestedName, laKey)
            return nestedName
        } else {
            return undefined
        }
    }

    private nestedAltBeforeClause(
        methodOpts: { NAME?: string },
        occurrence: number,
        methodKeyIdx: number,
        altIdx: number
    ): { shortName?: number; nestedName?: string } {
        let ruleIdx = this.getLastExplicitRuleShortName()
        let shortName = getKeyForAltIndex(
            <any>ruleIdx,
            methodKeyIdx,
            occurrence,
            altIdx
        )
        let nestedName
        if (methodOpts.NAME !== undefined) {
            nestedName = methodOpts.NAME
            this.nestedRuleInvocationStateUpdate(nestedName, shortName)
            return {
                shortName,
                nestedName
            }
        } else {
            return undefined
        }
    }

    private nestedRuleFinallyClause(laKey: number, nestedName: string): void {
        let cstStack = this.CST_STACK
        let nestedRuleCst = cstStack[cstStack.length - 1]
        this.nestedRuleFinallyStateUpdate()
        // this return a different result than the previous invocation because "nestedRuleFinallyStateUpdate" pops the cst stack
        let parentCstNode = cstStack[cstStack.length - 1]
        addNoneTerminalToCst(parentCstNode, nestedName, nestedRuleCst)
    }

    private cstPostTerminal(key: string, consumedToken: IToken): void {
        // TODO: would save the "current rootCST be faster than locating it for each terminal?
        let rootCst = this.CST_STACK[this.CST_STACK.length - 1]
        addTerminalToCst(rootCst, consumedToken, key)
    }

    private cstPostNonTerminal(ruleCstResult: CstNode, ruleName: string): void {
        addNoneTerminalToCst(
            this.CST_STACK[this.CST_STACK.length - 1],
            ruleName,
            ruleCstResult
        )
    }

    // lexer related methods
    public set input(newInput: IToken[]) {
        this.reset()
        this.tokVector = newInput
        this.tokVectorLength = newInput.length
    }

    public get input(): IToken[] {
        return this.tokVector
    }

    // skips a token and returns the next token
    public SKIP_TOKEN(): IToken {
        if (this.currIdx <= this.tokVector.length - 2) {
            this.consumeToken()
            return this.LA(1)
        } else {
            return END_OF_FILE
        }
    }

    // Lexer (accessing Token vector) related methods which can be overridden to implement lazy lexers
    // or lexers dependent on parser context.
    public LA(howMuch: number): IToken {
        // does: is this optimization (saving tokVectorLength benefits?)
        if (
            this.currIdx + howMuch < 0 ||
            this.tokVectorLength <= this.currIdx + howMuch
        ) {
            return END_OF_FILE
        } else {
            return this.tokVector[this.currIdx + howMuch]
        }
    }

    public consumeToken() {
        this.currIdx++
    }

    protected exportLexerState(): number {
        return this.currIdx
    }

    protected importLexerState(newState: number) {
        this.currIdx = newState
    }

    resetLexerState(): void {
        this.currIdx = -1
    }

    protected moveToTerminatedState(): void {
        this.currIdx = this.tokVector.length - 1
    }

    protected getLexerPosition(): number {
        return this.exportLexerState()
    }

    protected lookAheadBuilderForOptional(
        alt: lookAheadSequence,
        tokenMatcher: TokenMatcher,
        dynamicTokensEnabled: boolean
    ): () => boolean {
        return buildSingleAlternativeLookaheadFunction(
            alt,
            tokenMatcher,
            dynamicTokensEnabled
        )
    }

    protected lookAheadBuilderForAlternatives(
        alts: lookAheadSequence[],
        hasPredicates: boolean,
        tokenMatcher: TokenMatcher,
        dynamicTokensEnabled: boolean
    ): (orAlts?: IAnyOrAlt<any>[]) => number | undefined {
        return buildAlternativesLookAheadFunc(
            alts,
            hasPredicates,
            tokenMatcher,
            dynamicTokensEnabled
        )
    }

    /* istanbul ignore next */
    protected getLaFuncFromCache(key: number): Function {
        return undefined
    }

    protected getLaFuncFromMap(key: number): Function {
        return this.lookAheadFuncsCache.get(key)
    }

    /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
    protected getLaFuncFromObj(key: number): Function {
        return this.lookAheadFuncsCache[key]
    }

    /* istanbul ignore next */
    protected setLaFuncCache(key: number, value: Function): void {}

    protected setLaFuncCacheUsingMap(key: number, value: Function): void {
        this.lookAheadFuncsCache.set(key, value)
    }

    /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
    protected setLaFuncUsingObj(key: number, value: Function): void {
        this.lookAheadFuncsCache[key] = value
    }
}

function InRuleRecoveryException(message: string) {
    this.name = IN_RULE_RECOVERY_EXCEPTION
    this.message = message
}

InRuleRecoveryException.prototype = Error.prototype
