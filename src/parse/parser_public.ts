import * as cache from "./cache"
import {exceptions} from "./exceptions_public"
import {classNameFromInstance, HashTable} from "../lang/lang_extensions"
import {resolveGrammar} from "./grammar/resolver"
import {validateGrammar, validateRuleDoesNotAlreadyExist, validateRuleIsOverridden, validateRuleName} from "./grammar/checks"
import {
    cloneArr,
    cloneObj,
    contains,
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
    values
} from "../utils/utils"
import {computeAllProdsFollows} from "./grammar/follow"
import {
    EOF,
    getImage,
    getTokenConstructor,
    hasTokenLabel,
    ISimpleTokenOrIToken,
    IToken,
    LazyToken,
    SimpleLazyToken,
    Token,
    tokenLabel,
    tokenName
} from "../scan/tokens_public"
import {
    buildLookaheadForAtLeastOne,
    buildLookaheadForAtLeastOneSep,
    buildLookaheadForMany,
    buildLookaheadForManySep,
    buildLookaheadForOption,
    buildLookaheadFuncForOr,
    getLookaheadPathsForOptionalProd,
    getLookaheadPathsForOr,
    PROD_TYPE
} from "./grammar/lookahead"
import {TokenConstructor} from "../scan/lexer_public"
import {buildTopProduction} from "./gast_builder"
import {
    AbstractNextTerminalAfterProductionWalker,
    NextAfterTokenWalker,
    nextPossibleTokensAfter,
    NextTerminalAfterAtLeastOneSepWalker,
    NextTerminalAfterAtLeastOneWalker,
    NextTerminalAfterManySepWalker,
    NextTerminalAfterManyWalker
} from "./grammar/interpreter"
import {IN} from "./constants"
import {gast} from "./grammar/gast_public"
import {cloneProduction} from "./grammar/gast"
import {ISyntacticContentAssistPath, ITokenGrammarPath} from "./grammar/path_public"
import {
    augmentTokenClasses,
    isSimpleTokenType,
    tokenClassIdentity,
    tokenInstanceIdentity,
    tokenInstanceofMatcher,
    tokenStructuredIdentity,
    tokenStructuredMatcher
} from "../scan/tokens"
import {CstNode} from "./cst/cst_public"
import {addNoneTerminalToCst, addTerminalToCst, buildChildrenDictionaryDefTopRules, initChildrenDictionary} from "./cst/cst"
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
import ISerializedGast = gast.ISerializedGast
import serializeGrammar = gast.serializeGrammar

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
    DUPLICATE_NESTED_NAME
}

export type IgnoredRuleIssues = { [dslNameAndOccurrence:string]:boolean }
export type IgnoredParserIssues = { [ruleName:string]:IgnoredRuleIssues }

const IN_RULE_RECOVERY_EXCEPTION = "InRuleRecoveryException"
const END_OF_FILE = new EOF();
(<any>END_OF_FILE).tokenType = (<any>EOF).tokenType
Object.freeze(END_OF_FILE)


export type TokenMatcher = (token:ISimpleTokenOrIToken, tokClass:TokenConstructor) => boolean
export type TokenInstanceIdentityFunc = (tok:IToken) => string
export type TokenClassIdentityFunc = (tok:TokenConstructor) => string

export interface IParserConfig {
    /**
     * Is the error recovery / fault tolerance of the Chevrotain Parser enabled.
     */
    recoveryEnabled?:boolean,

    /**
     * Maximum number of tokens the parser will use to choose between alternatives.
     */
    maxLookahead?:number

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
    ignoredIssues?:IgnoredParserIssues

    /**
     * Enable This Flag to to support Dynamically defined Tokens via inheritance.
     * This will disable performance optimizations which cannot work if the whole Token vocabulary is not known
     * During Parser initialization.
     */
    dynamicTokensEnabled?:boolean

    /**
     * TODO: docs
     */
    outputCst?:boolean
}

const DEFAULT_PARSER_CONFIG:IParserConfig = Object.freeze({
    recoveryEnabled:      false,
    maxLookahead:         5,
    ignoredIssues:        <any>{},
    dynamicTokensEnabled: false,
    // TODO: Document this breaking change, can it be mitigated?
    // TODO: change to true
    outputCst:            false
})

export interface IRuleConfig<T> {
    /**
     * The function which will be invoked to produce the returned value for a production that have not been
     * successfully executed and the parser recovered from.
     */
    recoveryValueFunc?:() => T

    /**
     * Enable/Disable re-sync error recovery for this specific production.
     */
    resyncEnabled?:boolean
}

const DEFAULT_RULE_CONFIG:IRuleConfig<any> = Object.freeze({
    recoveryValueFunc: () => undefined,
    resyncEnabled:     true
})

export interface IParserDefinitionError {
    message:string
    type:ParserDefinitionErrorType
    ruleName?:string
}

export interface IParserDuplicatesDefinitionError extends IParserDefinitionError {
    dslName:string
    occurrence:number
    parameter?:string
}

export interface IParserEmptyAlternativeDefinitionError extends IParserDefinitionError {
    occurrence:number
    alternative:number
}

export interface IParserAmbiguousAlternativesDefinitionError extends IParserDefinitionError {
    occurrence:number
    alternatives:number[]
}

export interface IParserUnresolvedRefDefinitionError extends IParserDefinitionError {
    unresolvedRefName:string
}

// parameters needed to compute the key in the FOLLOW_SET map.
export interface IFollowKey {
    ruleName:string
    idxInCallingRule:number
    inRule:string
}

/**
 * OR([
 *  {ALT:XXX },
 *  {ALT:YYY },
 *  {ALT:ZZZ }
 * ])
 */
export interface IOrAlt<T> {
    ALT:() => T
}

/**
 * OR([
 *  { GATE:condition1, ALT:XXX },
 *  { GATE:condition2, ALT:YYY },
 *  { GATE:condition3, ALT:ZZZ }
 * ])
 */
export interface IOrAltWithGate<T> extends IOrAlt<T> {
    NAME?:string
    GATE:() => boolean
    ALT:() => T
}

export type IAnyOrAlt<T> = IOrAlt<T> | IOrAltWithGate<T>

export interface IParserState {
    errors:exceptions.IRecognitionException[]
    lexerState:any
    RULE_STACK:string[]
    CST_STACK:CstNode[]
    LAST_EXPLICIT_RULE_STACK:number[]
}

export interface DSLMethodOpts<T> {
    /**
     * in-lined method name
     */
    NAME?:string

    /**
     * The Grammar to process in this method.
     */
    DEF:GrammarAction<T>
    /**
     * A semantic constraint on this DSL method
     * @see https://github.com/SAP/chevrotain/blob/master/examples/parser/predicate_lookahead/predicate_lookahead.js
     * For farther details.
     */
    GATE?:Predicate
}

export interface DSLMethodOptsWithErr<T> extends DSLMethodOpts<T> {
    /**
     *  Short title/classification to what is being matched.
     *  Will be used in the error message,.
     *  If none is provided, the error message will include the names of the expected
     *  Tokens sequences which start the method's inner grammar
     */
    ERR_MSG?:string
}

export interface OrMethodOpts<T> {

    NAME?:string
    /**
     * The set of alternatives,
     * See detailed description in @link {Parser.OR1}
     */
    DEF:IAnyOrAlt<T>[]
    /**
     * A description for the alternatives used in error messages
     * If none is provided, the error message will include the names of the expected
     * Tokens sequences which may start each alternative.
     */
    ERR_MSG?:string
}

export interface ManySepMethodOpts<T> {

    NAME?:string
    /**
     * The Grammar to process in each iteration.
     */
    DEF:GrammarAction<T>
    /**
     * The separator between each iteration.
     */
    SEP:TokenConstructor
}

export interface AtLeastOneSepMethodOpts<T> extends ManySepMethodOpts<T> {
    /**
     *  Short title/classification to what is being matched.
     *  Will be used in the error message,.
     *  If none is provided, the error message will include the names of the expected
     *  Tokens sequences which start the method's inner grammar
     */
    ERR_MSG?:string
}

export type Predicate = () => boolean
export type GrammarAction<OUT> = () => OUT

export type ISeparatedIterationResult<OUT> =
    {
        values:OUT[], // The aggregated results of the values returned by each iteration.
        separators:ISimpleTokenOrIToken[] // the separator tokens between the iterations
    }

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
export function EMPTY_ALT<T>(value:T = undefined):() => T {
    return function () {
        return value
    }
}

let EOF_FOLLOW_KEY:any = {}

/**
 * A Recognizer capable of self analysis to determine it's grammar structure
 * This is used for more advanced features requiring such information.
 * For example: Error Recovery, Automatic lookahead calculation.
 */
export class Parser {

    static NO_RESYNC:boolean = false
    // Set this flag to true if you don't want the Parser to throw error when problems in it's definition are detected.
    // (normally during the parser's constructor).
    // This is a design time flag, it will not affect the runtime error handling of the parser, just design time errors,
    // for example: duplicate rule names, referencing an unresolved subrule, ect...
    // This flag should not be enabled during normal usage, it is used in special situations, for example when
    // needing to display the parser definition errors in some GUI(online playground).
    static DEFER_DEFINITION_ERRORS_HANDLING:boolean = false

