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
    applyMixins,
    cloneArr,
    cloneObj,
    contains,
    defaults,
    every,
    first,
    flatten,
    forEach,
    has,
    isArray,
    isEmpty,
    isES2015MapSupported,
    isObject,
    isUndefined,
    map,
    NOOP,
    reduce,
    uniq,
    values
} from "../utils/utils"
import { computeAllProdsFollows } from "./grammar/follow"
import { createTokenInstance, EOF, tokenName } from "../scan/tokens_public"
import {
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
import {
    augmentTokenTypes,
    isTokenType,
    tokenStructuredMatcher,
    tokenStructuredMatcherNoCategories
} from "../scan/tokens"
import { analyzeCst } from "./cst/cst"
import {
    AT_LEAST_ONE_IDX,
    AT_LEAST_ONE_SEP_IDX,
    BITS_FOR_METHOD_IDX,
    BITS_FOR_OCCURRENCE_IDX,
    MANY_IDX,
    MANY_SEP_IDX,
    OPTION_IDX,
    OR_IDX
} from "./grammar/keys"
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
    IgnoredParserIssues,
    IParserConfig,
    IParserDefinitionError,
    IParserErrorMessageProvider,
    IRecognitionException,
    IRuleConfig,
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
import {
    attemptInRepetitionRecovery as enabledAttemptInRepetitionRecovery,
    IN_RULE_RECOVERY_EXCEPTION,
    Recoverable
} from "./traits/recoverable"
import { BaseParser } from "./traits/base_parser"
import { LooksAhead } from "./traits/looksahead"
import { TreeBuilder } from "./traits/tree_builder"
import { LexerAdapter } from "./traits/lexer_adapter"
import { RecognizerApi, RecognizerEngine } from "./traits/recognizer"

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
    outputCst: true,
    errorMessageProvider: defaultParserErrorProvider,
    serializedGrammar: null
})

