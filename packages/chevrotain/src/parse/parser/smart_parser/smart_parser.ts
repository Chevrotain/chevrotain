import {
    IRuleConfig,
    IProduction,
    TokenVocabulary,
    IParserConfig
} from "../../../../api"
import { Parser, DEFAULT_PARSER_CONFIG } from "../parser"
import {
    PROP_ANALYSER_CONTEXT,
    ParserRuleAnalyserContext
} from "./rule-analyser"
import { MixedInParser } from "../traits/parser_traits"
import { keys, applyMixins, cloneObj } from "../../../utils/utils"
import { Rule } from "../../grammar/gast/gast_public"
import { SmartRecognizerEngine } from "./smart_recognizer_engine"
import { SmartRecognizerApi } from "./smart_recognizer_api"

export class SmartParser extends Parser {
    protected [PROP_ANALYSER_CONTEXT] = new ParserRuleAnalyserContext()

    public performSelfAnalysis(this: MixedInParser & SmartParser): void {
        if (this[PROP_ANALYSER_CONTEXT]) {
            // TODO: record
            const analyserContext = this[PROP_ANALYSER_CONTEXT]
            const ruleMap = analyserContext.rules
            const rules = keys(ruleMap).map(k => ruleMap[k])

            rules.forEach(({ implementation, ruleName }) => {
                if (
                    !this.gastProductionsCache.containsKey(ruleName) &&
                    !this.serializedGrammar
                ) {
                    const gastProduction = new Rule({
                        name: ruleName,
                        definition: analyserContext.recordDefinitions(
                            implementation
                        )
                    })
                    this.gastProductionsCache.put(ruleName, gastProduction)
                }
            })

            rules.forEach(({ ruleName, implementation, config }) => {
                const ruleImplementation = this.defineRule(
                    ruleName,
                    implementation,
                    config
                )
                this[ruleName] = ruleImplementation
            })

            delete this[PROP_ANALYSER_CONTEXT]
        }

        // analyse already finished
        ;(super.performSelfAnalysis as any)()
    }
}

applyMixins(SmartParser, [SmartRecognizerEngine, SmartRecognizerApi])

export class SmartCstParser extends SmartParser {
    constructor(
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig = DEFAULT_PARSER_CONFIG
    ) {
        const configClone = cloneObj(config)
        configClone.outputCst = true
        super(tokenVocabulary, configClone)
    }
}

export class SmartEmbeddedActionsParser extends SmartParser {
    constructor(
        tokenVocabulary: TokenVocabulary,
        config: IParserConfig = DEFAULT_PARSER_CONFIG
    ) {
        const configClone = cloneObj(config)
        configClone.outputCst = false
        super(tokenVocabulary, configClone)
    }
}