    protected static performSelfAnalysis(parserInstance:Parser):void {
        let definitionErrors = []
        let defErrorsMsgs

        parserInstance.selfAnalysisDone = true
        let className = classNameFromInstance(parserInstance)

        if (className === "") {
            // just a simple "throw Error" without any fancy "definition error" because the logic below relies on a unique parser name to
            // save/access those definition errors...
            throw Error("A Parser's constructor may not be an anonymous Function, it must be a named function\n" +
                "The constructor's name is used at runtime for performance (caching) purposes.")
        }

        // this information should only be computed once
        if (!cache.CLASS_TO_SELF_ANALYSIS_DONE.containsKey(className)) {
            cache.CLASS_TO_SELF_ANALYSIS_DONE.put(className, true)

            let orgProductions = parserInstance._productions
            let clonedProductions = new HashTable<gast.Rule>()
            // clone the grammar productions to support grammar inheritance. requirements:
            // 1. We want to avoid rebuilding the grammar every time so a cache for the productions is used.
            // 2. We need to collect the production from multiple grammars in an inheritance scenario during constructor invocation
            //    so the myGast variable is used.
            // 3. If a Production has been overridden references to it in the GAST must also be updated.
            forEach(orgProductions.keys(), (key) => {
                let value = orgProductions.get(key)
                clonedProductions.put(key, cloneProduction(value))
            })
            cache.getProductionsForClass(className).putAll(clonedProductions)

            // assumes this cache has been initialized (in the relevant parser's constructor)
            // TODO: consider making the self analysis a member method to resolve this.
            // that way it won't be callable before the constructor has been invoked...
            definitionErrors = cache.CLASS_TO_DEFINITION_ERRORS.get(className)

            let resolverErrors = resolveGrammar(clonedProductions)
            definitionErrors.push.apply(definitionErrors, resolverErrors) // mutability for the win?

            // only perform additional grammar validations IFF no resolving errors have occurred.
            // as unresolved grammar may lead to unhandled runtime exceptions in the follow up validations.
            if (isEmpty(resolverErrors)) {
                let validationErrors = validateGrammar(
                    clonedProductions.values(),
                    parserInstance.maxLookahead,
                    values(parserInstance.tokensMap),
                    parserInstance.ignoredIssues)

                definitionErrors.push.apply(definitionErrors, validationErrors) // mutability for the win?
            }

            if (!isEmpty(definitionErrors) && !Parser.DEFER_DEFINITION_ERRORS_HANDLING) {
                defErrorsMsgs = map(definitionErrors, defError => defError.message)
                throw new Error(`Parser Definition Errors detected\n: ${defErrorsMsgs.join("\n-------------------------------\n")}`)
            }
            if (isEmpty(definitionErrors)) { // this analysis may fail if the grammar is not perfectly valid
                let allFollows = computeAllProdsFollows(clonedProductions.values())
                cache.setResyncFollowsForClass(className, allFollows)
            }

            if (parserInstance.outputCst) {
                let dictDefForRules = buildChildrenDictionaryDefTopRules(clonedProductions.values(),
                    parserInstance.fullRuleNameToShort)
                cache.getCstDictDefPerRuleForClass(className).putAll(dictDefForRules)
            }
        }

        // reThrow the validation errors each time an erroneous parser is instantiated
        if (!isEmpty(cache.CLASS_TO_DEFINITION_ERRORS.get(className)) && !Parser.DEFER_DEFINITION_ERRORS_HANDLING) {
            defErrorsMsgs = map(cache.CLASS_TO_DEFINITION_ERRORS.get(className), defError => defError.message)
            throw new Error(`Parser Definition Errors detected\n: ${defErrorsMsgs.join("\n-------------------------------\n")}`)
        }
    }

    protected _errors:exceptions.IRecognitionException[] = []

    /**
     * This flag enables or disables error recovery (fault tolerance) of the parser.
     * If this flag is disabled the parser will halt on the first error.
     */
    protected recoveryEnabled:boolean
    protected dynamicTokensEnabled:boolean
    protected maxLookahead:number
    protected ignoredIssues:IgnoredParserIssues
    protected outputCst:boolean

    protected _input:ISimpleTokenOrIToken[] = []
    protected inputIdx = -1
    protected savedTokenIdx = -1
    protected isBackTrackingStack = []
    protected className:string
    protected RULE_STACK:string[] = []
    protected RULE_OCCURRENCE_STACK:number[] = []
    protected CST_STACK:CstNode[] = []
    protected tokensMap:{ [fqn:string]:TokenConstructor } = undefined

    private firstAfterRepMap
    private classLAFuncs
    private cstDictDefForRule
    private definitionErrors:IParserDefinitionError[]
    private definedRulesNames:string[] = []

    private shortRuleNameToFull = new HashTable<string>()
    private fullRuleNameToShort = new HashTable<number>()

    // The shortName Index must be coded "after" the first 8bits to enable building unique lookahead keys
    private ruleShortNameIdx = 256
    private tokenMatcher:TokenMatcher
    private tokenClassIdentityFunc:TokenClassIdentityFunc
    private tokenInstanceIdentityFunc:TokenInstanceIdentityFunc
    private LAST_EXPLICIT_RULE_STACK:number[] = []
    private selfAnalysisDone = false

    /**
     * Only used internally for storing productions as they are built for the first time.
     * The final productions should be accessed from the static cache.
     */
    private _productions:HashTable<gast.Rule> = new HashTable<gast.Rule>()

    constructor(input:ISimpleTokenOrIToken[], tokensMapOrArr:{ [fqn:string]:TokenConstructor } | TokenConstructor[],
                config:IParserConfig = DEFAULT_PARSER_CONFIG) {
        this._input = input

        // configuration
        this.recoveryEnabled = has(config, "recoveryEnabled") ?
            config.recoveryEnabled :
            DEFAULT_PARSER_CONFIG.recoveryEnabled

        // performance optimization, NOOP will be inlined which
        // effectively means that this optional feature does not exist
        // when not used.
        if (!this.recoveryEnabled) {
            this.attemptInRepetitionRecovery = NOOP
        }

        this.dynamicTokensEnabled = has(config, "dynamicTokensEnabled") ?
            config.dynamicTokensEnabled :
            DEFAULT_PARSER_CONFIG.dynamicTokensEnabled

        this.maxLookahead = has(config, "maxLookahead") ?
            config.maxLookahead :
            DEFAULT_PARSER_CONFIG.maxLookahead

        this.ignoredIssues = has(config, "ignoredIssues") ?
            config.ignoredIssues :
            DEFAULT_PARSER_CONFIG.ignoredIssues

        this.outputCst = has(config, "outputCst") ?
            config.outputCst :
            DEFAULT_PARSER_CONFIG.outputCst

        if (!this.outputCst) {
            this.cstInvocationStateUpdate = NOOP
            this.cstFinallyStateUpdate = NOOP
            this.cstPostTerminal = NOOP
            this.cstPostNonTerminal = NOOP
            this.getLastExplicitRuleShortName = this.getLastExplicitRuleShortNameNoCst
            this.getPreviousExplicitRuleShortName = this.getPreviousExplicitRuleShortNameNoCst
            this.getPreviousExplicitRuleOccurenceIndex = this.getPreviousExplicitRuleOccurenceIndexNoCst
            this.manyInternal = this.manyInternalNoCst
            this.orInternal = this.orInternalNoCst
            this.optionInternal = this.optionInternalNoCst
            this.atLeastOneInternal = this.atLeastOneInternalNoCst
            this.manySepFirstInternal = this.manySepFirstInternalNoCst
            this.atLeastOneSepFirstInternal = this.atLeastOneSepFirstInternalNoCst
            this.invokeRuleNoTry = <any>this.invokeRuleNoTryNoCst
        }

        this.className = classNameFromInstance(this)
        this.firstAfterRepMap = cache.getFirstAfterRepForClass(this.className)
        this.classLAFuncs = cache.getLookaheadFuncsForClass(this.className)
        this.cstDictDefForRule = cache.getCstDictDefPerRuleForClass(this.className)

        if (!cache.CLASS_TO_DEFINITION_ERRORS.containsKey(this.className)) {
            this.definitionErrors = []
            cache.CLASS_TO_DEFINITION_ERRORS.put(this.className, this.definitionErrors)
        }
        else {
            this.definitionErrors = cache.CLASS_TO_DEFINITION_ERRORS.get(this.className)
        }

        if (isArray(tokensMapOrArr)) {
            this.tokensMap = <any>reduce(<any>tokensMapOrArr, (acc, tokenClazz:TokenConstructor) => {
                acc[tokenName(tokenClazz)] = tokenClazz
                return acc
            }, {})
        }
        else if (isObject(tokensMapOrArr)) {
            this.tokensMap = cloneObj(tokensMapOrArr)
        }
        else {
            throw new Error("'tokensMapOrArr' argument must be An Array of Token constructors or a Dictionary of Tokens.")
        }

        let allTokens = values(this.tokensMap)
        let areAllStructuredTokens = every(allTokens, (currTokType) => {
            return isSimpleTokenType(currTokType)
        })

        if (areAllStructuredTokens) {
            this.tokenMatcher = tokenStructuredMatcher
            this.tokenClassIdentityFunc = tokenStructuredIdentity
            // same IdentityFunc used in structured Mode
            this.tokenInstanceIdentityFunc = tokenStructuredIdentity
        } else {
            this.tokenMatcher = tokenInstanceofMatcher
            this.tokenClassIdentityFunc = tokenClassIdentity
            this.tokenInstanceIdentityFunc = tokenInstanceIdentity
        }

        // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
        // parsed with a clear error message ("expecting EOF but found ...")
        /* tslint:disable */
        this.tokensMap["EOF"] = EOF
        /* tslint:enable */

        // Because ES2015+ syntax should be supported for creating Token classes
        // We cannot assume that the Token classes were created using the "extendToken" utilities
        // Therefore we must augment the Token classes both on Lexer initialization and on Parser initialization
        augmentTokenClasses(values(this.tokensMap))
    }

    public get errors():exceptions.IRecognitionException[] {
        return cloneArr(this._errors)
    }

    public set errors(newErrors:exceptions.IRecognitionException[]) {
        this._errors = newErrors
    }

    public set input(newInput:ISimpleTokenOrIToken[]) {
        this.reset()
        this._input = newInput
    }

    public get input():ISimpleTokenOrIToken[] {
        return cloneArr(this._input)
    }

    /**
     * Resets the parser state, should be overridden for custom parsers which "carry" additional state.
     * When overriding, remember to also invoke the super implementation!
     */
    public reset():void {
        this.resetLexerState()

        this.isBackTrackingStack = []
        this.errors = []
        this._input = []
        this.RULE_STACK = []
        this.LAST_EXPLICIT_RULE_STACK = []
        this.CST_STACK = []
        this.RULE_OCCURRENCE_STACK = []
    }

    public isAtEndOfInput():boolean {
        return this.tokenMatcher(this.LA(1), EOF)
    }

    public getGAstProductions():HashTable<gast.Rule> {
        return cache.getProductionsForClass(this.className)
    }

    // This is more than a convenience method.
    // It is mostly used to draw the diagrams and having this method present on the parser instance
    // can avoid certain situations in which the serialization logic would fail due to multiple versions of chevrotain
    // bundled (due to multiple prototype chains and "instanceof" usage).
    public getSerializedGastProductions():gast.ISerializedGast[] {
        return serializeGrammar(cache.getProductionsForClass(this.className).values())
    }

