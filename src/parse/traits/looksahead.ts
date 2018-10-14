import {
    buildAlternativesLookAheadFunc,
    buildLookaheadFuncForOptionalProd,
    buildLookaheadFuncForOr,
    buildSingleAlternativeLookaheadFunction,
    PROD_TYPE
} from "../grammar/lookahead"
import { has, isES2015MapSupported, isFunction, some } from "../../utils/utils"
import {
    DEFAULT_PARSER_CONFIG,
    lookAheadSequence,
    TokenMatcher
} from "../parser_public"
import { IAnyOrAlt, IOrAltWithGate, IParserConfig } from "../../../api"
import { getKeyForAutomaticLookahead, OR_IDX } from "../grammar/keys"
import { MixedInParser } from "./parser_traits"

/**
 * Trait responsible for the lookahead related utilities and optimizations.
 */
export class LooksAhead {
    maxLookahead: number
    lookAheadFuncsCache: any
    dynamicTokensEnabled: boolean

    initLooksAhead(config: IParserConfig) {
        this.dynamicTokensEnabled = has(config, "dynamicTokensEnabled")
            ? config.dynamicTokensEnabled
            : DEFAULT_PARSER_CONFIG.dynamicTokensEnabled

        this.maxLookahead = has(config, "maxLookahead")
            ? config.maxLookahead
            : DEFAULT_PARSER_CONFIG.maxLookahead

        /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
        this.lookAheadFuncsCache = isES2015MapSupported() ? new Map() : []

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
    }

    lookAheadBuilderForOptional(
        this: MixedInParser,
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

    lookAheadBuilderForAlternatives(
        this: MixedInParser,
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

    // this actually returns a number, but it is always used as a string (object prop key)
    getKeyForAutomaticLookahead(
        this: MixedInParser,
        dslMethodIdx: number,
        occurrence: number
    ): number {
        let currRuleShortName: any = this.getLastExplicitRuleShortName()
        return getKeyForAutomaticLookahead(
            currRuleShortName,
            dslMethodIdx,
            occurrence
        )
    }

    getLookaheadFuncForOr(
        this: MixedInParser,
        occurrence: number,
        alts: IAnyOrAlt<any>[]
    ): () => number {
        let key = this.getKeyForAutomaticLookahead(OR_IDX, occurrence)
        let laFunc: any = this.getLaFuncFromCache(key)
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
            this.setLaFuncCache(key, laFunc)
            return laFunc
        } else {
            return laFunc
        }
    }

    // Automatic lookahead calculation
    getLookaheadFuncForOption(
        this: MixedInParser,
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

    getLookaheadFuncForMany(
        this: MixedInParser,
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

    getLookaheadFuncForManySep(
        this: MixedInParser,
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

    getLookaheadFuncForAtLeastOne(
        this: MixedInParser,
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

    getLookaheadFuncForAtLeastOneSep(
        this: MixedInParser,
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

    getLookaheadFuncFor(
        this: MixedInParser,
        key: number,
        occurrence: number,
        maxLookahead: number,
        prodType
    ): () => boolean {
        let laFunc = <any>this.getLaFuncFromCache(key)
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
            this.setLaFuncCache(key, laFunc)
            return laFunc
        } else {
            return laFunc
        }
    }

    /* istanbul ignore next */
    getLaFuncFromCache(this: MixedInParser, key: number): Function {
        return undefined
    }

    getLaFuncFromMap(this: MixedInParser, key: number): Function {
        return this.lookAheadFuncsCache.get(key)
    }

    /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
    getLaFuncFromObj(this: MixedInParser, key: number): Function {
        return this.lookAheadFuncsCache[key]
    }

    /* istanbul ignore next */
    setLaFuncCache(this: MixedInParser, key: number, value: Function): void {}

    setLaFuncCacheUsingMap(
        this: MixedInParser,
        key: number,
        value: Function
    ): void {
        this.lookAheadFuncsCache.set(key, value)
    }

    /* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
    setLaFuncUsingObj(this: MixedInParser, key: number, value: Function): void {
        this.lookAheadFuncsCache[key] = value
    }
}
