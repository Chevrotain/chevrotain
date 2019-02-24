import {
    AtLeastOneSepMethodOpts,
    ConsumeMethodOpts,
    DSLMethodOpts,
    DSLMethodOptsWithErr,
    GrammarAction,
    IAnyOrAlt,
    IParserConfig,
    IRuleConfig,
    ISerializedGast,
    IToken,
    ManySepMethodOpts,
    OrMethodOpts,
    SubruleMethodOpts,
    TokenType,
    TokenVocabulary
} from "../../../../api"
import {
    cloneArr,
    cloneObj,
    every,
    flatten,
    has,
    isArray,
    isEmpty,
    isObject,
    reduce,
    uniq,
    values
} from "../../../utils/utils"
import {
    AT_LEAST_ONE_IDX,
    AT_LEAST_ONE_SEP_IDX,
    BITS_FOR_METHOD_IDX,
    BITS_FOR_OCCURRENCE_IDX,
    MANY_IDX,
    MANY_SEP_IDX,
    OPTION_IDX,
    OR_IDX
} from "../../grammar/keys"
import {
    isRecognitionException,
    MismatchedTokenException,
    NotAllInputParsedException
} from "../../exceptions_public"
import { PROD_TYPE } from "../../grammar/lookahead"
import {
    AbstractNextTerminalAfterProductionWalker,
    NextTerminalAfterAtLeastOneSepWalker,
    NextTerminalAfterAtLeastOneWalker,
    NextTerminalAfterManySepWalker,
    NextTerminalAfterManyWalker
} from "../../grammar/interpreter"
import {
    DEFAULT_PARSER_CONFIG,
    DEFAULT_RULE_CONFIG,
    IParserState,
    TokenMatcher
} from "../parser"
import { IN_RULE_RECOVERY_EXCEPTION } from "./recoverable"
import { EOF, tokenName } from "../../../scan/tokens_public"
import { MixedInParser } from "./parser_traits"
import {
    augmentTokenTypes,
    isTokenType,
    tokenStructuredMatcher,
    tokenStructuredMatcherNoCategories
} from "../../../scan/tokens"
import { classNameFromInstance, HashTable } from "../../../lang/lang_extensions"
import { Rule } from "../../grammar/gast/gast_public"

/**
 * This trait is responsible for the runtime parsing engine
 * Used by the official API (recognizer_api.ts)
 */
export class RecognizerEngine {
    isBackTrackingStack
    className: string
    RULE_STACK: string[]
    RULE_OCCURRENCE_STACK: number[]
    definedRulesNames: string[]
    tokensMap: { [fqn: string]: TokenType }
    allRuleNames: string[]
    gastProductionsCache: HashTable<Rule>
    serializedGrammar: ISerializedGast[]
    shortRuleNameToFull: HashTable<string>
    fullRuleNameToShort: HashTable<number>
    // The shortName Index must be coded "after" the first 8bits to enable building unique lookahead keys
    ruleShortNameIdx: number
    tokenMatcher: TokenMatcher

