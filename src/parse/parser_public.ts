import * as cache from "./cache"
import {
    CLASS_TO_ALL_RULE_NAMES,
    CLASS_TO_BASE_CST_VISITOR,
    CLASS_TO_BASE_CST_VISITOR_WITH_DEFAULTS
} from "./cache"
import {
    EarlyExitException,
    IRecognitionException,
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
import {
    createTokenInstance,
    EOF,
    IToken,
    tokenName
} from "../scan/tokens_public"
import {
    buildAlternativesLookAheadFunc,
    buildLookaheadFuncForOptionalProd,
    buildLookaheadFuncForOr,
    buildSingleAlternativeLookaheadFunction,
    getLookaheadPathsForOptionalProd,
    getLookaheadPathsForOr,
    PROD_TYPE
} from "./grammar/lookahead"
import { IMultiModeLexerDefinition, TokenType } from "../scan/lexer_public"
import { buildTopProduction } from "./gast_builder"
import {
    AbstractNextTerminalAfterProductionWalker,
    NextAfterTokenWalker,
    nextPossibleTokensAfter,
    NextTerminalAfterAtLeastOneSepWalker,
    NextTerminalAfterAtLeastOneWalker,
    NextTerminalAfterManySepWalker,
    NextTerminalAfterManyWalker
} from "./grammar/interpreter"
import { IN } from "./constants"
import { cloneProduction } from "./grammar/gast/gast"
import {
    ISyntacticContentAssistPath,
    ITokenGrammarPath
} from "./grammar/path_public"
import {
    augmentTokenTypes,
    isTokenType,
    tokenStructuredMatcher,
    tokenStructuredMatcherNoCategories
} from "../scan/tokens"
import { CstNode, ICstVisitor } from "./cst/cst_public"
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
    defaultParserErrorProvider,
    IParserErrorMessageProvider
} from "./errors_public"
import {
    ISerializedGast,
    Rule,
    serializeGrammar
} from "./grammar/gast/gast_public"
import {
    resolveGrammar,
    validateGrammar
} from "./grammar/gast/gast_resolver_public"

export enum ParserDefinitionErrorType {
    INVALID_RULE_NAME,
    DUPLICATE_RULE_NAME,
    INVALID_RULE_OVERRIDE,
    DUPLICATE_PRODUCTIONS,
    UNRESOLVED_SUBRULE_REF,
    LEFT_RECURSION,
    NONE_LAST_EMPTY_ALT,
    AMBIGUOUS_ALTS,
    CONFLICT_TOKENS_RULES_NAMESPACE,
    INVALID_TOKEN_NAME,
    INVALID_NESTED_RULE_NAME,
    DUPLICATE_NESTED_NAME,
    NO_NON_EMPTY_LOOKAHEAD,
    AMBIGUOUS_PREFIX_ALTS,
    TOO_MANY_ALTS
}

export type IgnoredRuleIssues = { [dslNameAndOccurrence: string]: boolean }
export type IgnoredParserIssues = { [ruleName: string]: IgnoredRuleIssues }

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

export interface IParserConfig {
    /**
     * Is the error recovery / fault tolerance of the Chevrotain Parser enabled.
     */
    recoveryEnabled?: boolean

    /**
     * Maximum number of tokens the parser will use to choose between alternatives.
     */
    maxLookahead?: number

    /**
     * Used to mark parser definition errors that should be ignored.
     * For example:
     *
     * {
     *   myCustomRule : {
     *                   OR3 : true
     *                  },
     *
     *   myOtherRule : {
     *                  OPTION1 : true,
     *                  OR4 : true
     *                 }
     * }
     *
     * Be careful when ignoring errors, they are usually there for a reason :).
     */
    ignoredIssues?: IgnoredParserIssues

    /**
     * Enable This Flag to to support Dynamically defined Tokens.
     * This will disable performance optimizations which cannot work if the whole Token vocabulary is not known
     * During Parser initialization.
     */
    dynamicTokensEnabled?: boolean

    /**
     * Enable automatic Concrete Syntax Tree creation
     * For in-depth docs:
     * {@link https://github.com/SAP/chevrotain/blob/master/docs/02_Deep_Dive/concrete_syntax_tree.md}
     */
    outputCst?: boolean

    /**
     * A custom error message provider.
     * Can be used to override the default error messages.
     * For example:
     *   - Translating the error messages to a different languages.
     *   - Changing the formatting
     *   - Providing special error messages under certain conditions - missing semicolons
     */
    errorMessageProvider?: IParserErrorMessageProvider
}

const DEFAULT_PARSER_CONFIG: IParserConfig = Object.freeze({
    recoveryEnabled: false,
    maxLookahead: 4,
    ignoredIssues: <any>{},
    dynamicTokensEnabled: false,
    // TODO: Document this breaking change, can it be mitigated?
    // TODO: change to true
    outputCst: false,
    errorMessageProvider: defaultParserErrorProvider
})

export interface IRuleConfig<T> {
    /**
     * The function which will be invoked to produce the returned value for a production that have not been
     * successfully executed and the parser recovered from.
     */
    recoveryValueFunc?: () => T

