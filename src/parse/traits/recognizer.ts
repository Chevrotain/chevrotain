import {
    AtLeastOneSepMethodOpts,
    ConsumeMethodOpts,
    DSLMethodOpts,
    DSLMethodOptsWithErr,
    GrammarAction,
    IAnyOrAlt,
    IRuleConfig,
    IToken,
    ManySepMethodOpts,
    OrMethodOpts,
    SubruleMethodOpts,
    TokenType
} from "../../../api"
import { cloneArr, contains, has, isArray, isEmpty } from "../../utils/utils"
import {
    AT_LEAST_ONE_IDX,
    AT_LEAST_ONE_SEP_IDX,
    BITS_FOR_METHOD_IDX,
    BITS_FOR_OCCURRENCE_IDX,
    MANY_IDX,
    MANY_SEP_IDX,
    OPTION_IDX,
    OR_IDX
} from "../grammar/keys"
import {
    isRecognitionException,
    MismatchedTokenException,
    NotAllInputParsedException
} from "../exceptions_public"
import { PROD_TYPE } from "../grammar/lookahead"
import {
    AbstractNextTerminalAfterProductionWalker,
    NextTerminalAfterAtLeastOneSepWalker,
    NextTerminalAfterAtLeastOneWalker,
    NextTerminalAfterManySepWalker,
    NextTerminalAfterManyWalker
} from "../grammar/interpreter"
import {
    DEFAULT_RULE_CONFIG,
    IParserState,
    Parser,
    ParserDefinitionErrorType
} from "../parser_public"
import { IN_RULE_RECOVERY_EXCEPTION } from "./recoverable"
import { defaultGrammarValidatorErrorProvider } from "../errors_public"
import { buildTopProduction } from "../gast_builder"
import { validateRuleIsOverridden } from "../grammar/checks"
import { EOF } from "../../scan/tokens_public"

