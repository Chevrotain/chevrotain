import { classNameFromInstance, HashTable } from "../lang/lang_extensions"
import {
    applyMixins,
    cloneObj,
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
import { deserializeGrammar } from "./gast_builder"
import {
    IFirstAfterRepetition,
    NextAfterTokenWalker,
    nextPossibleTokensAfter
} from "./grammar/interpreter"
import {
    augmentTokenTypes,
    isTokenType,
    tokenStructuredMatcher,
    tokenStructuredMatcherNoCategories
} from "../scan/tokens"
import { analyzeCst } from "./cst/cst"
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
    CstNode,
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
    TokenType,
    TokenVocabulary
} from "../../api"
import {
    attemptInRepetitionRecovery as enabledAttemptInRepetitionRecovery,
    Recoverable
} from "./traits/recoverable"
import { LooksAhead } from "./traits/looksahead"
import { TreeBuilder } from "./traits/tree_builder"
import { LexerAdapter } from "./traits/lexer_adapter"
import { RecognizerApi } from "./traits/recognizer_api"
import { RecognizerEngine } from "./traits/recognizer_engine"

import { ErrorHandler } from "./traits/error_handler"
import { MixedInParser } from "./traits/parser_traits"

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

export interface IParserState {
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

export class Parser {
    // Recoverable Trait fields
    firstAfterRepMap = new HashTable<IFirstAfterRepetition>()
    resyncFollows: HashTable<TokenType[]> = new HashTable<TokenType[]>()

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
    allRuleNames: string[] = []
    baseCstVisitorConstructor: Function
    baseCstVisitorWithDefaultsConstructor: Function
    gastProductionsCache: HashTable<Rule> = new HashTable<Rule>()

    _errors: IRecognitionException[] = []

    // These configuration properties are also assigned in the constructor
    // This is a little bit of duplication but seems to help with performance regression on V8
    // Probably due to hidden class changes.
    /**
     * This flag enables or disables error recovery (fault tolerance) of the parser.
     * If this flag is disabled the parser will halt on the first error.
     */
    recoveryEnabled: boolean = DEFAULT_PARSER_CONFIG.recoveryEnabled
    dynamicTokensEnabled: boolean = DEFAULT_PARSER_CONFIG.dynamicTokensEnabled
    maxLookahead: number = DEFAULT_PARSER_CONFIG.maxLookahead
    ignoredIssues: IgnoredParserIssues = DEFAULT_PARSER_CONFIG.ignoredIssues
    outputCst: boolean = DEFAULT_PARSER_CONFIG.outputCst
    serializedGrammar: ISerializedGast[] =
        DEFAULT_PARSER_CONFIG.serializedGrammar

    // adapters
    errorMessageProvider: IParserErrorMessageProvider =
        DEFAULT_PARSER_CONFIG.errorMessageProvider

    isBackTrackingStack = []
    className: string = "Parser"
    RULE_STACK: string[] = []
    RULE_OCCURRENCE_STACK: number[] = []
    CST_STACK: CstNode[] = []
    tokensMap: { [fqn: string]: TokenType } = {}

    /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
    lookAheadFuncsCache: any = isES2015MapSupported() ? new Map() : []
    definitionErrors: IParserDefinitionError[] = []
    definedRulesNames: string[] = []

    shortRuleNameToFull = new HashTable<string>()
    fullRuleNameToShort = new HashTable<number>()

    // The shortName Index must be coded "after" the first 8bits to enable building unique lookahead keys
    ruleShortNameIdx = 256
    tokenMatcher: TokenMatcher = tokenStructuredMatcherNoCategories
    LAST_EXPLICIT_RULE_STACK: number[] = []
    selfAnalysisDone = false

    // lexerState
    tokVector: IToken[] = []
    tokVectorLength = 0
    currIdx: number = -1

    constructor(
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig = DEFAULT_PARSER_CONFIG
    ) {
        const that: MixedInParser = this as any
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
            that.attemptInRepetitionRecovery = enabledAttemptInRepetitionRecovery
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
            that.getLaFuncFromCache = Object.getPrototypeOf(
                this
            ).getLaFuncFromMap
            that.setLaFuncCache = Object.getPrototypeOf(
                this
            ).setLaFuncCacheUsingMap
        } else {
            that.getLaFuncFromCache = Object.getPrototypeOf(
                this
            ).getLaFuncFromObj
            that.setLaFuncCache = Object.getPrototypeOf(this).setLaFuncUsingObj
        }

        if (!this.outputCst) {
            that.cstInvocationStateUpdate = NOOP
            that.cstFinallyStateUpdate = NOOP
            that.cstPostTerminal = NOOP
            that.cstPostNonTerminal = NOOP
            // TODO: maybe access this._proto?
            that.getLastExplicitRuleShortName = Object.getPrototypeOf(
                this
            ).getLastExplicitRuleShortNameNoCst
            that.getPreviousExplicitRuleShortName = Object.getPrototypeOf(
                this
            ).getPreviousExplicitRuleShortNameNoCst
            that.getLastExplicitRuleOccurrenceIndex = Object.getPrototypeOf(
                this
            ).getLastExplicitRuleOccurrenceIndexNoCst
            that.manyInternal = that.manyInternalNoCst
            that.orInternal = that.orInternalNoCst
            that.optionInternal = that.optionInternalNoCst
            that.atLeastOneInternal = that.atLeastOneInternalNoCst
            that.manySepFirstInternal = that.manySepFirstInternalNoCst
            that.atLeastOneSepFirstInternal =
                that.atLeastOneSepFirstInternalNoCst
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

    // other stuff
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

    // other functionality
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
}

applyMixins(Parser, [
    Recoverable,
    LooksAhead,
    TreeBuilder,
    LexerAdapter,
    RecognizerEngine,
    RecognizerApi,
    ErrorHandler
])