    /**
     * Enable/Disable re-sync error recovery for this specific production.
     */
    resyncEnabled?: boolean
}

const DEFAULT_RULE_CONFIG: IRuleConfig<any> = Object.freeze({
    recoveryValueFunc: () => undefined,
    resyncEnabled: true
})

export interface IParserDefinitionError {
    message: string
    type: ParserDefinitionErrorType
    ruleName?: string
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

// parameters needed to compute the key in the FOLLOW_SET map.
export interface IFollowKey {
    ruleName: string
    idxInCallingRule: number
    inRule: string
}

/**
 * OR([
 *  {ALT:XXX },
 *  {ALT:YYY },
 *  {ALT:ZZZ }
 * ])
 */
export interface IOrAlt<T> {
    NAME?: string
    ALT: () => T
}

/**
 * OR([
 *  { GATE:condition1, ALT:XXX },
 *  { GATE:condition2, ALT:YYY },
 *  { GATE:condition3, ALT:ZZZ }
 * ])
 */
export interface IOrAltWithGate<T> extends IOrAlt<T> {
    NAME?: string
    GATE: () => boolean
    ALT: () => T
}

export type IAnyOrAlt<T> = IOrAlt<T> | IOrAltWithGate<T>

export interface IParserState {
    errors: IRecognitionException[]
    lexerState: any
    RULE_STACK: string[]
    CST_STACK: CstNode[]
    LAST_EXPLICIT_RULE_STACK: number[]
}

export interface DSLMethodOpts<T> {
    /**
     * in-lined method name
     */
    NAME?: string

    /**
     * The Grammar to process in this method.
     */
    DEF: GrammarAction<T>
    /**
     * A semantic constraint on this DSL method
     * @see https://github.com/SAP/chevrotain/blob/master/examples/parser/predicate_lookahead/predicate_lookahead.js
     * For farther details.
     */
    GATE?: Predicate
}

export interface DSLMethodOptsWithErr<T> extends DSLMethodOpts<T> {
    /**
     *  Short title/classification to what is being matched.
     *  Will be used in the error message,.
     *  If none is provided, the error message will include the names of the expected
     *  Tokens sequences which start the method's inner grammar
     */
    ERR_MSG?: string
}

export interface OrMethodOpts<T> {
    NAME?: string
    /**
     * The set of alternatives,
     * See detailed description in @link {Parser.OR1}
     */
    DEF: IAnyOrAlt<T>[]
    /**
     * A description for the alternatives used in error messages
     * If none is provided, the error message will include the names of the expected
     * Tokens sequences which may start each alternative.
     */
    ERR_MSG?: string
}

export interface ManySepMethodOpts<T> {
    NAME?: string
    /**
     * The Grammar to process in each iteration.
     */
    DEF: GrammarAction<T>
    /**
     * The separator between each iteration.
     */
    SEP: TokenType
}

export interface AtLeastOneSepMethodOpts<T> extends ManySepMethodOpts<T> {
    /**
     *  Short title/classification to what is being matched.
     *  Will be used in the error message,.
     *  If none is provided, the error message will include the names of the expected
     *  Tokens sequences which start the method's inner grammar
     */
    ERR_MSG?: string
}

export interface ConsumeMethodOpts {
    /**
     *  A custom Error message if the Token could not be consumed.
     *  This will override any error message provided by the parser's "errorMessageProvider"
     */
    ERR_MSG?: string

    /**
     * A label to be used instead of the TokenType name in the created CST.
     */
    LABEL?: string
}

export interface SubruleMethodOpts {
    /**
     * The arguments to parameterized rules, see:
     * @link https://github.com/SAP/chevrotain/blob/master/examples/parser/parametrized_rules/parametrized.js
     */
    ARGS?: any[]