export class RecognizerApi {
    CONSUME(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 0, options)
    }

    CONSUME1(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 1, options)
    }

    CONSUME2(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 2, options)
    }

    CONSUME3(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 3, options)
    }

    CONSUME4(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 4, options)
    }

    CONSUME5(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 5, options)
    }

    CONSUME6(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 6, options)
    }

    CONSUME7(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 7, options)
    }

    CONSUME8(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 8, options)
    }

    CONSUME9(
        this: Parser,
        tokType: TokenType,
        options?: ConsumeMethodOpts
    ): IToken {
        return this.consumeInternal(tokType, 9, options)
    }

    SUBRULE<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 0, options)
    }

    SUBRULE1<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 1, options)
    }

    SUBRULE2<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 2, options)
    }

    SUBRULE3<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 3, options)
    }

    SUBRULE4<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 4, options)
    }

    SUBRULE5<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 5, options)
    }

    SUBRULE6<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 6, options)
    }

    SUBRULE7<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 7, options)
    }

    SUBRULE8<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 8, options)
    }

    SUBRULE9<T>(
        this: Parser,
        ruleToCall: (idx: number) => T,
        options?: SubruleMethodOpts
    ): T {
        return this.subruleInternal(ruleToCall, 9, options)
    }

    OPTION<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 0)
    }

    OPTION1<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 1)
    }

    OPTION2<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 2)
    }

    OPTION3<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 3)
    }

    OPTION4<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 4)
    }

    OPTION5<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 5)
    }

    OPTION6<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 6)
    }

    OPTION7<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 7)
    }

    OPTION8<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 8)
    }

    OPTION9<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): OUT {
        return this.optionInternal(actionORMethodDef, 9)
    }

    OR<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 0)
    }

    OR1<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 1)
    }

    OR2<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 2)
    }

    OR3<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 3)
    }

    OR4<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 4)
    }

    OR5<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 5)
    }

    OR6<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 6)
    }

    OR7<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 7)
    }

    OR8<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 8)
    }

    OR9<T>(this: Parser, altsOrOpts: IAnyOrAlt<T>[] | OrMethodOpts<T>): T {
        return this.orInternal(altsOrOpts, 9)
    }

    MANY<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(0, actionORMethodDef)
    }

    MANY1<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(1, actionORMethodDef)
    }

    MANY2<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(2, actionORMethodDef)
    }

    MANY3<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(3, actionORMethodDef)
    }

    MANY4<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(4, actionORMethodDef)
    }

    MANY5<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(5, actionORMethodDef)
    }

    MANY6<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(6, actionORMethodDef)
    }

    MANY7<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(7, actionORMethodDef)
    }

    MANY8<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(8, actionORMethodDef)
    }

    MANY9<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        this.manyInternal(9, actionORMethodDef)
    }

    MANY_SEP<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(0, options)
    }

    MANY_SEP1<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(1, options)
    }

    MANY_SEP2<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(2, options)
    }

    MANY_SEP3<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(3, options)
    }

    MANY_SEP4<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(4, options)
    }

    MANY_SEP5<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(5, options)
    }

    MANY_SEP6<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(6, options)
    }

    MANY_SEP7<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(7, options)
    }

    MANY_SEP8<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(8, options)
    }

    MANY_SEP9<OUT>(this: Parser, options: ManySepMethodOpts<OUT>): void {
        this.manySepFirstInternal(9, options)
    }

    AT_LEAST_ONE<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(0, actionORMethodDef)
    }

    AT_LEAST_ONE1<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        return this.atLeastOneInternal(1, actionORMethodDef)
    }

    AT_LEAST_ONE2<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(2, actionORMethodDef)
    }

    AT_LEAST_ONE3<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(3, actionORMethodDef)
    }

    AT_LEAST_ONE4<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(4, actionORMethodDef)
    }

    AT_LEAST_ONE5<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(5, actionORMethodDef)
    }

    AT_LEAST_ONE6<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(6, actionORMethodDef)
    }

    AT_LEAST_ONE7<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(7, actionORMethodDef)
    }

    AT_LEAST_ONE8<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(8, actionORMethodDef)
    }

    AT_LEAST_ONE9<OUT>(
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOptsWithErr<OUT>
    ): void {
        this.atLeastOneInternal(9, actionORMethodDef)
    }

    AT_LEAST_ONE_SEP<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(0, options)
    }

    AT_LEAST_ONE_SEP1<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(1, options)
    }

    AT_LEAST_ONE_SEP2<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(2, options)
    }

    AT_LEAST_ONE_SEP3<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(3, options)
    }

    AT_LEAST_ONE_SEP4<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(4, options)
    }

    AT_LEAST_ONE_SEP5<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(5, options)
    }

    AT_LEAST_ONE_SEP6<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(6, options)
    }

    AT_LEAST_ONE_SEP7<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(7, options)
    }

    AT_LEAST_ONE_SEP8<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(8, options)
    }

    AT_LEAST_ONE_SEP9<OUT>(
        this: Parser,
        options: AtLeastOneSepMethodOpts<OUT>
    ): void {
        this.atLeastOneSepFirstInternal(9, options)
    }

    RULE<T>(
        this: Parser,
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

    OVERRIDE_RULE<T>(
        this: Parser,
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

    BACKTRACK<T>(
        this: Parser,
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
}

export class RecognizerEngine {
    defineRule<T>(
        this: Parser,
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
        this: Parser,
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
        this: Parser,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>,
        occurrence: number
    ): OUT {
        let key = this.getKeyForAutomaticLookahead(OPTION_IDX, occurrence)
        return this.optionInternalLogic(actionORMethodDef, occurrence, key)
    }

    optionInternalLogic<OUT>(
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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
        this: Parser,
        prodOccurrence: number,
        actionORMethodDef: GrammarAction<OUT> | DSLMethodOpts<OUT>
    ): void {
        let laKey = this.getKeyForAutomaticLookahead(MANY_IDX, prodOccurrence)
        return this.manyInternalLogic(prodOccurrence, actionORMethodDef, laKey)
    }

    manyInternalLogic<OUT>(
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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
        this: Parser,
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

    doSingleRepetition(this: Parser, action: Function): any {
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
        this: Parser,
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
        this: Parser,
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

    ruleFinallyStateUpdate(this: Parser): void {
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
        this: Parser,
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
        this: Parser,
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

    saveRecogState(this: Parser): IParserState {
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

    reloadRecogState(this: Parser, newState: IParserState) {
        this.errors = newState.errors
        this.importLexerState(newState.lexerState)
        this.RULE_STACK = newState.RULE_STACK
    }

    ruleInvocationStateUpdate(
        this: Parser,
        shortName: string,
        fullName: string,
        idxInCallingRule: number
    ): void {
        this.RULE_OCCURRENCE_STACK.push(idxInCallingRule)
        this.RULE_STACK.push(shortName)
        // NOOP when cst is disabled
        this.cstInvocationStateUpdate(fullName, shortName)
    }

    isBackTracking(this: Parser): boolean {
        return !isEmpty(this.isBackTrackingStack)
    }

    getCurrRuleFullName(this: Parser): string {
        let shortName = this.getLastExplicitRuleShortName()
        return this.shortRuleNameToFull.get(shortName)
    }

    shortRuleNameToFullName(this: Parser, shortName: string) {
        return this.shortRuleNameToFull.get(shortName)
    }

    public isAtEndOfInput(this: Parser): boolean {
        return this.tokenMatcher(this.LA(1), EOF)
    }

    public reset(this: Parser): void {
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
