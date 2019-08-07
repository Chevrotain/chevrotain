import { MixedInParser } from "../traits/parser_traits"
import {
    TokenType,
    ConsumeMethodOpts,
    IToken,
    SubruleMethodOpts,
    IRuleConfig
} from "../../../../api"
import { RecognizerApi } from "../traits/recognizer_api"
import { contains } from "../../../utils/utils"
import { defaultGrammarValidatorErrorProvider } from "../../errors_public"
import { ParserDefinitionErrorType, DEFAULT_RULE_CONFIG } from "../parser"
import { PROP_ANALYSER_CONTEXT, IRuleDefinitionInfo } from "./rule-analyser"
import { SmartParser } from "./smart_parser"
import { validateRuleIsOverridden } from "../../grammar/checks"
import { SmartMixedInParser } from "./traits"

export class SmartRecognizerApi extends RecognizerApi {
    smartRecognizeRuleDefInfo<T>(
        ruleName: string,
        implementation: (...implArgs: any[]) => T,
        config: IRuleConfig<T> = DEFAULT_RULE_CONFIG
    ) {
        const context = this[PROP_ANALYSER_CONTEXT]

        const info: IRuleDefinitionInfo<T> = {
            config,
            implementation,
            ruleName
        }

        context.rules[ruleName] = info

        return info
    }

    RULE<T>(
        this: SmartMixedInParser,
        name: string,
        implementation: (...implArgs: any[]) => T,
        config: IRuleConfig<T> = DEFAULT_RULE_CONFIG
    ): any {
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

        return this.smartRecognizeRuleDefInfo(name, implementation, config)
    }

    OVERRIDE_RULE<T>(
        this: SmartMixedInParser,
        name: string,
        impl: (...implArgs: any[]) => T,
        config: IRuleConfig<T> = DEFAULT_RULE_CONFIG
    ): any {
        let ruleErrors = []
        ruleErrors = ruleErrors.concat(
            validateRuleIsOverridden(
                name,
                this.definedRulesNames,
                this.className
            )
        )
        this.definitionErrors.push.apply(this.definitionErrors, ruleErrors) // mutability for the win

        return this.smartRecognizeRuleDefInfo(name, impl, config)
    }

    BACKTRACK<T>(
        this: MixedInParser,
        grammarRule: (...args: any[]) => T,
        args?: any[]
    ): () => boolean {
        throw new Error("not impl")
        // return function() {
        //     // save org state
        //     this.isBackTrackingStack.push(1)
        //     const orgState = this.saveRecogState()
        //     try {
        //         grammarRule.apply(this, args)
        //         // if no exception was thrown we have succeed parsing the rule.
        //         return true
        //     } catch (e) {
        //         if (isRecognitionException(e)) {
        //             return false
        //         } else {
        //             throw e
        //         }
        //     } finally {
        //         this.reloadRecogState(orgState)
        //         this.isBackTrackingStack.pop()
        //     }
        // }
    }
}