    /**
     * A label to be used instead of the TokenType name in the created CST.
     */
    LABEL?: string
}

export type Predicate = () => boolean
export type GrammarAction<OUT> = () => OUT

export type ISeparatedIterationResult<OUT> = {
    values: OUT[] // The aggregated results of the values returned by each iteration.
    separators: IToken[] // the separator tokens between the iterations
}

export type TokenVocabulary =
    | { [tokenName: string]: TokenType }
    | TokenType[]
    | IMultiModeLexerDefinition

/**
 * Convenience used to express an empty alternative in an OR (alternation).
 * can be used to more clearly describe the intent in a case of empty alternation.
 *
 * For example:
 *
 * 1. without using EMPTY_ALT:
 *
 *    this.OR([
 *      {ALT: () => {
 *        this.CONSUME1(OneTok)
 *        return "1"
 *      }},
 *      {ALT: () => {
 *        this.CONSUME1(TwoTok)
 *        return "2"
 *      }},
 *      {ALT: () => { // implicitly empty because there are no invoked grammar rules (OR/MANY/CONSUME...) inside this alternative.
 *        return "666"
 *      }},
 *    ])
 *
 *
 * 2. using EMPTY_ALT:
 *
 *    this.OR([
 *      {ALT: () => {
 *        this.CONSUME1(OneTok)
 *        return "1"
 *      }},
 *      {ALT: () => {
 *        this.CONSUME1(TwoTok)
 *        return "2"
 *      }},
 *      {ALT: EMPTY_ALT("666")}, // explicitly empty, clearer intent
 *    ])
 *
 */
export function EMPTY_ALT<T>(value: T = undefined): () => T {
    return function() {
        return value
    }
}

let EOF_FOLLOW_KEY: any = {}

/**
 * A Recognizer capable of self analysis to determine it's grammar structure
 * This is used for more advanced features requiring such information.
 * For example: Error Recovery, Automatic lookahead calculation.
 */
export class Parser {
    static NO_RESYNC: boolean = false
    // Set this flag to true if you don't want the Parser to throw error when problems in it's definition are detected.
    // (normally during the parser's constructor).
    // This is a design time flag, it will not affect the runtime error handling of the parser, just design time errors,
    // for example: duplicate rule names, referencing an unresolved subrule, ect...
    // This flag should not be enabled during normal usage, it is used in special situations, for example when
    // needing to display the parser definition errors in some GUI(online playground).
    static DEFER_DEFINITION_ERRORS_HANDLING: boolean = false

    protected static performSelfAnalysis(parserInstance: Parser): void {
        let definitionErrors = []
        let defErrorsMsgs

        parserInstance.selfAnalysisDone = true
        let className = classNameFromInstance(parserInstance)

        // can't test this with nyc tool, instrumentation causes the class name to be not empty.
        /* istanbul ignore if */
        if (className === "") {
            // just a simple "throw Error" without any fancy "definition error" because the logic below relies on a unique parser name to
            // save/access those definition errors...
            /* istanbul ignore next */
            throw Error(
                "A Parser's constructor may not be an anonymous Function, it must be a named function\n" +
                    "The constructor's name is used at runtime for performance (caching) purposes."
            )
        }

        // this information should only be computed once
        if (!cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey(className)) {
            cache.CLASS_TO_SELF_ANALYSIS_DONE.put(className, true)

            let orgProductions = parserInstance._productions
            let clonedProductions = new HashTable<Rule>()
            // clone the grammar productions to support grammar inheritance. requirements:
            // 1. We want to avoid rebuilding the grammar every time so a cache for the productions is used.
            // 2. We need to collect the production from multiple grammars in an inheritance scenario during constructor invocation
            //    so the myGast variable is used.
            // 3. If a Production has been overridden references to it in the GAST must also be updated.
            forEach(orgProductions.keys(), key => {
                let value = orgProductions.get(key)
                clonedProductions.put(key, cloneProduction(value))
            })
            cache.getProductionsForClass(className).putAll(clonedProductions)

            // assumes this cache has been initialized (in the relevant parser's constructor)
            // TODO: consider making the self analysis a member method to resolve this.
            // that way it won't be callable before the constructor has been invoked...
            definitionErrors = cache.CLASS_TO_DEFINITION_ERRORS.get(className)

            let resolverErrors = resolveGrammar({
                rules: clonedProductions.values()
            })
            definitionErrors.push.apply(definitionErrors, resolverErrors) // mutability for the win?

            // only perform additional grammar validations IFF no resolving errors have occurred.
            // as unresolved grammar may lead to unhandled runtime exceptions in the follow up validations.
            if (isEmpty(resolverErrors)) {
                let validationErrors = validateGrammar({
                    rules: clonedProductions.values(),
                    maxLookahead: parserInstance.maxLookahead,
                    tokenTypes: values(parserInstance.tokensMap),
                    ignoredIssues: parserInstance.ignoredIssues,
                    errMsgProvider: defaultGrammarValidatorErrorProvider,
                    grammarName: className
                })

                definitionErrors.push.apply(definitionErrors, validationErrors) // mutability for the win?
            }

            if (
                !isEmpty(definitionErrors) &&
                !Parser.DEFER_DEFINITION_ERRORS_HANDLING
            ) {
                defErrorsMsgs = map(
                    definitionErrors,
                    defError => defError.message
                )
                throw new Error(
                    `Parser Definition Errors detected:\n ${defErrorsMsgs.join(
                        "\n-------------------------------\n"
                    )}`
                )
            }
            if (isEmpty(definitionErrors)) {
                // this analysis may fail if the grammar is not perfectly valid
                let allFollows = computeAllProdsFollows(
                    clonedProductions.values()
                )
                cache.setResyncFollowsForClass(className, allFollows)
            }

            let cstAnalysisResult = analyzeCst(
                clonedProductions.values(),
                parserInstance.fullRuleNameToShort
            )
            cache.CLASS_TO_ALL_RULE_NAMES.put(
                className,
                cstAnalysisResult.allRuleNames
            )
        }

        // reThrow the validation errors each time an erroneous parser is instantiated
        if (
            !isEmpty(cache.CLASS_TO_DEFINITION_ERRORS.get(className)) &&
            !Parser.DEFER_DEFINITION_ERRORS_HANDLING
        ) {
            defErrorsMsgs = map(
                cache.CLASS_TO_DEFINITION_ERRORS.get(className),
                defError => defError.message
            )
            throw new Error(
                `Parser Definition Errors detected:\n ${defErrorsMsgs.join(
                    "\n-------------------------------\n"
                )}`
            )
        }
    }