    /**
     * @param startRuleName {string}
     * @param precedingInput {ISimpleTokenOrIToken[]} - The token vector up to (not including) the content assist point
     * @returns {ISyntacticContentAssistPath[]}
     */
    public computeContentAssist(startRuleName:string,
                                precedingInput:ISimpleTokenOrIToken[]):ISyntacticContentAssistPath[] {
        let startRuleGast = cache.getProductionsForClass(this.className).get(startRuleName)

        if (isUndefined(startRuleGast)) {
            throw Error(`Rule ->${startRuleName}<- does not exist in this grammar.`)
        }

        return nextPossibleTokensAfter([startRuleGast], precedingInput, this.tokenMatcher, this.maxLookahead)
    }

    protected isBackTracking():boolean {
        return !(isEmpty(this.isBackTrackingStack))
    }

    protected getCurrRuleFullName():string {
        let shortName = this.getLastExplicitRuleShortName()
        return this.shortRuleNameToFull.get(shortName)
    }

    protected shortRuleNameToFullName(shortName:string) {
        return this.shortRuleNameToFull.get(shortName)
    }

    protected getHumanReadableRuleStack():string[] {
        if (!isEmpty(this.LAST_EXPLICIT_RULE_STACK)) {
            return map(this.LAST_EXPLICIT_RULE_STACK, (currIdx) => this.shortRuleNameToFullName(this.RULE_STACK[currIdx]))
        }
        else {
            return map(this.RULE_STACK, (currShortName) => this.shortRuleNameToFullName(currShortName))
        }
    }

    protected SAVE_ERROR(error:exceptions.IRecognitionException):exceptions.IRecognitionException {
        if (exceptions.isRecognitionException(error)) {
            error.context = {
                ruleStack:           this.getHumanReadableRuleStack(),
                ruleOccurrenceStack: cloneArr(this.RULE_OCCURRENCE_STACK)
            }
            this._errors.push(error)
            return error
        }
        else {
            throw Error("Trying to save an Error which is not a RecognitionException")
        }
    }

    /**
     * @param grammarRule - The rule to try and parse in backtracking mode.
     * @param isValid - A predicate that given the result of the parse attempt will "decide" if the parse was successfully or not.
     *
     * @return {Function():boolean} a lookahead function that will try to parse the given grammarRule and will return true if succeed.
     */
    protected BACKTRACK<T>(grammarRule:(...args) => T, isValid:(T) => boolean):() => boolean {
        return function () {
            // save org state
            this.isBackTrackingStack.push(1)
            let orgState = this.saveRecogState()
            try {
                let ruleResult = grammarRule.call(this)
                return isValid(ruleResult)
            } catch (e) {
                if (exceptions.isRecognitionException(e)) {
                    return false
                }
                else {
                    throw e
                }
            }
            finally {
                this.reloadRecogState(orgState)
                this.isBackTrackingStack.pop()
            }
        }
    }

    // skips a token and returns the next token
    protected SKIP_TOKEN():ISimpleTokenOrIToken {
        // example: assume 45 tokens in the input, if input index is 44 it means that NEXT_TOKEN will return
        // input[45] which is the 46th item and no longer exists,
        // so in this case the largest valid input index is 43 (input.length - 2 )
        if (this.inputIdx <= this._input.length - 2) {
            this.consumeToken()
            return this.LA(1)
        }
        else {
            return END_OF_FILE
        }
    }

    // Parsing DSL
    /**
     * Convenience method equivalent to CONSUME1.
     * @see CONSUME1
     */
    protected CONSUME(tokClass:TokenConstructor):ISimpleTokenOrIToken {
        return this.CONSUME1(tokClass)
    }

