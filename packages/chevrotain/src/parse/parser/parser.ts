import { classNameFromInstance } from "../../lang/lang_extensions"
import {
    applyMixins,
    cloneObj,
    forEach,
    has,
    isEmpty,
    map,
    toFastProperties,
    values
} from "../../utils/utils"
import { computeAllProdsFollows } from "../grammar/follow"
import { createTokenInstance, EOF } from "../../scan/tokens_public"
import { deserializeGrammar } from "../gast_builder"
import { analyzeCst } from "../cst/cst"
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
    serializedGrammar: null,
    nodeLocationTracking: "none"
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
        let defErrorsMsgs

        this.selfAnalysisDone = true
        let className = classNameFromInstance(this)

        let productions = this.gastProductionsCache

        // TODO: Remove grammar serialization support
        if (this.serializedGrammar) {
            const rules = deserializeGrammar(
                this.serializedGrammar,
                this.tokensMap
            )
            forEach(rules, rule => {
                this.gastProductionsCache.put(rule.name, rule)
            })
        }

        // TODO: build GAST using GAST RecordedTrait
        this.enableRecording()
        forEach(this.definedRulesNames, currRuleName => {
            try {
                const wrappedRule = this[currRuleName]
                const originalGrammarAction =
                    wrappedRule["originalGrammarAction"]
                const recordedRuleGast = this.topLevelRuleRecord(
                    currRuleName,
                    originalGrammarAction
                )

                const parsedRuleGast = this.gastProductionsCache.get(
                    currRuleName
                )
                this.gastProductionsCache.put(currRuleName, recordedRuleGast)
                // We do not care about comparing the "orgText"
                delete parsedRuleGast.orgText
                delete recordedRuleGast.orgText
                // deepStrictEqual(recordedRuleGast, parsedRuleGast)
                // expect(recordedRuleGast).to.deep.equal(parsedRuleGast);
            } catch (e) {
                // TODO: different behaivor depending on which error is caught ?
                throw e
            }
        })
        this.disableRecording()

        const resolverErrors = resolveGrammar({
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

        // Avoid performance regressions in newer versions of V8
        toFastProperties(this)
    }

    ignoredIssues: IgnoredParserIssues = DEFAULT_PARSER_CONFIG.ignoredIssues
    definitionErrors: IParserDefinitionError[] = []
    selfAnalysisDone = false

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

        this.ignoredIssues = has(config, "ignoredIssues")
            ? config.ignoredIssues
            : DEFAULT_PARSER_CONFIG.ignoredIssues

        // Avoid performance regressions in newer versions of V8
        // toFastProperties(this)
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
    GastRecorder
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