    protected _errors: IRecognitionException[] = []

    /**
     * This flag enables or disables error recovery (fault tolerance) of the parser.
     * If this flag is disabled the parser will halt on the first error.
     */
    protected recoveryEnabled: boolean
    protected dynamicTokensEnabled: boolean
    protected maxLookahead: number
    protected ignoredIssues: IgnoredParserIssues
    protected outputCst: boolean

    // adapters
    protected errorMessageProvider: IParserErrorMessageProvider

    protected isBackTrackingStack = []
    protected className: string
    protected RULE_STACK: string[] = []
    protected RULE_OCCURRENCE_STACK: number[] = []
    protected CST_STACK: CstNode[] = []
    protected tokensMap: { [fqn: string]: TokenType } = undefined

    private firstAfterRepMap
    private classLAFuncs
    private cstDictDefForRule
    private definitionErrors: IParserDefinitionError[]
    private definedRulesNames: string[] = []

    private shortRuleNameToFull = new HashTable<string>()
    private fullRuleNameToShort = new HashTable<number>()

    // The shortName Index must be coded "after" the first 8bits to enable building unique lookahead keys
    private ruleShortNameIdx = 256
    private tokenMatcher: TokenMatcher
    private LAST_EXPLICIT_RULE_STACK: number[] = []
    private selfAnalysisDone = false

    // lexerState
    private tokVector: IToken[]
    private tokVectorLength
    private currIdx: number = -1

    /**
     * Only used internally for storing productions as they are built for the first time.
     * The final productions should be accessed from the static cache.
     */
    private _productions: HashTable<Rule> = new HashTable<Rule>()

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
        this.firstAfterRepMap = cache.getFirstAfterRepForClass(this.className)
        this.classLAFuncs = cache.getLookaheadFuncsForClass(this.className)

        if (!cache.CLASS_TO_DEFINITION_ERRORS.containsKey(this.className)) {
            this.definitionErrors = []
            cache.CLASS_TO_DEFINITION_ERRORS.put(
                this.className,
                this.definitionErrors
            )
        } else {
            this.definitionErrors = cache.CLASS_TO_DEFINITION_ERRORS.get(
                this.className
            )
        }

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

    /**
     * Resets the parser state, should be overridden for custom parsers which "carry" additional state.
     * When overriding, remember to also invoke the super implementation!
     */
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
        let cachedConstructor = CLASS_TO_BASE_CST_VISITOR.get(this.className)

        if (isUndefined(cachedConstructor)) {
            let allRuleNames = CLASS_TO_ALL_RULE_NAMES.get(this.className)
            cachedConstructor = createBaseSemanticVisitorConstructor(
                this.className,
                allRuleNames
            )
            CLASS_TO_BASE_CST_VISITOR.put(this.className, cachedConstructor)
        }

        return <any>cachedConstructor
    }

    public getBaseCstVisitorConstructorWithDefaults(): {
        new (...args: any[]): ICstVisitor<any, any>
    } {
        let cachedConstructor = CLASS_TO_BASE_CST_VISITOR_WITH_DEFAULTS.get(
            this.className
        )

        if (isUndefined(cachedConstructor)) {
            let allRuleNames = CLASS_TO_ALL_RULE_NAMES.get(this.className)
            let baseConstructor = this.getBaseCstVisitorConstructor()
            cachedConstructor = createBaseVisitorConstructorWithDefaults(
                this.className,
                allRuleNames,
                baseConstructor
            )
            CLASS_TO_BASE_CST_VISITOR_WITH_DEFAULTS.put(
                this.className,
                cachedConstructor
            )
        }

        return <any>cachedConstructor
    }

    public getGAstProductions(): HashTable<Rule> {
        return cache.getProductionsForClass(this.className)
    }

    // This is more than a convenience method.
    // It is mostly used to draw the diagrams and having this method present on the parser instance
    // can avoid certain situations in which the serialization logic would fail due to multiple versions of chevrotain
    // bundled (due to multiple prototype chains and "instanceof" usage).
    public getSerializedGastProductions(): ISerializedGast[] {
        return serializeGrammar(
            cache.getProductionsForClass(this.className).values()
        )
    }

