import {
    applyMixins,
    cloneObj,
    forEach,
    has,
    isEmpty,
    map,
    PRINT_WARNING,
    toFastProperties,
    values
} from "../../utils/utils"
import { computeAllProdsFollows } from "../grammar/follow"
import { createTokenInstance, EOF } from "../../scan/tokens_public"
import { expandAllNestedRuleNames } from "../cst/cst"
import {
    defaultGrammarValidatorErrorProvider,
    defaultParserErrorProvider
} from "../errors_public"
import {
    resolveGrammar,
    validateGrammar
} from "../grammar/gast/gast_resolver_public"
import {
    CstNode,
    IgnoredParserIssues,
    IParserConfig,
    IParserDefinitionError,
    IRecognitionException,
    IRuleConfig,
    IToken,
    TokenType,
    TokenVocabulary
} from "../../../api"
import { Recoverable } from "./traits/recoverable"
import { LooksAhead } from "./traits/looksahead"
import { TreeBuilder } from "./traits/tree_builder"
import { LexerAdapter } from "./traits/lexer_adapter"
import { RecognizerApi } from "./traits/recognizer_api"
import { RecognizerEngine } from "./traits/recognizer_engine"

import { ErrorHandler } from "./traits/error_handler"
import { MixedInParser } from "./traits/parser_traits"
import { ContentAssist } from "./traits/context_assist"
import { GastRecorder } from "./traits/gast_recorder"
import { PerformanceTracer } from "./traits/perf_tracer"

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

export const DEFAULT_PARSER_CONFIG: IParserConfig = Object.freeze({
    recoveryEnabled: false,
    maxLookahead: 4,
    ignoredIssues: <any>{},
    dynamicTokensEnabled: false,
    outputCst: true,
    errorMessageProvider: defaultParserErrorProvider,
    nodeLocationTracking: "none",
    traceInitPerf: false,
    skipValidations: false
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
        ;(parserInstance as any).performSelfAnalysis()
    }

    public performSelfAnalysis(this: MixedInParser): void {
        this.TRACE_INIT("performSelfAnalysis", () => {
            let defErrorsMsgs

            this.selfAnalysisDone = true
            let className = this.className

            this.TRACE_INIT("toFastProps", () => {
                // Without this voodoo magic the parser would be x3-x4 slower
                // It seems it is better to invoke `toFastProperties` **before**
                // Any manipulations of the `this` object done during the recording phase.
                toFastProperties(this)
            })

            this.TRACE_INIT("Grammar Recording", () => {
                try {
                    this.enableRecording()
                    // Building the GAST
                    forEach(this.definedRulesNames, currRuleName => {
                        const wrappedRule = this[currRuleName]
                        const originalGrammarAction =
                            wrappedRule["originalGrammarAction"]
                        let recordedRuleGast = undefined
                        this.TRACE_INIT(`${currRuleName} Rule`, () => {
                            recordedRuleGast = this.topLevelRuleRecord(
                                currRuleName,
                                originalGrammarAction
                            )
                        })
                        this.gastProductionsCache[
                            currRuleName
                        ] = recordedRuleGast
                    })
                } finally {
                    this.disableRecording()
                }
            })

            let resolverErrors = []
            this.TRACE_INIT("Grammar Resolving", () => {
                resolverErrors = resolveGrammar({
                    rules: values(this.gastProductionsCache)
                })
                this.definitionErrors.push.apply(
                    this.definitionErrors,
                    resolverErrors
                ) // mutability for the win?
            })

            this.TRACE_INIT("Grammar Validations", () => {
                // only perform additional grammar validations IFF no resolving errors have occurred.
                // as unresolved grammar may lead to unhandled runtime exceptions in the follow up validations.
                if (isEmpty(resolverErrors) && this.skipValidations === false) {
                    let validationErrors = validateGrammar({
                        rules: values(this.gastProductionsCache),
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
            })

            // this analysis may fail if the grammar is not perfectly valid
            if (isEmpty(this.definitionErrors)) {
                // The results of these computations are not needed unless error recovery is enabled.
                if (this.recoveryEnabled) {
                    this.TRACE_INIT("computeAllProdsFollows", () => {
                        let allFollows = computeAllProdsFollows(
                            values(this.gastProductionsCache)
                        )
                        this.resyncFollows = allFollows
                    })
                }

                this.TRACE_INIT("ComputeLookaheadFunctions", () => {
                    this.preComputeLookaheadFunctions(
                        values(this.gastProductionsCache)
                    )
                })
            }

            this.TRACE_INIT("expandAllNestedRuleNames", () => {
                // TODO: is this needed for EmbeddedActionsParser?
                let cstAnalysisResult = expandAllNestedRuleNames(
                    values(this.gastProductionsCache),
                    this.fullRuleNameToShort
                )
                this.allRuleNames = cstAnalysisResult.allRuleNames
            })

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
        })
    }

    ignoredIssues: IgnoredParserIssues = DEFAULT_PARSER_CONFIG.ignoredIssues
    definitionErrors: IParserDefinitionError[] = []
    selfAnalysisDone = false
    protected skipValidations: boolean

    constructor(
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig = DEFAULT_PARSER_CONFIG
    ) {
        const that: MixedInParser = this as any
        that.initErrorHandler(config)
        that.initLexerAdapter()
        that.initLooksAhead(config)
        that.initRecognizerEngine(tokenVocabulary, config)
        that.initRecoverable(config)
        that.initTreeBuilder(config)
        that.initContentAssist()
        that.initGastRecorder(config)
        that.initPerformanceTracer(config)

        /* istanbul ignore if - complete over-kill to test this, we should only add a test when we actually hard deprecate it and throw an error... */
        if (
            has(config, "ignoredIssues") &&
            config.ignoredIssues !== DEFAULT_PARSER_CONFIG.ignoredIssues
        ) {
            PRINT_WARNING(
                "The <ignoredIssues> IParserConfig property is soft-deprecated and will be removed in future versions.\n\t" +
                    "Please use the <IGNORE_AMBIGUITIES> flag on the relevant DSL method instead."
            )
        }
        this.ignoredIssues = has(config, "ignoredIssues")
            ? config.ignoredIssues
            : DEFAULT_PARSER_CONFIG.ignoredIssues

        this.skipValidations = has(config, "skipValidations")
            ? config.skipValidations
            : DEFAULT_PARSER_CONFIG.skipValidations
    }
}

applyMixins(Parser, [
    Recoverable,
    LooksAhead,
    TreeBuilder,
    LexerAdapter,
    RecognizerEngine,
    RecognizerApi,
    ErrorHandler,
    ContentAssist,
    GastRecorder,
    PerformanceTracer
])

export class CstParser extends Parser {
    constructor(
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig = DEFAULT_PARSER_CONFIG
    ) {
        const configClone = cloneObj(config)
        configClone.outputCst = true
        super(tokenVocabulary, configClone)
    }
}

export class EmbeddedActionsParser extends Parser {
    constructor(
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig = DEFAULT_PARSER_CONFIG
    ) {
        const configClone = cloneObj(config)
        configClone.outputCst = false
        super(tokenVocabulary, configClone)
    }
}