    /**
     *
     * A Parsing DSL method use to consume a single terminal Token.
     * a Token will be consumed, IFF the next token in the token vector is an instanceof tokClass.
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
     * @param {Function} tokClass - A constructor function specifying the type of token to be consumed.
     *
     * @returns {Token} - The consumed token.
     */
    protected CONSUME1(tokClass:TokenConstructor):ISimpleTokenOrIToken {
        return this.consumeInternal(tokClass, 1)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME2(tokClass:TokenConstructor):ISimpleTokenOrIToken {
        return this.consumeInternal(tokClass, 2)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME3(tokClass:TokenConstructor):ISimpleTokenOrIToken {
        return this.consumeInternal(tokClass, 3)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME4(tokClass:TokenConstructor):ISimpleTokenOrIToken {
        return this.consumeInternal(tokClass, 4)
    }

    /**
     * @see CONSUME1
     */
    protected CONSUME5(tokClass:TokenConstructor):ISimpleTokenOrIToken {
        return this.consumeInternal(tokClass, 5)
    }

    /**
     * Convenience method equivalent to SUBRULE1
     * @see SUBRULE1
     */
    protected SUBRULE<T>(ruleToCall:(number) => T, args:any[] = undefined):T {
        return this.subruleInternal(ruleToCall, 1, args)
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
     * @param {Function} ruleToCall - The rule to invoke.
     * @param {*[]} args - The arguments to pass to the invoked subrule.
     * @returns {*} - The result of invoking ruleToCall.
     */
    protected SUBRULE1<T>(ruleToCall:(number) => T, args:any[] = undefined):T {
        return this.subruleInternal(ruleToCall, 1, args)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE2<T>(ruleToCall:(number) => T, args:any[] = undefined):T {
        return this.subruleInternal(ruleToCall, 2, args)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE3<T>(ruleToCall:(number) => T, args:any[] = undefined):T {
        return this.subruleInternal(ruleToCall, 3, args)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE4<T>(ruleToCall:(number) => T, args:any[] = undefined):T {
        return this.subruleInternal(ruleToCall, 4, args)
    }

    /**
     * @see SUBRULE1
     */
    protected SUBRULE5<T>(ruleToCall:(number) => T, args:any[] = undefined):T {
        return this.subruleInternal(ruleToCall, 5, args)
    }

    /**
     * Convenience method equivalent to OPTION1.
     * @see OPTION1
     */
    protected OPTION<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT {
        return this.OPTION1(actionORMethodDef)
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
    protected OPTION1<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT {
        return this.optionInternal(actionORMethodDef, 1)
    }

    /**
     * @see OPTION1
     */
    protected OPTION2<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT {
        return this.optionInternal(actionORMethodDef, 2)
    }

    /**
     * @see OPTION1
     */
    protected OPTION3<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT {
        return this.optionInternal(actionORMethodDef, 3)
    }

    /**
     * @see OPTION1
     */
    protected OPTION4<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT {
        return this.optionInternal(actionORMethodDef, 4)
    }

    /**
     * @see OPTION1
     */
    protected OPTION5<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT {
        return this.optionInternal(actionORMethodDef, 5)
    }

    /**
     * Convenience method equivalent to OR1.
     * @see OR1
     */
    protected OR<T>(altsOrOpts:IAnyOrAlt<T>[] | OrMethodOpts<T>):T {
        return this.OR1(altsOrOpts)
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
    protected OR1<T>(altsOrOpts:IAnyOrAlt<T>[] | OrMethodOpts<T>):T {
        return this.orInternal(altsOrOpts, 1)
    }

    /**
     * @see OR1
     */
    protected OR2<T>(altsOrOpts:IAnyOrAlt<T>[] | OrMethodOpts<T>):T {
        return this.orInternal(altsOrOpts, 2)
    }

    /**
     * @see OR1
     */
    protected OR3<T>(altsOrOpts:IAnyOrAlt<T>[] | OrMethodOpts<T>):T {
        return this.orInternal(altsOrOpts, 3)
    }

    /**
     * @see OR1
     */
    protected OR4<T>(altsOrOpts:IAnyOrAlt<T>[] | OrMethodOpts<T>):T {
        return this.orInternal(altsOrOpts, 4)
    }

    /**
     * @see OR1
     */
    protected OR5<T>(altsOrOpts:IAnyOrAlt<T>[] | OrMethodOpts<T>):T {
        return this.orInternal(altsOrOpts, 5)
    }

    /**
     * Convenience method equivalent to MANY1.
     * @see MANY1
     */
    protected MANY<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT[] {
        return this.MANY1(actionORMethodDef)
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
     * @param {Function} actionORMethodDef - The grammar action to optionally invoke multiple times
     *                             or an "OPTIONS" object describing the grammar action and optional properties.
     *
     * @returns {OUT[]}
     */
    protected MANY1<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT[] {
        return this.manyInternal(1, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY2<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT[] {
        return this.manyInternal(2, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY3<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT[] {
        return this.manyInternal(3, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY4<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT[] {
        return this.manyInternal(4, actionORMethodDef, [])
    }

    /**
     * @see MANY1
     */
    protected MANY5<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>):OUT[] {
        return this.manyInternal(5, actionORMethodDef, [])
    }

    /**
     * Convenience method equivalent to MANY_SEP1.
     * @see MANY_SEP1
     */
    protected MANY_SEP<OUT>(options:ManySepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.MANY_SEP1(options)
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
    protected MANY_SEP1<OUT>(options:ManySepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(1, options, {values: [], separators: []})
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP2<OUT>(options:ManySepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(2, options, {values: [], separators: []})
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP3<OUT>(options:ManySepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(3, options, {values: [], separators: []})
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP4<OUT>(options:ManySepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(4, options, {values: [], separators: []})
    }

    /**
     * @see MANY_SEP1
     */
    protected MANY_SEP5<OUT>(options:ManySepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.manySepFirstInternal(5, options, {values: [], separators: []})
    }

    /**
     * Convenience method equivalent to AT_LEAST_ONE1.
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>):OUT[] {
        return this.AT_LEAST_ONE1(actionORMethodDef)
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
    protected AT_LEAST_ONE1<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>):OUT[] {
        return this.atLeastOneInternal(1, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE2<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>):OUT[] {
        return this.atLeastOneInternal(2, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE3<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>):OUT[] {
        return this.atLeastOneInternal(3, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE4<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>):OUT[] {
        return this.atLeastOneInternal(4, actionORMethodDef, [])
    }

    /**
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE5<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>):OUT[] {
        return this.atLeastOneInternal(5, actionORMethodDef, [])
    }

    /**
     * Convenience method equivalent to AT_LEAST_ONE_SEP1.
     * @see AT_LEAST_ONE1
     */
    protected AT_LEAST_ONE_SEP<OUT>(options:AtLeastOneSepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.AT_LEAST_ONE_SEP1(options)
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
    protected AT_LEAST_ONE_SEP1<OUT>(options:AtLeastOneSepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(1, options, {values: [], separators: []})
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP2<OUT>(options:AtLeastOneSepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(2, options, {values: [], separators: []})
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP3<OUT>(options:AtLeastOneSepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(3, options, {values: [], separators: []})
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP4<OUT>(options:AtLeastOneSepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(4, options, {values: [], separators: []})
    }

    /**
     * @see AT_LEAST_ONE_SEP1
     */
    protected AT_LEAST_ONE_SEP5<OUT>(options:AtLeastOneSepMethodOpts<OUT>):ISeparatedIterationResult<OUT> {
        return this.atLeastOneSepFirstInternal(5, options, {values: [], separators: []})
    }

    /**
     *
     * @param {string} name - The name of the rule.
     * @param {Function} implementation - The implementation of the rule.
     * @param {IRuleConfig} [config] - The rule's optional configuration.
     *
     * @returns {Function} - The parsing rule which is the production implementation wrapped with the parsing logic that handles
     *                     Parser state / error recovery&reporting/ ...
     */
    protected RULE<T>(name:string,
                      implementation:(...implArgs:any[]) => T,
                      // TODO: how to describe the optional return type of CSTNode? T|CstNode is not good because it is not backward
                      // compatible, T|any is very general...
                      config:IRuleConfig<T> = DEFAULT_RULE_CONFIG):(idxInCallingRule?:number, ...args:any[]) => T | any {

        let ruleErrors = validateRuleName(name)
        ruleErrors = ruleErrors.concat(validateRuleDoesNotAlreadyExist(name, this.definedRulesNames, this.className))
        this.definedRulesNames.push(name)
        this.definitionErrors.push.apply(this.definitionErrors, ruleErrors) // mutability for the win

        // only build the gast representation once.
        if (!(this._productions.containsKey(name))) {
            let gastProduction = buildTopProduction(implementation.toString(), name, this.tokensMap)
            this._productions.put(name, gastProduction)
        }
        else {
            let parserClassProductions = cache.getProductionsForClass(this.className)
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
    protected OVERRIDE_RULE<T>(name:string,
                               impl:(...implArgs:any[]) => T,
                               config:IRuleConfig<T> = DEFAULT_RULE_CONFIG):(idxInCallingRule?:number, ...args:any[]) => T {

        let ruleErrors = validateRuleName(name)
        ruleErrors = ruleErrors.concat(validateRuleIsOverridden(name, this.definedRulesNames, this.className))
        this.definitionErrors.push.apply(this.definitionErrors, ruleErrors) // mutability for the win

        let alreadyOverridden = cache.getProductionOverriddenForClass(this.className)

        // only build the GAST of an overridden rule once.
        if (!alreadyOverridden.containsKey(name)) {
            alreadyOverridden.put(name, true)
            let gastProduction = buildTopProduction(impl.toString(), name, this.tokensMap)
            this._productions.put(name, gastProduction)
        }
        else {
            let parserClassProductions = cache.getProductionsForClass(this.className)
            // filling up the _productions is always needed to inheriting grammars can access it (as an instance member)
            // otherwise they will be unaware of productions defined in super grammars.
            this._productions.put(name, parserClassProductions.get(name))
        }

        return this.defineRule(name, impl, config)
    }

    protected ruleInvocationStateUpdate(shortName:string, fullName:string, idxInCallingRule:number):void {
        this.RULE_OCCURRENCE_STACK.push(idxInCallingRule)
        this.RULE_STACK.push(shortName)
        // NOOP when cst is disabled
        this.cstInvocationStateUpdate(fullName, shortName)
    }

    protected ruleFinallyStateUpdate():void {
        this.RULE_STACK.pop()
        this.RULE_OCCURRENCE_STACK.pop()

        // NOOP when cst is disabled
        this.cstFinallyStateUpdate()

        if ((this.RULE_STACK.length === 0) && !this.isAtEndOfInput()) {
            let firstRedundantTok = this.LA(1)
            this.SAVE_ERROR(new exceptions.NotAllInputParsedException(
                "Redundant input, expecting EOF but found: " + getImage(firstRedundantTok), firstRedundantTok))
        }
    }

    protected nestedRuleInvocationStateUpdate(nestedRuleName:string, shortNameKey:number):void {
        this.RULE_OCCURRENCE_STACK.push(1)
        this.RULE_STACK.push(<any>shortNameKey)
        this.cstNestedInvocationStateUpdate(nestedRuleName, shortNameKey)
    }

    protected nestedRuleFinallyStateUpdate():void {
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
    protected getTokenToInsert(tokClass:TokenConstructor):ISimpleTokenOrIToken {
        let tokToInsert

        if (LazyToken.prototype.isPrototypeOf(tokClass.prototype)) {
            tokToInsert = new (<any>tokClass)(NaN, NaN, {
                orgText:      "",
                lineToOffset: []
            })
        }
        else if (SimpleLazyToken.prototype.isPrototypeOf(tokClass.prototype)) {
            tokToInsert = {
                startOffset: NaN,
                endOffset:   NaN,
                cacheData:   {
                    orgText:      "",
                    lineToOffset: []
                },
                tokenType:   tokClass.tokenType
            }
        }
        else if (Token.prototype.isPrototypeOf(tokClass.prototype)) {
            tokToInsert = new (<any>tokClass)("", NaN, NaN, NaN, NaN, NaN)
        }
        else {
            throw Error("non exhaustive match")
        }

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
    protected canTokenTypeBeInsertedInRecovery(tokClass:TokenConstructor) {
        return true
    }

    /**
     * @param {Token} actualToken - The actual unexpected (mismatched) Token instance encountered.
     * @param {Function} expectedTokType - The Class of the expected Token.
     * @returns {string} - The error message saved as part of a MismatchedTokenException.
     */
    protected getMisMatchTokenErrorMessage(expectedTokType:TokenConstructor, actualToken:ISimpleTokenOrIToken):string {
        let hasLabel = hasTokenLabel(expectedTokType)
        let expectedMsg = hasLabel ?
            `--> ${tokenLabel(expectedTokType)} <--` :
            `token of type --> ${tokenName(expectedTokType)} <--`

        let msg = `Expecting ${expectedMsg} but found --> '${getImage(actualToken)}' <--`

        return msg
    }

    protected getCurrentGrammarPath(tokClass:TokenConstructor, tokIdxInRule:number):ITokenGrammarPath {
        let pathRuleStack:string[] = this.getHumanReadableRuleStack()
        let pathOccurrenceStack:number[] = cloneArr(this.RULE_OCCURRENCE_STACK)
        let grammarPath:any = {
            ruleStack:         pathRuleStack,
            occurrenceStack:   pathOccurrenceStack,
            lastTok:           tokClass,
            lastTokOccurrence: tokIdxInRule
        }

        return grammarPath
    }

    // TODO: should this be a member method or a utility? it does not have any state or usage of 'this'...
    // TODO: should this be more explicitly part of the public API?
    protected getNextPossibleTokenTypes(grammarPath:ITokenGrammarPath):TokenConstructor[] {
        let topRuleName = first(grammarPath.ruleStack)
        let gastProductions = this.getGAstProductions()
        let topProduction = gastProductions.get(topRuleName)
        let nextPossibleTokenTypes = new NextAfterTokenWalker(topProduction, grammarPath).startWalking()
        return nextPossibleTokenTypes
    }

    protected subruleInternal<T>(ruleToCall:(number) => T, idx, args:any[]) {
        let ruleResult = ruleToCall.call(this, idx, args)
        this.cstPostNonTerminal(ruleResult, (<any>ruleToCall).ruleName)

        return ruleResult
    }

    /**
     * @param tokClass - The Type of Token we wish to consume (Reference to its constructor function).
     * @param idx - Occurrence index of consumed token in the invoking parser rule text
     *         for example:
     *         IDENT (DOT IDENT)*
     *         the first ident will have idx 1 and the second one idx 2
     *         * note that for the second ident the idx is always 2 even if its invoked 30 times in the same rule
     *           the idx is about the position in grammar (source code) and has nothing to do with a specific invocation
     *           details.
     *
     * @returns {Token} - The consumed Token.
     */
    protected consumeInternal(tokClass:TokenConstructor, idx:number):ISimpleTokenOrIToken {
        // TODO: this is an hack to avoid try catch block in V8, should be removed once V8 supports try/catch optimizations.
        // as the IF/ELSE itself has some overhead.
        let consumedToken
        if (!this.recoveryEnabled) {
            consumedToken = this.consumeInternalOptimized(tokClass)
        }
        else {
            consumedToken = this.consumeInternalWithTryCatch(tokClass, idx)
        }

        this.cstPostTerminal(tokClass, consumedToken)
        return consumedToken
    }

    protected consumeInternalWithTryCatch(tokClass:TokenConstructor, idx:number):ISimpleTokenOrIToken {
        try {
            return this.consumeInternalOptimized(tokClass)
        } catch (eFromConsumption) {
            // no recovery allowed during backtracking, otherwise backtracking may recover invalid syntax and accept it
            // but the original syntax could have been parsed successfully without any backtracking + recovery
            if (this.recoveryEnabled &&
                // TODO: more robust checking of the exception type. Perhaps Typescript extending expressions?
                eFromConsumption.name === "MismatchedTokenException" && !this.isBackTracking()) {

                let follows = this.getFollowsForInRuleRecovery(tokClass, idx)
                try {
                    return this.tryInRuleRecovery(tokClass, follows)
                } catch (eFromInRuleRecovery) {
                    if (eFromInRuleRecovery.name === IN_RULE_RECOVERY_EXCEPTION) {
                        // failed in RuleRecovery.
                        // throw the original error in order to trigger reSync error recovery
                        throw eFromConsumption
                    }
                    else {
                        throw eFromInRuleRecovery
                    }
                }
            }
            else {
                throw eFromConsumption
            }
        }
    }

    /**
     * Convenience method equivalent to LA(1)
     * It is no longer used directly in chevrotain due to
     * performance considerations (avoid the need for inlining optimizations).
     *
     * But it is maintained for backward compatibility reasons.
     *
     * @deprecated
     */
    protected NEXT_TOKEN():ISimpleTokenOrIToken {
        return this.LA(1)
    }

    // Lexer (accessing Token vector) related methods which can be overridden to implement lazy lexers
    // or lexers dependent on parser context.
    protected LA(howMuch:number):ISimpleTokenOrIToken {
        if (this._input.length <= this.inputIdx + howMuch) {
            return END_OF_FILE
        }
        else {
            return this._input[this.inputIdx + howMuch]
        }
    }

    protected consumeToken() {
        this.inputIdx++
    }

    protected saveLexerState() {
        this.savedTokenIdx = this.inputIdx
    }

    protected restoreLexerState() {
        this.inputIdx = this.savedTokenIdx
    }

    protected resetLexerState():void {
        this.inputIdx = -1
    }

    protected moveLexerStateToEnd():void {
        this.inputIdx = this.input.length - 1
    }

    // other functionality
    private saveRecogState():IParserState {
        // errors is a getter which will clone the errors array
        let savedErrors = this.errors
        let savedRuleStack = cloneArr(this.RULE_STACK)
        return {
            errors:                   savedErrors,
            lexerState:               this.inputIdx,
            RULE_STACK:               savedRuleStack,
            CST_STACK:                this.CST_STACK,
            LAST_EXPLICIT_RULE_STACK: this.LAST_EXPLICIT_RULE_STACK
        }
    }

    private reloadRecogState(newState:IParserState) {
        this.errors = newState.errors
        this.inputIdx = newState.lexerState
        this.RULE_STACK = newState.RULE_STACK
    }

    private invokeRuleNoTryNoCst(args:any[], impl:Function) {
        let result = impl.apply(this, args)
        this.ruleFinallyStateUpdate()
        return result
    }

    private invokeRuleNoTry(args:any[], impl:Function) {
        impl.apply(this, args)
        let result = this.CST_STACK[this.CST_STACK.length - 1]
        this.ruleFinallyStateUpdate()

        return result
    }

    private defineRule<T>(ruleName:string,
                          impl:(...implArgs:any[]) => T,
                          config:IRuleConfig<T>):(idxInCallingRule?:number, ...args:any[]) => T {

        if (this.selfAnalysisDone) {
            throw Error(`Grammar rule <${ruleName}> may not be defined after the 'performSelfAnalysis' method has been called'\n` +
                `Make sure that all grammar rule definitions are done before 'performSelfAnalysis' is called.`)
        }
        let resyncEnabled = has(config, "resyncEnabled") ?
            config.resyncEnabled :
            DEFAULT_RULE_CONFIG.resyncEnabled
        let recoveryValueFunc = has(config, "recoveryValueFunc") ?
            config.recoveryValueFunc :
            DEFAULT_RULE_CONFIG.recoveryValueFunc

        // performance optimization: Use small integers as keys for the longer human readable "full" rule names.
        // this greatly improves Map access time (as much as 8% for some performance benchmarks).
        /* tslint:disable */
        let shortName = this.ruleShortNameIdx << (BITS_FOR_METHOD_IDX + BITS_FOR_OCCURRENCE_IDX)
        /* tslint:enable */

        this.ruleShortNameIdx++
        this.shortRuleNameToFull.put(shortName, ruleName)
        this.fullRuleNameToShort.put(ruleName, shortName)

        function invokeRuleWithTry(args:any[], isFirstRule:boolean) {
            try {
                // TODO: dynamically get rid of this?
                if (this.outputCst) {
                    impl.apply(this, args)
                    return this.CST_STACK[this.CST_STACK.length - 1]
                }
                else {
                    return impl.apply(this, args)
                }
            } catch (e) {
                // TODO: this is part of a Performance hack for V8 due to lack of support
                // of try/catch optimizations. Should be removed once V8 supports that.
                // This is needed because in case of an error during a nested subRule
                // there will be no "finally" block to perform the "ruleFinallyStateUpdate"
                // So this block properly rewinds the parser's state in the case error recovery is disabled.
                if (isFirstRule) {
                    for (let i = this.RULE_STACK.length; i > 1; i--) {
                        this.ruleFinallyStateUpdate()
                    }
                }

                let isFirstInvokedRule = (this.RULE_STACK.length === 1)
                // note the reSync is always enabled for the first rule invocation, because we must always be able to
                // reSync with EOF and just output some INVALID ParseTree
                // during backtracking reSync recovery is disabled, otherwise we can't be certain the backtracking
                // path is really the most valid one
                let reSyncEnabled = resyncEnabled && !this.isBackTracking() && this.recoveryEnabled

                if (exceptions.isRecognitionException(e)) {
                    if (reSyncEnabled) {
                        let reSyncTokType = this.findReSyncTokenType()
                        if (this.isInCurrentRuleReSyncSet(reSyncTokType)) {
                            e.resyncedTokens = this.reSyncTo(reSyncTokType)
                            if (this.outputCst) {
                                let partialCstResult = this.CST_STACK[this.CST_STACK.length - 1]
                                partialCstResult.recoveredNode = true
                                return partialCstResult
                            }
                            else {
                                return recoveryValueFunc()
                            }
                        }
                        else {
                            if (this.outputCst) {
                                // recovery is only for "real" non nested rules
                                let prevRuleShortName = this.getLastExplicitRuleShortNameNoCst()
                                let preRuleFullName = this.shortRuleNameToFull.get(prevRuleShortName)
                                let partialCstResult = this.CST_STACK[this.CST_STACK.length - 1]
                                partialCstResult.recoveredNode = true
                                this.cstPostNonTerminalRecovery(partialCstResult, preRuleFullName)
                            }
                            // to be handled farther up the call stack
                            throw e
                        }
                    }
                    else if (isFirstInvokedRule) {
                        // otherwise a Redundant input error will be created as well and we cannot guarantee that this is indeed the case
                        this.moveLexerStateToEnd()
                        // the parser should never throw one of its own errors outside its flow.
                        // even if error recovery is disabled
                        return recoveryValueFunc()
                    }
                    else {
                        // to be handled farther up the call stack
                        throw e
                    }
                }
                else {
                    // some other Error type which we don't know how to handle (for example a built in JavaScript Error)
                    throw e
                }
            }
            finally {
                this.ruleFinallyStateUpdate()
            }
        }

        let wrappedGrammarRule

        if (this.recoveryEnabled) {
            wrappedGrammarRule = function (idxInCallingRule:number = 1, args:any[]) {
                this.ruleInvocationStateUpdate(shortName, ruleName, idxInCallingRule)
                // TODO: performance hack due to V8 lack of try/catch optimizations.
                // should be removed once V8 support those.
                let isFirstRule = this.RULE_STACK.length === 1
                return invokeRuleWithTry.call(this, args, isFirstRule)
            }
        } else {
            wrappedGrammarRule = function (idxInCallingRule:number = 1, args:any[]) {
                this.ruleInvocationStateUpdate(shortName, ruleName, idxInCallingRule)
                // TODO: performance hack due to V8 lack of try/catch optimizations.
                // should be removed once V8 support those.
                let isFirstRule = this.RULE_STACK.length === 1
                if (!isFirstRule) {
                    return this.invokeRuleNoTry(args, impl)
                }
                else {
                    return invokeRuleWithTry.call(this, args, isFirstRule)
                }
            }
        }

        let ruleNamePropName = "ruleName"
        wrappedGrammarRule[ruleNamePropName] = ruleName
        return wrappedGrammarRule
    }

    private tryInRepetitionRecovery(grammarRule:Function,
                                    grammarRuleArgs:any[],
                                    lookAheadFunc:() => boolean,
                                    expectedTokType:TokenConstructor):void {
        // TODO: can the resyncTokenType be cached?
        let reSyncTokType = this.findReSyncTokenType()
        this.saveLexerState()
        let resyncedTokens = []
        let passedResyncPoint = false

        let nextTokenWithoutResync = this.LA(1)
        let currToken = this.LA(1)

        let generateErrorMessage = () => {
            // we are preemptively re-syncing before an error has been detected, therefor we must reproduce
            // the error that would have been thrown
            let msg = this.getMisMatchTokenErrorMessage(expectedTokType, nextTokenWithoutResync)
            let error = new exceptions.MismatchedTokenException(msg, nextTokenWithoutResync)
            // the first token here will be the original cause of the error, this is not part of the resyncedTokens property.
            error.resyncedTokens = dropRight(resyncedTokens)
            this.SAVE_ERROR(error)
        }

        while (!passedResyncPoint) {
            // re-synced to a point where we can safely exit the repetition/
            if (this.tokenMatcher(currToken, expectedTokType)) {
                generateErrorMessage()
                return // must return here to avoid reverting the inputIdx
            }
            // we skipped enough tokens so we can resync right back into another iteration of the repetition grammar rule
            else if (lookAheadFunc.call(this)) {
                generateErrorMessage()
                // recursive invocation in other to support multiple re-syncs in the same top level repetition grammar rule
                grammarRule.apply(this, grammarRuleArgs)
                return // must return here to avoid reverting the inputIdx
            }
            else if (this.tokenMatcher(currToken, reSyncTokType)) {
                passedResyncPoint = true
            }
            else {
                currToken = this.SKIP_TOKEN()
                this.addToResyncTokens(currToken, resyncedTokens)
            }
        }

        // we were unable to find a CLOSER point to resync inside the Repetition, reset the state.
        // The parsing exception we were trying to prevent will happen in the NEXT parsing step. it may be handled by
        // "between rules" resync recovery later in the flow.
        this.restoreLexerState()
    }

    private shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch?:TokenConstructor, nextTokIdx?:number):boolean {
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
        if (this.canPerformInRuleRecovery(expectTokAfterLastMatch,
                this.getFollowsForInRuleRecovery(expectTokAfterLastMatch, nextTokIdx))) {
            return false
        }

        return true
    }

    // Error Recovery functionality
    private getFollowsForInRuleRecovery(tokClass:TokenConstructor, tokIdxInRule:number):TokenConstructor[] {
        let grammarPath = this.getCurrentGrammarPath(tokClass, tokIdxInRule)
        let follows = this.getNextPossibleTokenTypes(grammarPath)
        return follows
    }

    private tryInRuleRecovery(expectedTokType:TokenConstructor, follows:TokenConstructor[]):ISimpleTokenOrIToken {
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

    private canPerformInRuleRecovery(expectedToken:TokenConstructor, follows:TokenConstructor[]):boolean {
        return this.canRecoverWithSingleTokenInsertion(expectedToken, follows) ||
            this.canRecoverWithSingleTokenDeletion(expectedToken)
    }

    private canRecoverWithSingleTokenInsertion(expectedTokType:TokenConstructor, follows:TokenConstructor[]):boolean {
        if (!this.canTokenTypeBeInsertedInRecovery(expectedTokType)) {
            return false
        }

        // must know the possible following tokens to perform single token insertion
        if (isEmpty(follows)) {
            return false
        }

        let mismatchedTok = this.LA(1)
        let isMisMatchedTokInFollows = find(follows, (possibleFollowsTokType:TokenConstructor) => {
                return this.tokenMatcher(mismatchedTok, possibleFollowsTokType)
            }) !== undefined

        return isMisMatchedTokInFollows
    }

    private canRecoverWithSingleTokenDeletion(expectedTokType:TokenConstructor):boolean {
        let isNextTokenWhatIsExpected = this.tokenMatcher(this.LA(2), expectedTokType)
        return isNextTokenWhatIsExpected
    }

    private isInCurrentRuleReSyncSet(tokenType:TokenConstructor):boolean {
        let followKey = this.getCurrFollowKey()
        let currentRuleReSyncSet = this.getFollowSetFromFollowKey(followKey)
        return contains(currentRuleReSyncSet, tokenType)
    }

    private findReSyncTokenType():TokenConstructor {
        let allPossibleReSyncTokTypes = this.flattenFollowSet()
        // this loop will always terminate as EOF is always in the follow stack and also always (virtually) in the input
        let nextToken = this.LA(1)
        let k = 2
        while (true) {
            let nextTokenType:any = getTokenConstructor(nextToken)
            if (contains(allPossibleReSyncTokTypes, nextTokenType)) {
                return nextTokenType
            }
            nextToken = this.LA(k)
            k++
        }
    }

    private getCurrFollowKey():IFollowKey {
        // the length is at least one as we always add the ruleName to the stack before invoking the rule.
        if (this.RULE_STACK.length === 1) {
            return EOF_FOLLOW_KEY
        }

        let currRuleShortName = this.getLastExplicitRuleShortName()
        let prevRuleShortName = this.getPreviousExplicitRuleShortName()
        let prevRuleIdx = this.getPreviousExplicitRuleOccurenceIndex()

        return {
            ruleName:         this.shortRuleNameToFullName(currRuleShortName),
            idxInCallingRule: prevRuleIdx,
            inRule:           this.shortRuleNameToFullName(prevRuleShortName)
        }
    }

    private buildFullFollowKeyStack():IFollowKey[] {
        let explicitRuleStack = this.RULE_STACK
        let explicitOccurrenceStack = this.RULE_OCCURRENCE_STACK

        if (!isEmpty(this.LAST_EXPLICIT_RULE_STACK)) {
            explicitRuleStack = map(this.LAST_EXPLICIT_RULE_STACK, (idx) => this.RULE_STACK[idx])
            explicitOccurrenceStack = map(this.LAST_EXPLICIT_RULE_STACK, (idx) => this.RULE_OCCURRENCE_STACK[idx])
        }

        // TODO: only iterate over explicit rules here
        return map(explicitRuleStack, (ruleName, idx) => {
            if (idx === 0) {
                return EOF_FOLLOW_KEY
            }
            return {
                ruleName:         this.shortRuleNameToFullName(ruleName),
                idxInCallingRule: explicitOccurrenceStack[idx],
                inRule:           this.shortRuleNameToFullName(explicitRuleStack[idx - 1])
            }
        })
    }

    private flattenFollowSet():TokenConstructor[] {
        let followStack = map(this.buildFullFollowKeyStack(), (currKey) => {
            return this.getFollowSetFromFollowKey(currKey)
        })
        return <any>flatten(followStack)
    }

    private getFollowSetFromFollowKey(followKey:IFollowKey):TokenConstructor[] {
        if (followKey === EOF_FOLLOW_KEY) {
            return [EOF]
        }

        let followName = followKey.ruleName + followKey.idxInCallingRule + IN + followKey.inRule
        return cache.getResyncFollowsForClass(this.className).get(followName)
    }

    // It does not make any sense to include a virtual EOF token in the list of resynced tokens
    // as EOF does not really exist and thus does not contain any useful information (line/column numbers)
    private addToResyncTokens(token:ISimpleTokenOrIToken, resyncTokens:ISimpleTokenOrIToken[]):ISimpleTokenOrIToken[] {
        if (!this.tokenMatcher(token, EOF)) {
            resyncTokens.push(token)
        }
        return resyncTokens
    }

    private reSyncTo(tokClass:TokenConstructor):ISimpleTokenOrIToken[] {
        let resyncedTokens = []
        let nextTok = this.LA(1)
        while ((this.tokenMatcher(nextTok, tokClass)) === false) {
            nextTok = this.SKIP_TOKEN()
            this.addToResyncTokens(nextTok, resyncedTokens)
        }
        // the last token is not part of the error.
        return dropRight(resyncedTokens)
    }


    private attemptInRepetitionRecovery(prodFunc:Function,
                                        args:any[],
                                        lookaheadFunc:() => boolean,
                                        dslMethodIdx:number,
                                        prodOccurrence:number,
                                        nextToksWalker:typeof AbstractNextTerminalAfterProductionWalker) {

        let key = this.getKeyForAutomaticLookahead(dslMethodIdx, prodOccurrence)
        let firstAfterRepInfo = this.firstAfterRepMap.get(key)
        if (firstAfterRepInfo === undefined) {
            let currRuleName = this.getCurrRuleFullName()
            let ruleGrammar = this.getGAstProductions().get(currRuleName)
            let walker:AbstractNextTerminalAfterProductionWalker = new nextToksWalker(ruleGrammar, prodOccurrence)
            firstAfterRepInfo = walker.startWalking()
            this.firstAfterRepMap.put(key, firstAfterRepInfo)
        }

        let expectTokAfterLastMatch = firstAfterRepInfo.token
        let nextTokIdx = firstAfterRepInfo.occurrence
        let isEndOfRule = firstAfterRepInfo.isEndOfRule

        // special edge case of a TOP most repetition after which the input should END.
        // this will force an attempt for inRule recovery in that scenario.
        if (this.RULE_STACK.length === 1 &&
            isEndOfRule &&
            expectTokAfterLastMatch === undefined) {
            expectTokAfterLastMatch = EOF
            nextTokIdx = 1
        }

        if (this.shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch, nextTokIdx)) {
            // TODO: performance optimization: instead of passing the original args here, we modify
            // the args param (or create a new one) and make sure the lookahead func is explicitly provided
            // to avoid searching the cache for it once more.
            this.tryInRepetitionRecovery(prodFunc, args, lookaheadFunc, expectTokAfterLastMatch)
        }
    }

    private cstNestedInvocationStateUpdate(fullRuleName:string, shortName:string | number):void {
        let initDef = this.cstDictDefForRule.get(shortName)
        // TODO: investigate performance impact of adding accessor methods
        this.CST_STACK.push({
            name:     fullRuleName,
            children: initChildrenDictionary(initDef)
        })
    }

    private cstInvocationStateUpdate(fullRuleName:string, shortName:string | number):void {
        this.LAST_EXPLICIT_RULE_STACK.push(this.RULE_STACK.length - 1)
        let initDef = this.cstDictDefForRule.get(shortName)
        this.CST_STACK.push({
            name:     fullRuleName,
            children: initChildrenDictionary(initDef)
        })
    }

    private cstFinallyStateUpdate():void {
        this.LAST_EXPLICIT_RULE_STACK.pop()
        this.CST_STACK.pop()
    }

    private cstNestedFinallyStateUpdate():void {
        this.CST_STACK.pop()
    }

    // Implementation of parsing DSL
    private optionInternal<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>, occurrence:number):OUT {
        let key = this.getKeyForAutomaticLookahead(OPTION_IDX, occurrence)
        let nestedName = this.nestedRuleBeforeClause(actionORMethodDef, key)
        try {
            return this.optionInternalLogic(actionORMethodDef, occurrence, key)
        }
        finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(key, nestedName)
            }
        }
    }

    private optionInternalNoCst<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>, occurrence:number):OUT {
        let key = this.getKeyForAutomaticLookahead(OPTION_IDX, occurrence)
        return this.optionInternalLogic(actionORMethodDef, occurrence, key)
    }

    private optionInternalLogic<OUT>(actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>, occurrence:number, key:number):OUT {
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
                    return predicate.call(this) &&
                        orgLookaheadFunction.call(this)
                }
            }
        }
        else {
            action = actionORMethodDef
        }

        if ((lookAheadFunc).call(this)) {
            return action.call(this)
        }
        return undefined
    }

    private atLeastOneInternal<OUT>(prodOccurrence:number,
                                    actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
                                    result:OUT[]):OUT[] {
        let laKey = this.getKeyForAutomaticLookahead(AT_LEAST_ONE_IDX, prodOccurrence)
        let nestedName = this.nestedRuleBeforeClause(actionORMethodDef, laKey)
        try {
            return this.atLeastOneInternalLogic(prodOccurrence, actionORMethodDef, result, laKey)
        }
        finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    private atLeastOneInternalNoCst<OUT>(prodOccurrence:number,
                                         actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
                                         result:OUT[]):OUT[] {
        let key = this.getKeyForAutomaticLookahead(AT_LEAST_ONE_IDX, prodOccurrence)
        return this.atLeastOneInternalLogic(prodOccurrence, actionORMethodDef, result, key)
    }

    private atLeastOneInternalLogic<OUT>(prodOccurrence:number,
                                         actionORMethodDef:GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
                                         result:OUT[],
                                         key:number):OUT[] {
        let lookAheadFunc = this.getLookaheadFuncForAtLeastOne(key, prodOccurrence)

        let action
        let predicate
        if ((<DSLMethodOptsWithErr<OUT>>actionORMethodDef).DEF !== undefined) {
            action = (<DSLMethodOptsWithErr<OUT>>actionORMethodDef).DEF
            predicate = (<DSLMethodOptsWithErr<OUT>>actionORMethodDef).GATE
            // predicate present
            if (predicate !== undefined) {
                let orgLookaheadFunction = lookAheadFunc
                lookAheadFunc = () => {
                    return predicate.call(this) &&
                        orgLookaheadFunction.call(this)
                }
            }
        }
        else {
            action = actionORMethodDef
        }

        if ((<Function>lookAheadFunc).call(this)) {
            result.push((<any>action).call(this))
            while ((<Function>lookAheadFunc).call(this)) {
                result.push((<any>action).call(this))
            }
        }
        else {
            throw this.raiseEarlyExitException(prodOccurrence, PROD_TYPE.REPETITION_MANDATORY,
                (<DSLMethodOptsWithErr<OUT>>actionORMethodDef).ERR_MSG)
        }

        // note that while it may seem that this can cause an error because by using a recursive call to
        // AT_LEAST_ONE we change the grammar to AT_LEAST_TWO, AT_LEAST_THREE ... , the possible recursive call
        // from the tryInRepetitionRecovery(...) will only happen IFF there really are TWO/THREE/.... items.

        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
        this.attemptInRepetitionRecovery(this.atLeastOneInternal, [prodOccurrence, actionORMethodDef, result],
            <any>lookAheadFunc, AT_LEAST_ONE_IDX, prodOccurrence, NextTerminalAfterAtLeastOneWalker)

        return result
    }

    private atLeastOneSepFirstInternal<OUT>(prodOccurrence:number,
                                            options:AtLeastOneSepMethodOpts<OUT>,
                                            result:ISeparatedIterationResult<OUT>):ISeparatedIterationResult<OUT> {

        let laKey = this.getKeyForAutomaticLookahead(AT_LEAST_ONE_SEP_IDX, prodOccurrence)
        let nestedName = this.nestedRuleBeforeClause(options, laKey)
        try {
            return this.atLeastOneSepFirstInternalLogic(prodOccurrence, options, result, laKey)
        }
        finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    private atLeastOneSepFirstInternalNoCst<OUT>(prodOccurrence:number,
                                                 options:AtLeastOneSepMethodOpts<OUT>,
                                                 result:ISeparatedIterationResult<OUT>):ISeparatedIterationResult<OUT> {
        let laKey = this.getKeyForAutomaticLookahead(AT_LEAST_ONE_SEP_IDX, prodOccurrence)
        return this.atLeastOneSepFirstInternalLogic(prodOccurrence, options, result, laKey)

    }

    private atLeastOneSepFirstInternalLogic<OUT>(prodOccurrence:number,
                                                 options:AtLeastOneSepMethodOpts<OUT>,
                                                 result:ISeparatedIterationResult<OUT>,
                                                 key:number):ISeparatedIterationResult<OUT> {
        let action = options.DEF
        let separator = options.SEP

        let firstIterationLookaheadFunc = this.getLookaheadFuncForAtLeastOneSep(key, prodOccurrence)

        let values = result.values
        let separators = result.separators

        // 1st iteration
        if (firstIterationLookaheadFunc.call(this)) {
            values.push((<GrammarAction<OUT>>action).call(this))

            let separatorLookAheadFunc = () => {return this.tokenMatcher(this.LA(1), separator)}
            // 2nd..nth iterations
            while (this.tokenMatcher(this.LA(1), separator)) {
                // note that this CONSUME will never enter recovery because
                // the separatorLookAheadFunc checks that the separator really does exist.
                separators.push(this.CONSUME(separator))
                values.push((<GrammarAction<OUT>>action).call(this))
            }

            // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
            this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,
                [prodOccurrence, separator, separatorLookAheadFunc, action, NextTerminalAfterAtLeastOneSepWalker, result],
                separatorLookAheadFunc,
                AT_LEAST_ONE_SEP_IDX,
                prodOccurrence,
                NextTerminalAfterAtLeastOneSepWalker)
        }
        else {
            throw this.raiseEarlyExitException(prodOccurrence, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR, options.ERR_MSG)
        }

        return result
    }

    private manyInternal<OUT>(prodOccurrence:number,
                              actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>,
                              result:OUT[]):OUT[] {

        let laKey = this.getKeyForAutomaticLookahead(MANY_IDX, prodOccurrence)
        let nestedName = this.nestedRuleBeforeClause(actionORMethodDef, laKey)
        try {
            return this.manyInternalLogic(prodOccurrence, actionORMethodDef, result, laKey)
        }
        finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    private manyInternalNoCst<OUT>(prodOccurrence:number,
                                   actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>,
                                   result:OUT[]):OUT[] {
        let laKey = this.getKeyForAutomaticLookahead(MANY_IDX, prodOccurrence)
        return this.manyInternalLogic(prodOccurrence, actionORMethodDef, result, laKey)
    }

    private manyInternalLogic<OUT>(prodOccurrence:number,
                                   actionORMethodDef:GrammarAction<OUT> | DSLMethodOpts<OUT>,
                                   result:OUT[], key:number):OUT[] {

        let lookaheadFunction = this.getLookaheadFuncForMany(key, prodOccurrence)

        let action
        let predicate
        if ((<DSLMethodOpts<OUT>>actionORMethodDef).DEF !== undefined) {
            action = (<DSLMethodOpts<OUT>>actionORMethodDef).DEF
            predicate = (<DSLMethodOpts<OUT>>actionORMethodDef).GATE
            // predicate present
            if (predicate !== undefined) {
                let orgLookaheadFunction = lookaheadFunction
                lookaheadFunction = () => {
                    return predicate.call(this) &&
                        orgLookaheadFunction.call(this)
                }
            }
        }
        else {
            action = actionORMethodDef
        }

        while (lookaheadFunction.call(this)) {
            result.push(action.call(this))
        }

        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
        this.attemptInRepetitionRecovery(this.manyInternal,
            [prodOccurrence, actionORMethodDef, result],
            <any>lookaheadFunction,
            MANY_IDX,
            prodOccurrence,
            NextTerminalAfterManyWalker)

        return result
    }

    private manySepFirstInternal<OUT>(prodOccurrence:number,
                                      options:ManySepMethodOpts<OUT>,
                                      result:ISeparatedIterationResult<OUT>):ISeparatedIterationResult<OUT> {
        let laKey = this.getKeyForAutomaticLookahead(MANY_SEP_IDX, prodOccurrence)
        let nestedName = this.nestedRuleBeforeClause(options, laKey)
        try {
            return this.manySepFirstInternalLogic(prodOccurrence, options, result, laKey)
        }
        finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    private manySepFirstInternalNoCst<OUT>(prodOccurrence:number,
                                           options:ManySepMethodOpts<OUT>,
                                           result:ISeparatedIterationResult<OUT>):ISeparatedIterationResult<OUT> {
        let laKey = this.getKeyForAutomaticLookahead(MANY_SEP_IDX, prodOccurrence)
        return this.manySepFirstInternalLogic(prodOccurrence, options, result, laKey)
    }

    private manySepFirstInternalLogic<OUT>(prodOccurrence:number,
                                           options:ManySepMethodOpts<OUT>,
                                           result:ISeparatedIterationResult<OUT>,
                                           key:number):ISeparatedIterationResult<OUT> {
        let action = options.DEF
        let separator = options.SEP

        let firstIterationLaFunc = this.getLookaheadFuncForManySep(key, prodOccurrence)

        let values = result.values
        let separators = result.separators

        // 1st iteration
        if (firstIterationLaFunc.call(this)) {
            values.push(action.call(this))

            let separatorLookAheadFunc = () => {return this.tokenMatcher(this.LA(1), separator)}
            // 2nd..nth iterations
            while (this.tokenMatcher(this.LA(1), separator)) {
                // note that this CONSUME will never enter recovery because
                // the separatorLookAheadFunc checks that the separator really does exist.
                separators.push(this.CONSUME(separator))
                values.push(action.call(this))
            }

            // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
            this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,
                [prodOccurrence, separator, separatorLookAheadFunc, action, NextTerminalAfterManySepWalker, result],
                separatorLookAheadFunc,
                MANY_SEP_IDX,
                prodOccurrence,
                NextTerminalAfterManySepWalker)
        }
        return result
    }

    private repetitionSepSecondInternal<OUT>(prodOccurrence:number,
                                             separator:TokenConstructor,
                                             separatorLookAheadFunc:() => boolean,
                                             action:GrammarAction<OUT>,
                                             nextTerminalAfterWalker:typeof AbstractNextTerminalAfterProductionWalker,
                                             result:ISeparatedIterationResult<OUT>):void {


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
        this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal,
            [prodOccurrence, separator, separatorLookAheadFunc, action, nextTerminalAfterWalker, result],
            separatorLookAheadFunc,
            AT_LEAST_ONE_SEP_IDX,
            prodOccurrence,
            nextTerminalAfterWalker)
    }

    private orInternalNoCst<T>(altsOrOpts:IAnyOrAlt<T>[] | OrMethodOpts<T>,
                               occurrence:number):T {
        let alts = isArray(altsOrOpts) ? altsOrOpts as IAnyOrAlt<T>[] : (altsOrOpts as OrMethodOpts<T>).DEF
        let laFunc = this.getLookaheadFuncForOr(occurrence, alts)
        let altIdxToTake = laFunc.call(this, alts)
        if (altIdxToTake !== undefined) {
            let chosenAlternative:any = alts[altIdxToTake]
            return chosenAlternative.ALT.call(this)
        }
        this.raiseNoAltException(occurrence, (altsOrOpts as OrMethodOpts<T>).ERR_MSG)
    }

    private orInternal<T>(altsOrOpts:IAnyOrAlt<T>[] | OrMethodOpts<T>,
                          occurrence:number):T {
        let laKey = this.getKeyForAutomaticLookahead(OR_IDX, occurrence)
        let nestedName = this.nestedRuleBeforeClause(altsOrOpts, laKey)

        try {
            let alts = isArray(altsOrOpts) ? altsOrOpts as IAnyOrAlt<T>[] : (altsOrOpts as OrMethodOpts<T>).DEF

            let laFunc = this.getLookaheadFuncForOr(occurrence, alts)
            let altIdxToTake = laFunc.call(this, alts)
            if (altIdxToTake !== undefined) {
                let chosenAlternative:any = alts[altIdxToTake]
                let nestedAltBeforeClauseResult = this.nestedAltBeforeClause(chosenAlternative, occurrence, OR_IDX, altIdxToTake)
                try {
                    return chosenAlternative.ALT.call(this)
                }
                finally {
                    if (nestedAltBeforeClauseResult !== undefined) {
                        this.nestedRuleFinallyClause(nestedAltBeforeClauseResult.shortName, nestedAltBeforeClauseResult.nestedName)
                    }
                }
            }
            this.raiseNoAltException(occurrence, (altsOrOpts as OrMethodOpts<T>).ERR_MSG)
        }
        finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    // to enable optimizations this logic has been extract to a method as its invoker contains try/catch
    private consumeInternalOptimized(expectedTokClass:TokenConstructor):ISimpleTokenOrIToken {
        let nextToken = this.LA(1)
        if (this.tokenMatcher(nextToken, expectedTokClass)) {
            this.consumeToken()
            return nextToken
        }
        else {
            let msg = this.getMisMatchTokenErrorMessage(expectedTokClass, nextToken)
            throw this.SAVE_ERROR(new exceptions.MismatchedTokenException(msg, nextToken))
        }
    }

    // this actually returns a number, but it is always used as a string (object prop key)
    private getKeyForAutomaticLookahead(dslMethodIdx:number, occurrence:number):number {
        let currRuleShortName:any = this.getLastExplicitRuleShortName()
        /* tslint:disable */
        return getKeyForAutomaticLookahead(currRuleShortName, dslMethodIdx, occurrence)
        /* tslint:enable */
    }

    private getLookaheadFuncForOr(occurrence:number, alts:IAnyOrAlt<any>[]):() => number {
        let key = this.getKeyForAutomaticLookahead(OR_IDX, occurrence)
        let laFunc = <any>this.classLAFuncs.get(key)
        if (laFunc === undefined) {
            let ruleName = this.getCurrRuleFullName()
            let ruleGrammar = this.getGAstProductions().get(ruleName)
            // note that hasPredicates is only computed once.
            let hasPredicates = some(alts, (currAlt) => isFunction((<IOrAltWithGate<any>>currAlt).GATE))
            laFunc = buildLookaheadFuncForOr(
                occurrence,
                ruleGrammar,
                this.maxLookahead,
                hasPredicates,
                this.tokenMatcher,
                this.tokenClassIdentityFunc,
                this.tokenInstanceIdentityFunc,
                this.dynamicTokensEnabled)
            this.classLAFuncs.put(key, laFunc)
            return laFunc
        }
        else {
            return laFunc
        }
    }

    // Automatic lookahead calculation
    private getLookaheadFuncForOption(key:number, occurrence:number):() => boolean {
        return this.getLookaheadFuncFor(key, occurrence, buildLookaheadForOption, this.maxLookahead)
    }

    private getLookaheadFuncForMany(key:number, occurrence:number):() => boolean {
        return this.getLookaheadFuncFor(key, occurrence, buildLookaheadForMany, this.maxLookahead)
    }

    private getLookaheadFuncForManySep(key:number, occurrence:number):() => boolean {
        return this.getLookaheadFuncFor(key, occurrence, buildLookaheadForManySep, this.maxLookahead)
    }

    private getLookaheadFuncForAtLeastOne(key:number, occurrence:number):() => boolean {
        return this.getLookaheadFuncFor(key, occurrence, buildLookaheadForAtLeastOne, this.maxLookahead)
    }

    private getLookaheadFuncForAtLeastOneSep(key:number, occurrence:number):() => boolean {
        return this.getLookaheadFuncFor(key, occurrence, buildLookaheadForAtLeastOneSep, this.maxLookahead)
    }

    // TODO: consider caching the error message computed information
    private raiseNoAltException(occurrence:number, errMsgTypes:string):void {
        let errSuffix = "\nbut found: '" + getImage(this.LA(1)) + "'"
        if (errMsgTypes === undefined) {
            let ruleName = this.getCurrRuleFullName()
            let ruleGrammar = this.getGAstProductions().get(ruleName)
            // TODO: getLookaheadPathsForOr can be slow for large enough maxLookahead and certain grammars, consider caching ?
            let lookAheadPathsPerAlternative = getLookaheadPathsForOr(occurrence, ruleGrammar, this.maxLookahead)
            let allLookAheadPaths = reduce(lookAheadPathsPerAlternative, (result, currAltPaths) => result.concat(currAltPaths), [])
            let nextValidTokenSequences = map(allLookAheadPaths, (currPath) =>
                `[${map(currPath, (currTokenClass) => tokenLabel(currTokenClass)).join(", ")}]`)
            let nextValidSequenceItems = map(nextValidTokenSequences, (itemMsg, idx) => `  ${idx + 1}. ${itemMsg}`)
            errMsgTypes = `one of these possible Token sequences:\n${nextValidSequenceItems.join("\n")}`
        }


        throw this.SAVE_ERROR(new exceptions.NoViableAltException(`Expecting: ${errMsgTypes}${errSuffix}`, this.LA(1)))
    }

    private getLookaheadFuncFor<T>(key:number,
                                   occurrence:number,
                                   laFuncBuilder:(number,
                                                  rule,
                                                  k,
                                                  tokenMatcher,
                                                  tokenClassIdentityFunc,
                                                  tokenInstanceIdentityFunc,
                                                  dynamicTokensEnabled) => () => T,
                                   maxLookahead:number):() => T {
        let laFunc = <any>this.classLAFuncs.get(key)
        if (laFunc === undefined) {
            let ruleName = this.getCurrRuleFullName()
            let ruleGrammar = this.getGAstProductions().get(ruleName)
            laFunc = laFuncBuilder.apply(null,
                [occurrence, ruleGrammar, maxLookahead, this.tokenMatcher,
                    this.tokenClassIdentityFunc, this.tokenInstanceIdentityFunc, this.dynamicTokensEnabled])
            this.classLAFuncs.put(key, laFunc)
            return laFunc
        }
        else {
            return laFunc
        }
    }

    // TODO: consider caching the error message computed information
    private raiseEarlyExitException(occurrence:number,
                                    prodType:PROD_TYPE,
                                    userDefinedErrMsg:string):void {
        let errSuffix = " but found: '" + getImage(this.LA(1)) + "'"
        if (userDefinedErrMsg === undefined) {
            let ruleName = this.getCurrRuleFullName()
            let ruleGrammar = this.getGAstProductions().get(ruleName)
            let lookAheadPathsPerAlternative = getLookaheadPathsForOptionalProd(occurrence, ruleGrammar, prodType, this.maxLookahead)
            let insideProdPaths = lookAheadPathsPerAlternative[0]
            let nextValidTokenSequences = map(insideProdPaths, (currPath) =>
                `[${map(currPath, (currTokenClass) => tokenLabel(currTokenClass)).join(",")}]`)
            userDefinedErrMsg = `expecting at least one iteration which starts with one of these possible Token sequences::\n  ` +
                `<${nextValidTokenSequences.join(" ,")}>`
        }
        else {
            userDefinedErrMsg = `Expecting at least one ${userDefinedErrMsg}`
        }
        throw this.SAVE_ERROR(new exceptions.EarlyExitException(userDefinedErrMsg + errSuffix, this.LA(1)))
    }

    private getLastExplicitRuleShortName():string {
        let lastExplictIndex = this.LAST_EXPLICIT_RULE_STACK[this.LAST_EXPLICIT_RULE_STACK.length - 1]
        return this.RULE_STACK[lastExplictIndex]
    }

    private getLastExplicitRuleShortNameNoCst():string {
        let ruleStack = this.RULE_STACK
        return ruleStack[ruleStack.length - 1]
    }

    private getPreviousExplicitRuleShortName():string {
        let lastExplicitIndex = this.LAST_EXPLICIT_RULE_STACK[this.LAST_EXPLICIT_RULE_STACK.length - 2]
        return this.RULE_STACK[lastExplicitIndex]
    }

    private getPreviousExplicitRuleShortNameNoCst():string {
        let ruleStack = this.RULE_STACK
        return ruleStack[ruleStack.length - 2]
    }

    private getPreviousExplicitRuleOccurenceIndex():number {
        let lastExplicitIndex = this.LAST_EXPLICIT_RULE_STACK[this.LAST_EXPLICIT_RULE_STACK.length - 2]
        return this.RULE_OCCURRENCE_STACK[lastExplicitIndex]
    }

    private getPreviousExplicitRuleOccurenceIndexNoCst():number {
        let occurrenceStack = this.RULE_OCCURRENCE_STACK
        return occurrenceStack[occurrenceStack.length - 2]
    }

    private nestedRuleBeforeClause(methodOpts:{ NAME?:string },
                                   laKey:number):string {
        let nestedName
        if (methodOpts.NAME !== undefined) {
            nestedName = methodOpts.NAME
            this.nestedRuleInvocationStateUpdate(nestedName, laKey)
            return nestedName
        }
        else {
            return undefined
        }
    }

    private nestedAltBeforeClause(methodOpts:{ NAME?:string },
                                  occurrence:number,
                                  methodKeyIdx:number,
                                  altIdx:number):{ shortName?:number, nestedName?:string } {
        let ruleIdx = this.getLastExplicitRuleShortName()
        let shortName = getKeyForAltIndex(<any>ruleIdx, methodKeyIdx, occurrence, altIdx)
        let nestedName
        if (methodOpts.NAME !== undefined) {
            nestedName = methodOpts.NAME
            this.nestedRuleInvocationStateUpdate(nestedName, shortName)
            return {
                shortName,
                nestedName
            }
        }
        else {
            return undefined
        }
    }

    private nestedRuleFinallyClause(laKey:number, nestedName:string):void {
        let cstStack = this.CST_STACK
        let nestedRuleCst = cstStack[cstStack.length - 1]
        this.nestedRuleFinallyStateUpdate()
        // this return a different result than the previous invocation because "nestedRuleFinallyStateUpdate" pops the cst stack
        let parentCstNode = cstStack[cstStack.length - 1]
        addNoneTerminalToCst(parentCstNode, nestedName, nestedRuleCst)
    }

    private cstPostTerminal(tokClass:TokenConstructor, consumedToken:ISimpleTokenOrIToken):void {
        let currTokTypeName = tokClass.tokenName
        let rootCst = this.CST_STACK[this.CST_STACK.length - 1]
        addTerminalToCst(rootCst, consumedToken, currTokTypeName)
    }

    private cstPostNonTerminal(ruleCstResult:CstNode, ruleName:string):void {
        addNoneTerminalToCst(this.CST_STACK[this.CST_STACK.length - 1], ruleName, ruleCstResult)
    }

    private cstPostNonTerminalRecovery(ruleCstResult:CstNode, ruleName:string):void {
        // TODO: assumes not first rule, is this assumption always correct?
        addNoneTerminalToCst(this.CST_STACK[this.CST_STACK.length - 2], ruleName, ruleCstResult)
    }
}

function InRuleRecoveryException(message:string) {
    this.name = IN_RULE_RECOVERY_EXCEPTION
    this.message = message
}

InRuleRecoveryException.prototype = Error.prototype