    /**
     * @param startRuleName {string}
     * @param precedingInput {IToken[]} - The token vector up to (not including) the content assist point
     * @returns {ISyntacticContentAssistPath[]}
     */
    public computeContentAssist(
        startRuleName: string,
        precedingInput: IToken[]
    ): ISyntacticContentAssistPath[] {
        let startRuleGast = cache
            .getProductionsForClass(this.className)
            .get(startRuleName)

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

    /**
     * @param grammarRule - The rule to try and parse in backtracking mode.
     * @param args - argumens to be passed to the grammar rule execution
     *
     * @return {TokenType():boolean} a lookahead function that will try to parse the given grammarRule and will return true if succeed.
     */
    protected BACKTRACK<T>(
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

    // Parsing DSL
    /**
     * Convenience method equivalent to CONSUME1.
     * @see CONSUME1
     */
    protected CONSUME(tokType: TokenType, options?: ConsumeMethodOpts): IToken {
        return this.consumeInternal(tokType, 0, options)
    }

    /**
     *
     * A Parsing DSL method use to consume a single terminal Token.
     * a Token will be consumed, IFF the next token in the token vector matches <tokType>.
     * otherwise the parser will attempt to perform error recovery.
     *
     * The index in the method name indicates the unique occurrence of a terminal consumption
     * inside a the top level rule. What this means is that if a terminal appears
     * more than once in a single rule, each appearance must have a difference index.
     *
     * for example:
     *
     * function parseQualifiedName() {
     *    this.CONSUME1(Identifier);
     *    this.MANY(()=> {
     *       this.CONSUME1(Dot);
     *       this.CONSUME2(Identifier); // <-- here we use CONSUME2 because the terminal
     *    });                           //     'Identifier' has already appeared previously in the
     *                                  //     the rule 'parseQualifiedName'
     * }
     *
     * @param tokType - The Type of the token to be consumed.
     * @param options - optional properties to modify the behavior of CONSUME.
     */
    protected CONSUME1(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 1, options)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME2(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 2, options)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME3(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 3, options)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME4(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 4, options)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME5(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 5, options)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME6(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 6, options)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME7(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 7, options)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME8(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 8, options)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME9(
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 9, options)
    }

    /**
     * Convenience method equivalent to SUBRULE1
     * @see SUBRULE1
     */
    protected SUBRULE<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 0, options)
    }

    /**
     * The Parsing DSL Method is used by one rule to call another.
     *
     * This may seem redundant as it does not actually do much.
     * However using it is mandatory for all sub rule invocations.
     * calling another rule without wrapping in SUBRULE(...)
     * will cause errors/mistakes in the Recognizer's self analysis,
     * which will lead to errors in error recovery/automatic lookahead calculation
     * and any other functionality relying on the Recognizer's self analysis
     * output.
     *
     * As in CONSUME the index in the method name indicates the occurrence
     * of the sub rule invocation in its rule.
     *
     * @param {TokenType} ruleToCall - The rule to invoke.
     * @param {*[]} args - The arguments to pass to the invoked subrule.
     * @returns {*} - The result of invoking ruleToCall.
     */
    protected SUBRULE1<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 1, options)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE2<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 2, options)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE3<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 3, options)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE4<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 4, options)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE5<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 5, options)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE6<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 6, options)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE7<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 7, options)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE8<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 8, options)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE9<T>(
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 9, options)
    }

    /**
     * Convenience method equivalent to OPTION1.
     * @see OPTION1
     */
    protected OPTION<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 0)
    }

    /**
     * Parsing DSL Method that Indicates an Optional production
     * in EBNF notation: [...].
     *
     * Note that there are two syntax forms:
     * - Passing the grammar action directly:
     *      this.OPTION(()=> {
     *        this.CONSUME(Digit)}
     *      );
     *
     * - using an "options" object:
     *      this.OPTION({
     *        GATE:predicateFunc,
     *        DEF: ()=>{
     *          this.CONSUME(Digit)
     *        }});
     *
     * The optional 'GATE' property in "options" object form can be used to add constraints
     * to invoking the grammar action.
     *
     * As in CONSUME the index in the method name indicates the occurrence
     * of the optional production in it's top rule.
     *
     * @param  actionORMethodDef - The grammar action to optionally invoke once
     *                             or an "OPTIONS" object describing the grammar action and optional properties.
     *
     * @returns {OUT}
     */
    protected OPTION1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 1)
    }

    /**
     * @see OPTION1
     */
    protected OPTION2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 2)
    }

    /**
     * @see OPTION1
     */
    protected OPTION3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 3)
    }

    /**
     * @see OPTION1
     */
    protected OPTION4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 4)
    }

    /**
     * @see OPTION1
     */
    protected OPTION5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 5)
    }

    /**
     * @see OPTION1
     */
    protected OPTION6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 6)
    }

    /**
     * @see OPTION1
     */
    protected OPTION7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 7)
    }

    /**
     * @see OPTION1
     */
    protected OPTION8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 8)
    }

    /**
     * @see OPTION1
     */
    protected OPTION9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 9)
    }

    /**
     * Convenience method equivalent to OR1.
     * @see OR1
     */
    protected OR<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 0)
    }

    /**
     * Parsing DSL method that indicates a choice between a set of alternatives must be made.
     * This is equivalent to EBNF alternation (A | B | C | D ...)
     *
     * There are a couple of syntax forms for the inner alternatives array.
     *
     * Passing alternatives array directly:
     *        this.OR([
     *           {ALT:()=>{this.CONSUME(One)}},
     *           {ALT:()=>{this.CONSUME(Two)}},
     *           {ALT:()=>{this.CONSUME(Three)}}
     *        ])
     *
     * Passing alternative array directly with predicates (GATE).
     *        this.OR([
     *           {GATE: predicateFunc1, ALT:()=>{this.CONSUME(One)}},
     *           {GATE: predicateFuncX, ALT:()=>{this.CONSUME(Two)}},
     *           {GATE: predicateFuncX, ALT:()=>{this.CONSUME(Three)}}
     *        ])
     *
     * These syntax forms can also be mixed:
     *        this.OR([
     *           {GATE: predicateFunc1, ALT:()=>{this.CONSUME(One)}},
     *           {ALT:()=>{this.CONSUME(Two)}},
     *           {ALT:()=>{this.CONSUME(Three)}}
     *        ])
     *
     * Additionally an "options" object may be used:
     * this.OR({
     *          DEF:[
     *            {ALT:()=>{this.CONSUME(One)}},
     *            {ALT:()=>{this.CONSUME(Two)}},
     *            {ALT:()=>{this.CONSUME(Three)}}
     *          ],
     *          // OPTIONAL property
     *          ERR_MSG: "A Number"
     *        })
     *
     * The 'predicateFuncX' in the long form can be used to add constraints to choosing the alternative.
     *
     * As in CONSUME the index in the method name indicates the occurrence
     * of the alternation production in it's top rule.
     *
     * @param altsOrOpts - A set of alternatives or an "OPTIONS" object describing the alternatives and optional properties.
     *
     * @returns {*} - The result of invoking the chosen alternative.
     */
    protected OR1<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 1)
    }

    /**
     * @see OR1
     */
    protected OR2<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 2)
    }

    /**
     * @see OR1
     */
    protected OR3<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 3)
    }

    /**
     * @see OR1
     */
    protected OR4<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 4)
    }

    /**
     * @see OR1
     */
    protected OR5<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 5)
    }

    /**
     * @see OR1
     */
    protected OR6<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 6)
    }

    /**
     * @see OR1
     */
    protected OR7<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 7)
    }

    /**
     * @see OR1
     */
    protected OR8<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 8)
    }

    /**
     * @see OR1
     */
    protected OR9<T>(altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 9)
    }

    /**
     * Convenience method equivalent to MANY1.
     * @see MANY1
     */
    protected MANY<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(0, actionORMethodDef, [])
    }

    /**
     * Parsing DSL method, that indicates a repetition of zero or more.
     * This is equivalent to EBNF repetition {...}.
     *
     * Note that there are two syntax forms:
     * - Passing the grammar action directly:
     *        this.MANY(()=>{
     *                        this.CONSUME(Comma)
     *                        this.CONSUME(Digit)
     *                      })
     *
     * - using an "options" object:
     *        this.MANY({
     *                   GATE: predicateFunc,
     *                   DEF: () => {
     *                          this.CONSUME(Comma)
     *                          this.CONSUME(Digit)
     *                        }
     *                 });
     *
     * The optional 'GATE' property in "options" object form can be used to add constraints
     * to invoking the grammar action.
     *
     * As in CONSUME the index in the method name indicates the occurrence
     * of the repetition production in it's top rule.
     *
     * @param {TokenType} actionORMethodDef - The grammar action to optionally invoke multiple times
     *                             or an "OPTIONS" object describing the grammar action and optional properties.
     *
     * @returns {OUT[]}
     */
    protected MANY1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(1, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(2, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(3, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(4, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(5, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(6, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(7, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(8, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT[] {
        return this.manyInternal(9, actionORMethodDef, [])
    }

    /**
     * Convenience method equivalent to MANY_SEP1.
     * @see MANY_SEP1
     */
    protected MANY_SEP<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(0, options, {
            values: [],
            separators: []
        })
    }

    /**
     * Parsing DSL method, that indicates a repetition of zero or more with a separator
     * Token between the repetitions.
     *
     * Example:
     *
     * this.MANY_SEP({
     *                  SEP:Comma,
     *                  DEF: () => {
     *                         this.CONSUME(Number};
     *                         ...
     *                       );
     *              })
     *
     * Note that because this DSL method always requires more than one argument the options object is always required
     * and it is not possible to use a shorter form like in the MANY DSL method.
     *
     * Note that for the purposes of deciding on whether or not another iteration exists
     * Only a single Token is examined (The separator). Therefore if the grammar being implemented is
     * so "crazy" to require multiple tokens to identify an item separator please use the more basic DSL methods
     * to implement it.
     *
     * As in CONSUME the index in the method name indicates the occurrence
     * of the repetition production in it's top rule.
     *
     * Note that due to current limitations in the implementation the "SEP" property must appear BEFORE the "DEF" property.
     *
     * @param options - An object defining the grammar of each iteration and the separator between iterations
     *
     * @return {ISeparatedIterationResult<OUT>}
     */
    protected MANY_SEP1<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(1, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP2<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(2, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP3<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(3, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP4<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(4, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP5<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(5, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP6<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(6, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP7<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(7, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP8<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(8, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP9<OUT>(
        options: ManySepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(9, options, {
            values: [],
            separators: []
        })
    }

    /**
     * Convenience method equivalent to AT_LEAST_ONE1.
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(0, actionORMethodDef, [])
    }

    /**
     * Convenience method, same as MANY but the repetition is of one or more.
     * failing to match at least one repetition will result in a parsing error and
     * cause a parsing error.
     *
     * @see MANY1
     *
     * @param actionORMethodDef  - The grammar action to optionally invoke multiple times
     *                             or an "OPTIONS" object describing the grammar action and optional properties.
     *
     * @return {OUT[]}
     */
    protected AT_LEAST_ONE1<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(1, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE2<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(2, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE3<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(3, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE4<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(4, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE5<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(5, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE6<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(6, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE7<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(7, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE8<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(8, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE9<OUT>(
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): OUT[] {
        return this.atLeastOneInternal(9, actionORMethodDef, [])
    }

    /**
     * Convenience method equivalent to AT_LEAST_ONE_SEP1.
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE_SEP<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(0, options, {
            values: [],
            separators: []
        })
    }

    /**
     * Convenience method, same as MANY_SEP but the repetition is of one or more.
     * failing to match at least one repetition will result in a parsing error and
     * cause the parser to attempt error recovery.
     *
     * Note that an additional optional property ERR_MSG can be used to provide custom error messages.
     *
     * @see MANY_SEP1
     *
     * @param options - An object defining the grammar of each iteration and the separator between iterations
     *
     * @return {ISeparatedIterationResult<OUT>}
     */
    protected AT_LEAST_ONE_SEP1<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(1, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP2<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(2, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP3<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(3, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP4<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(4, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP5<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(5, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP6<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(6, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP7<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(7, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP8<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(8, options, {
            values: [],
            separators: []
        })
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP9<OUT>(
        options: AtLeastOneSepMethodOpts<OUT>
    ): ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(9, options, {
            values: [],
            separators: []
        })
    }

    /**
     *
     * @param {string} name - The name of the rule.
     * @param {TokenType} implementation - The implementation of the rule.
     * @param {IRuleConfig} [config] - The rule's optional configuration.
     *
     * @returns {TokenType} - The parsing rule which is the production implementation wrapped with the parsing logic that handles
     *                     Parser state / error recovery&reporting/ ...
     */
    protected RULE<T>(
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
        if (!this._productions.containsKey(name)) {
            let gastProduction = buildTopProduction(
                implementation.toString(),
                name,
                this.tokensMap
            )
            this._productions.put(name, gastProduction)
        } else {
            let parserClassProductions = cache.getProductionsForClass(
                this.className
            )
            let cachedProduction = parserClassProductions.get(name)
            // in case of duplicate rules the cache will not be filled at this point.
            if (!isUndefined(cachedProduction)) {
                // filling up the _productions is always needed to inheriting grammars can access it (as an instance member)
                // otherwise they will be unaware of productions defined in super grammars.
                this._productions.put(name, cachedProduction)
            }
        }

        let ruleImplementation = this.defineRule(name, implementation, config)
        this[name] = ruleImplementation
        return ruleImplementation
    }

    /**
     * @See RULE
     * Same as RULE, but should only be used in "extending" grammars to override rules/productions
     * from the super grammar.
     */
    protected OVERRIDE_RULE<T>(
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

        let alreadyOverridden = cache.getProductionOverriddenForClass(
            this.className
        )

        // only build the GAST of an overridden rule once.
        if (!alreadyOverridden.containsKey(name)) {
            alreadyOverridden.put(name, true)
            let gastProduction = buildTopProduction(
                impl.toString(),
                name,
                this.tokensMap
            )
            this._productions.put(name, gastProduction)
        } else {
            let parserClassProductions = cache.getProductionsForClass(
                this.className
            )
            // filling up the _productions is always needed to inheriting grammars can access it (as an instance member)
            // otherwise they will be unaware of productions defined in super grammars.
            this._productions.put(name, parserClassProductions.get(name))
        }

        return this.defineRule(name, impl, config)
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

    /**
     * Returns an "imaginary" Token to insert when Single Token Insertion is done
     * Override this if you require special behavior in your grammar.
     * For example if an IntegerToken is required provide one with the image '0' so it would be valid syntactically.
     */
    protected getTokenToInsert(tokType: TokenType): IToken {
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

    /**
     * By default all tokens type may be inserted. This behavior may be overridden in inheriting Recognizers
     * for example: One may decide that only punctuation tokens may be inserted automatically as they have no additional
     * semantic value. (A mandatory semicolon has no additional semantic meaning, but an Integer may have additional meaning
     * depending on its int value and context (Inserting an integer 0 in cardinality: "[1..]" will cause semantic issues
     * as the max of the cardinality will be greater than the min value (and this is a false error!).
     */
    protected canTokenTypeBeInsertedInRecovery(tokType: TokenType) {
        return true
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
    protected getNextPossibleTokenTypes(
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
        const args = options !== undefined ? options.ARGS : undefined
        const ruleResult = ruleToCall.call(this, idx, args)

        this.cstPostNonTerminal(
            ruleResult,
            options !== undefined && options.LABEL !== undefined
                ? options.LABEL
                : (<any>ruleToCall).ruleName
        )

        return ruleResult
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
                if (options !== undefined && options.ERR_MSG) {
                    msg = options.ERR_MSG
                } else {
                    msg = this.errorMessageProvider.buildMismatchTokenMessage({
                        expected: tokType,
                        actual: nextToken,
                        ruleName: this.getCurrRuleFullName()
                    })
                }
                throw this.SAVE_ERROR(
                    new MismatchedTokenException(msg, nextToken)
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
                                // recovery is only for "real" non nested rules
                                let prevRuleShortName = this.getLastExplicitRuleShortNameNoCst()
                                let preRuleFullName = this.shortRuleNameToFull.get(
                                    prevRuleShortName
                                )
                                let partialCstResult = this.CST_STACK[
                                    this.CST_STACK.length - 1
                                ]
                                partialCstResult.recoveredNode = true
                                this.cstPostNonTerminalRecovery(
                                    partialCstResult,
                                    preRuleFullName
                                )
                            }
                            // to be handled farther up the call stack
                            throw e
                        }
                    } else if (isFirstInvokedRule) {
                        // otherwise a Redundant input error will be created as well and we cannot guarantee that this is indeed the case
                        this.moveToTerminatedState()
                        // the parser should never throw one of its own errors outside its flow.
                        // even if error recovery is disabled
                        return recoveryValueFunc()
                    } else {
                        // to be handled farther up the call stack
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
            // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
            // the error that would have been thrown
            let msg = this.errorMessageProvider.buildMismatchTokenMessage({
                expected: expectedTokType,
                actual: nextTokenWithoutResync,
                ruleName: this.getCurrRuleFullName()
            })
            let error = new MismatchedTokenException(
                msg,
                nextTokenWithoutResync
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
        return cache.getResyncFollowsForClass(this.className).get(followName)
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
        let firstAfterRepInfo = this.firstAfterRepMap.get(key)
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
                result.push((<any>action).call(this))
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

            let separatorLookAheadFunc = () => {
                return this.tokenMatcher(this.LA(1), separator)
            }
            // 2nd..nth iterations
            while (this.tokenMatcher(this.LA(1), separator) === true) {
                // note that this CONSUME will never enter recovery because
                // the separatorLookAheadFunc checks that the separator really does exist.
                separators.push(this.CONSUME(separator))
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
            result.push(action.call(this))
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
        /* tslint:disable */
        return getKeyForAutomaticLookahead(
            currRuleShortName,
            dslMethodIdx,
            occurrence
        )
        /* tslint:enable */
    }

    private getLookaheadFuncForOr(
        occurrence: number,
        alts: IAnyOrAlt<any>[]
    ): () => number {
        let key = this.getKeyForAutomaticLookahead(OR_IDX, occurrence)
        let laFunc = <any>this.classLAFuncs.get(key)
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
            this.classLAFuncs.put(key, laFunc)
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

        let errMsg = this.errorMessageProvider.buildNoViableAltMessage({
            expectedPathsPerAlt: lookAheadPathsPerAlternative,
            actual: actualTokens,
            customUserDescription: errMsgTypes,
            ruleName: this.getCurrRuleFullName()
        })

        throw this.SAVE_ERROR(new NoViableAltException(errMsg, this.LA(1)))
    }

    private getLookaheadFuncFor(
        key: number,
        occurrence: number,
        maxLookahead: number,
        prodType
    ): () => boolean {
        let laFunc = <any>this.classLAFuncs.get(key)
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
            this.classLAFuncs.put(key, laFunc)
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

    private cstPostNonTerminalRecovery(
        ruleCstResult: CstNode,
        ruleName: string
    ): void {
        // TODO: assumes not first rule, is this assumption always correct?
        addNoneTerminalToCst(
            this.CST_STACK[this.CST_STACK.length - 2],
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
    protected SKIP_TOKEN(): IToken {
        if (this.currIdx <= this.tokVector.length - 2) {
            this.consumeToken()
            return this.LA(1)
        } else {
            return END_OF_FILE
        }
    }

    // Lexer (accessing Token vector) related methods which can be overridden to implement lazy lexers
    // or lexers dependent on parser context.
    protected LA(howMuch: number): IToken {
        // TODO: is this optimization (saving tokVectorLength benefits?)
        if (
            this.currIdx + howMuch < 0 ||
            this.tokVectorLength <= this.currIdx + howMuch
        ) {
            return END_OF_FILE
        } else {
            return this.tokVector[this.currIdx + howMuch]
        }
    }

    protected consumeToken() {
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
}

function InRuleRecoveryException(message: string) {
    this.name = IN_RULE_RECOVERY_EXCEPTION
    this.message = message
}

InRuleRecoveryException.prototype = Error.prototype