export const DEFAULT_RULE_CONFIG: IRuleConfig<any> = Object.freeze({
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

export class Parser extends BaseParser implements Recoverable {
    // Recoverable Trait fields
    protected firstAfterRepMap = new HashTable<IFirstAfterRepetition>()
    protected resyncFollows: HashTable<TokenType[]> = new HashTable<
        TokenType[]
    >()

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
    protected lookAheadFuncsCache: any = isES2015MapSupported() ? new Map() : []
    protected definitionErrors: IParserDefinitionError[] = []
    protected definedRulesNames: string[] = []

    protected shortRuleNameToFull = new HashTable<string>()
    protected fullRuleNameToShort = new HashTable<number>()

    // The shortName Index must be coded "after" the first 8bits to enable building unique lookahead keys
    protected ruleShortNameIdx = 256
    protected tokenMatcher: TokenMatcher = tokenStructuredMatcherNoCategories
    protected LAST_EXPLICIT_RULE_STACK: number[] = []
    protected selfAnalysisDone = false

    // lexerState
    protected tokVector: IToken[] = []
    protected tokVectorLength = 0
    protected currIdx: number = -1

    constructor(
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig = DEFAULT_PARSER_CONFIG
    ) {
        super()
        if (isArray(tokenVocabulary)) {
            // This only checks for Token vocabularies provided as arrays.
            // That is good enough because the main objective is to detect users of pre-V4.0 APIs
            // rather than all edge cases of empty Token vocabularies.
            if (isEmpty(tokenVocabulary as any[])) {
                throw Error(
                    "A Token Vocabulary cannot be empty.\n" +
                        "\tNote that the first argument for the parser constructor\n" +
                        "\tis no longer a Token vector (since v4.0)."
                )
            }

            if (typeof (tokenVocabulary as any[])[0].startOffset === "number") {
                throw Error(
                    "The Parser constructor no longer accepts a token vector as the first argument.\n" +
                        "\tSee: http://sap.github.io/chevrotain/docs/changes/BREAKING_CHANGES.html#_4-0-0\n" +
                        "\tFor Further details."
                )
            }
        }

        // configuration
        this.recoveryEnabled = has(config, "recoveryEnabled")
            ? config.recoveryEnabled
            : DEFAULT_PARSER_CONFIG.recoveryEnabled

        // performance optimization, NOOP will be inlined which
        // effectively means that this optional feature does not exist
        // when not used.
        if (this.recoveryEnabled) {
            this.attemptInRepetitionRecovery = enabledAttemptInRepetitionRecovery
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
            // TODO: PARSER.PROTOTYPE?
            // TODO but prevent inheritance???
            // TODO: is Object.getPrototypeOf needed???
            this.getLaFuncFromCache = Object.getPrototypeOf(
                this
            ).getLaFuncFromMap
            this.setLaFuncCache = Object.getPrototypeOf(
                this
            ).setLaFuncCacheUsingMap
        } else {
            this.getLaFuncFromCache = Object.getPrototypeOf(
                this
            ).getLaFuncFromObj
            this.setLaFuncCache = Object.getPrototypeOf(this).setLaFuncUsingObj
        }

        if (!this.outputCst) {
            this.cstInvocationStateUpdate = NOOP
            this.cstFinallyStateUpdate = NOOP
            this.cstPostTerminal = NOOP
            this.cstPostNonTerminal = NOOP
            // TODO: maybe access this._proto?
            this.getLastExplicitRuleShortName = Object.getPrototypeOf(
                this
            ).getLastExplicitRuleShortNameNoCst
            this.getPreviousExplicitRuleShortName = Object.getPrototypeOf(
                this
            ).getPreviousExplicitRuleShortNameNoCst
            this.getLastExplicitRuleOccurrenceIndex = Object.getPrototypeOf(
                this
            ).getLastExplicitRuleOccurrenceIndexNoCst
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
                "<tokensDictionary> argument must be An Array of Token constructors," +
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

    // TODO: extract these methods to ErrorHandler Trait?
    public get errors(): IRecognitionException[] {
        return cloneArr(this._errors)
    }

    public set errors(newErrors: IRecognitionException[]) {
        this._errors = newErrors
    }

    // TODO: consider caching the error message computed information
    protected raiseEarlyExitException(
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

    // TODO: consider caching the error message computed information
    protected raiseNoAltException(
        occurrence: number,
        errMsgTypes: string
    ): void {
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

    public reset(): void {
        this.resetLexerState()

        this.isBackTrackingStack = []
        this.errors = []
        this.RULE_STACK = []
        this.LAST_EXPLICIT_RULE_STACK = []
        this.CST_STACK = []
        this.RULE_OCCURRENCE_STACK = []
    }

    // TODO: does this belong to lexerAdapter trait?
    public isAtEndOfInput(): boolean {
        return this.tokenMatcher(this.LA(1), EOF)
    }

    public getGAstProductions(): HashTable<Rule> {
        return this.gastProductionsCache
    }

    public getSerializedGastProductions(): ISerializedGast[] {
        return serializeGrammar(this.gastProductionsCache.values())
    }

    // TODO: extract to content assist trait?
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

    // TODO: extract recognizer (API?) trait
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

    protected isBackTracking(): boolean {
        return !isEmpty(this.isBackTrackingStack)
    }

    // Parsing DSL Trait
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
    ): void {
        this.manyInternal(0, actionORMethodDef)
    }

    public MANY1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(1, actionORMethodDef)
    }

    public MANY2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(2, actionORMethodDef)
    }

    public MANY3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(3, actionORMethodDef)
    }

    public MANY4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(4, actionORMethodDef)
    }

    public MANY5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(5, actionORMethodDef)
    }

    public MANY6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(6, actionORMethodDef)
    }

    public MANY7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(7, actionORMethodDef)
    }

    public MANY8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(8, actionORMethodDef)
    }

    public MANY9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(9, actionORMethodDef)
    }

    public MANY_SEP<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(0, options)
    }

    public MANY_SEP1<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(1, options)
    }

    public MANY_SEP2<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(2, options)
    }

    public MANY_SEP3<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(3, options)
    }

    public MANY_SEP4<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(4, options)
    }

    public MANY_SEP5<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(5, options)
    }

    public MANY_SEP6<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(6, options)
    }

    public MANY_SEP7<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(7, options)
    }

    public MANY_SEP8<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(8, options)
    }

    public MANY_SEP9<OUT>(options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(9, options)
    }

    public AT_LEAST_ONE<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(0, actionORMethodDef)
    }

    public AT_LEAST_ONE1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        return this.atLeastOneInternal(1, actionORMethodDef)
    }

    public AT_LEAST_ONE2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(2, actionORMethodDef)
    }

    public AT_LEAST_ONE3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(3, actionORMethodDef)
    }

    public AT_LEAST_ONE4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(4, actionORMethodDef)
    }

    public AT_LEAST_ONE5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(5, actionORMethodDef)
    }

    public AT_LEAST_ONE6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(6, actionORMethodDef)
    }

    public AT_LEAST_ONE7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(7, actionORMethodDef)
    }

    public AT_LEAST_ONE8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(8, actionORMethodDef)
    }

    public AT_LEAST_ONE9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(9, actionORMethodDef)
    }

    public AT_LEAST_ONE_SEP<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(0, options)
    }

    public AT_LEAST_ONE_SEP1<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(1, options)
    }

    public AT_LEAST_ONE_SEP2<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(2, options)
    }

    public AT_LEAST_ONE_SEP3<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(3, options)
    }

    public AT_LEAST_ONE_SEP4<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(4, options)
    }

    public AT_LEAST_ONE_SEP5<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(5, options)
    }

    public AT_LEAST_ONE_SEP6<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(6, options)
    }

    public AT_LEAST_ONE_SEP7<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(7, options)
    }

    public AT_LEAST_ONE_SEP8<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(8, options)
    }

    public AT_LEAST_ONE_SEP9<OUT>(options: AtLeastOneSepMethodOpts<OUT>): void {
        this.atLeastOneSepFirstInternal(9, options)
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

    // TODO: extract to recognizer_engine trait?
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
    protected saveRecogState(): IParserState {
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

    protected reloadRecogState(newState: IParserState) {
        this.errors = newState.errors
        this.importLexerState(newState.lexerState)
        this.RULE_STACK = newState.RULE_STACK
    }
}

applyMixins(Parser, [
    Recoverable,
    LooksAhead,
    TreeBuilder,
    LexerAdapter,
    RecognizerEngine,
    RecognizerApi
])
// Manually copying the only accessor the traits define.
const inputDescriptor = Object.getOwnPropertyDescriptor(
    LexerAdapter.prototype,
    "input"
)
Object.defineProperty(Parser.prototype, "input", inputDescriptor)