    initRecognizerEngine(
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig
    ) {
        this.className = classNameFromInstance(this)
        // TODO: would using an ES6 Map or plain object be faster (CST building scenario)
        this.shortRuleNameToFull = new HashTable<string>()
        this.fullRuleNameToShort = new HashTable<number>()
        this.ruleShortNameIdx = 256
        this.tokenMatcher = tokenStructuredMatcherNoCategories

        this.definedRulesNames = []
        this.tokensMap = {}
        this.allRuleNames = []
        this.isBackTrackingStack = []
        this.RULE_STACK = []
        this.RULE_OCCURRENCE_STACK = []
        this.gastProductionsCache = new HashTable<Rule>()
        this.serializedGrammar = has(config, "serializedGrammar")
            ? config.serializedGrammar
            : DEFAULT_PARSER_CONFIG.serializedGrammar

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
                        "\tSee: https://sap.github.io/chevrotain/docs/changes/BREAKING_CHANGES.html#_4-0-0\n" +
                        "\tFor Further details."
                )
            }
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
                "<tokensDictionary> argument must be An Array of Token constructors," +
                    " A dictionary of Token constructors or an IMultiModeLexerDefinition"
            )
        }

        // always add EOF to the tokenNames -> constructors map. it is useful to assure all the input has been
        // parsed with a clear error message ("expecting EOF but found ...")
        /* tslint:disable */
        this.tokensMap["EOF"] = EOF

        // TODO: This check may not be accurate for multi mode lexers
        const noTokenCategoriesUsed = every(
            values(tokenVocabulary),
            tokenConstructor => isEmpty(tokenConstructor.categoryMatches)
        )

        this.tokenMatcher = noTokenCategoriesUsed
            ? tokenStructuredMatcherNoCategories
            : tokenStructuredMatcher

        // Because ES2015+ syntax should be supported for creating Token classes
        // We cannot assume that the Token classes were created using the "extendToken" utilities
        // Therefore we must augment the Token classes both on Lexer initialization and on Parser initialization
        augmentTokenTypes(values(this.tokensMap))
    }

    defineRule<T>(
        this: MixedInParser,
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

    // Implementation of parsing DSL
    optionInternal<OUT>(
        this: MixedInParser,
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

    optionInternalNoCst<OUT>(
        this: MixedInParser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number
    ): OUT {
        let key = this.getKeyForAutomaticLookahead(OPTION_IDX, occurrence)
        return this.optionInternalLogic(actionORMethodDef, occurrence, key)
    }

    optionInternalLogic<OUT>(
        this: MixedInParser,
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

    atLeastOneInternal<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
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
                laKey
            )
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    atLeastOneInternalNoCst<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        let key = this.getKeyForAutomaticLookahead(
            AT_LEAST_ONE_IDX,
            prodOccurrence
        )
        this.atLeastOneInternalLogic(prodOccurrence, actionORMethodDef, key)
    }

    atLeastOneInternalLogic<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>,
        key: number
    ): void {
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
            ;(<any>action).call(this)
            while ((<Function>lookAheadFunc).call(this) === true) {
                this.doSingleRepetition(action)
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
            [prodOccurrence, actionORMethodDef],
            <any>lookAheadFunc,
            AT_LEAST_ONE_IDX,
            prodOccurrence,
            NextTerminalAfterAtLeastOneWalker
        )
    }

    atLeastOneSepFirstInternal<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        let laKey = this.getKeyForAutomaticLookahead(
            AT_LEAST_ONE_SEP_IDX,
            prodOccurrence
        )
        let nestedName = this.nestedRuleBeforeClause(options, laKey)
        try {
            this.atLeastOneSepFirstInternalLogic(prodOccurrence, options, laKey)
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    atLeastOneSepFirstInternalNoCst<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        let laKey = this.getKeyForAutomaticLookahead(
            AT_LEAST_ONE_SEP_IDX,
            prodOccurrence
        )
        this.atLeastOneSepFirstInternalLogic(prodOccurrence, options, laKey)
    }

    atLeastOneSepFirstInternalLogic<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        options: AtLeastOneSepMethodOpts<OUT>,
        key: number
    ): void {
        let action = options.DEF
        let separator = options.SEP

        let firstIterationLookaheadFunc = this.getLookaheadFuncForAtLeastOneSep(
            key,
            prodOccurrence
        )

        // 1st iteration
        if (firstIterationLookaheadFunc.call(this) === true) {
            ;(<GrammarAction<OUT>>action).call(this)

            //  TODO: Optimization can move this function construction into "attemptInRepetitionRecovery"
            //  because it is only needed in error recovery scenarios.
            let separatorLookAheadFunc = () => {
                return this.tokenMatcher(this.LA(1), separator)
            }

            // 2nd..nth iterations
            while (this.tokenMatcher(this.LA(1), separator) === true) {
                // note that this CONSUME will never enter recovery because
                // the separatorLookAheadFunc checks that the separator really does exist.
                this.CONSUME(separator)
                // No need for checking infinite loop here due to consuming the separator.
                ;(<GrammarAction<OUT>>action).call(this)
            }

            // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
            this.attemptInRepetitionRecovery(
                this.repetitionSepSecondInternal,
                [
                    prodOccurrence,
                    separator,
                    separatorLookAheadFunc,
                    action,
                    NextTerminalAfterAtLeastOneSepWalker
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
    }

    manyInternal<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        let laKey = this.getKeyForAutomaticLookahead(MANY_IDX, prodOccurrence)
        let nestedName = this.nestedRuleBeforeClause(
            actionORMethodDef as DSLMethodOpts<OUT>,
            laKey
        )
        try {
            return this.manyInternalLogic(
                prodOccurrence,
                actionORMethodDef,
                laKey
            )
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    manyInternalNoCst<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        let laKey = this.getKeyForAutomaticLookahead(MANY_IDX, prodOccurrence)
        return this.manyInternalLogic(prodOccurrence, actionORMethodDef, laKey)
    }

    manyInternalLogic<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        key: number
    ) {
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
            this.doSingleRepetition(action)
        }

        // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
        this.attemptInRepetitionRecovery(
            this.manyInternal,
            [prodOccurrence, actionORMethodDef],
            <any>lookaheadFunction,
            MANY_IDX,
            prodOccurrence,
            NextTerminalAfterManyWalker
        )
    }

    manySepFirstInternal<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>
    ): void {
        let laKey = this.getKeyForAutomaticLookahead(
            MANY_SEP_IDX,
            prodOccurrence
        )
        let nestedName = this.nestedRuleBeforeClause(options, laKey)
        try {
            this.manySepFirstInternalLogic(prodOccurrence, options, laKey)
        } finally {
            if (nestedName !== undefined) {
                this.nestedRuleFinallyClause(laKey, nestedName)
            }
        }
    }

    manySepFirstInternalNoCst<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>
    ): void {
        let laKey = this.getKeyForAutomaticLookahead(
            MANY_SEP_IDX,
            prodOccurrence
        )
        this.manySepFirstInternalLogic(prodOccurrence, options, laKey)
    }

    manySepFirstInternalLogic<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        options: ManySepMethodOpts<OUT>,
        key: number
    ): void {
        let action = options.DEF
        let separator = options.SEP

        let firstIterationLaFunc = this.getLookaheadFuncForManySep(
            key,
            prodOccurrence
        )
        // 1st iteration
        if (firstIterationLaFunc.call(this) === true) {
            action.call(this)

            let separatorLookAheadFunc = () => {
                return this.tokenMatcher(this.LA(1), separator)
            }
            // 2nd..nth iterations
            while (this.tokenMatcher(this.LA(1), separator) === true) {
                // note that this CONSUME will never enter recovery because
                // the separatorLookAheadFunc checks that the separator really does exist.
                this.CONSUME(separator)
                // No need for checking infinite loop here due to consuming the separator.
                action.call(this)
            }

            // Performance optimization: "attemptInRepetitionRecovery" will be defined as NOOP unless recovery is enabled
            this.attemptInRepetitionRecovery(
                this.repetitionSepSecondInternal,
                [
                    prodOccurrence,
                    separator,
                    separatorLookAheadFunc,
                    action,
                    NextTerminalAfterManySepWalker
                ],
                separatorLookAheadFunc,
                MANY_SEP_IDX,
                prodOccurrence,
                NextTerminalAfterManySepWalker
            )
        }
    }

    repetitionSepSecondInternal<OUT>(
        this: MixedInParser,
        prodOccurrence: number,
        separator: TokenType,
        separatorLookAheadFunc: () => boolean,
        action: GrammarAction<OUT>,
        nextTerminalAfterWalker: typeof AbstractNextTerminalAfterProductionWalker
    ): void {
        while (separatorLookAheadFunc()) {
            // note that this CONSUME will never enter recovery because
            // the separatorLookAheadFunc checks that the separator really does exist.
            this.CONSUME(separator)
            action.call(this)
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
                nextTerminalAfterWalker
            ],
            separatorLookAheadFunc,
            AT_LEAST_ONE_SEP_IDX,
            prodOccurrence,
            nextTerminalAfterWalker
        )
    }

    doSingleRepetition(this: MixedInParser, action: Function): any {
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

    orInternalNoCst<T>(
        this: MixedInParser,
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

    orInternal<T>(
        this: MixedInParser,
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

    ruleFinallyStateUpdate(this: MixedInParser): void {
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

    subruleInternal<T>(
        this: MixedInParser,
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

    consumeInternal(
        this: MixedInParser,
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

    saveRecogState(this: MixedInParser): IParserState {
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

    reloadRecogState(this: MixedInParser, newState: IParserState) {
        this.errors = newState.errors
        this.importLexerState(newState.lexerState)
        this.RULE_STACK = newState.RULE_STACK
    }

    ruleInvocationStateUpdate(
        this: MixedInParser,
        shortName: string,
        fullName: string,
        idxInCallingRule: number
    ): void {
        this.RULE_OCCURRENCE_STACK.push(idxInCallingRule)
        this.RULE_STACK.push(shortName)
        // NOOP when cst is disabled
        this.cstInvocationStateUpdate(fullName, shortName)
    }

    isBackTracking(this: MixedInParser): boolean {
        return !isEmpty(this.isBackTrackingStack)
    }

    getCurrRuleFullName(this: MixedInParser): string {
        let shortName = this.getLastExplicitRuleShortName()
        return this.shortRuleNameToFull.get(shortName)
    }

    shortRuleNameToFullName(this: MixedInParser, shortName: string) {
        return this.shortRuleNameToFull.get(shortName)
    }

    public isAtEndOfInput(this: MixedInParser): boolean {
        return this.tokenMatcher(this.LA(1), EOF)
    }

    public reset(this: MixedInParser): void {
        this.resetLexerState()

        this.isBackTrackingStack = []
        this.errors = []
        this.RULE_STACK = []
        this.LAST_EXPLICIT_RULE_STACK = []
        // TODO: extract a specific rest for TreeBuilder trait
        this.CST_STACK = []
        this.RULE_OCCURRENCE_STACK = []
    }
}
