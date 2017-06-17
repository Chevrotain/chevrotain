import {
    map,
    reduce,
    find,
    every,
    isEmpty,
    flatten,
    forEach,
    has
} from "../../utils/utils"
import { gast } from "./gast_public"
import { possiblePathsFrom } from "./interpreter"
import { RestWalker } from "./rest"
import {
    Predicate,
    IAnyOrAlt,
    TokenMatcher,
    TokenInstanceIdentityFunc,
    TokenClassIdentityFunc
} from "../parser_public"
import { TokenConstructor } from "../../scan/lexer_public"

export enum PROD_TYPE {
    OPTION,
    REPETITION,
    REPETITION_MANDATORY,
    REPETITION_MANDATORY_WITH_SEPARATOR,
    REPETITION_WITH_SEPARATOR,
    ALTERNATION
}

export function getProdType(prod: gast.IProduction): PROD_TYPE {
    if (prod instanceof gast.Option) {
        return PROD_TYPE.OPTION
    } else if (prod instanceof gast.Repetition) {
        return PROD_TYPE.REPETITION
    } else if (prod instanceof gast.RepetitionMandatory) {
        return PROD_TYPE.REPETITION_MANDATORY
    } else if (prod instanceof gast.RepetitionMandatoryWithSeparator) {
        return PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR
    } else if (prod instanceof gast.RepetitionWithSeparator) {
        return PROD_TYPE.REPETITION_WITH_SEPARATOR
    } else if (prod instanceof gast.Alternation) {
        return PROD_TYPE.ALTERNATION
    } else {
        throw Error("non exhaustive match")
    }
}

export function buildLookaheadFuncForOr(
    occurrence: number,
    ruleGrammar: gast.Rule,
    k: number,
    hasPredicates: boolean,
    tokenMatcher: TokenMatcher,
    tokenClassIdentityFunc: TokenClassIdentityFunc,
    tokenIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): (orAlts?: IAnyOrAlt<any>[]) => number {
    let lookAheadPaths = getLookaheadPathsForOr(occurrence, ruleGrammar, k)
    return buildAlternativesLookAheadFunc(
        lookAheadPaths,
        hasPredicates,
        tokenMatcher,
        tokenClassIdentityFunc,
        tokenIdentityFunc,
        dynamicTokensEnabled
    )
}

/**
 *  When dealing with an Optional production (OPTION/MANY/2nd iteration of AT_LEAST_ONE/...) we need to compare
 *  the lookahead "inside" the production and the lookahead immediately "after" it in the same top level rule (context free).
 *
 *  Example: given a production:
 *  ABC(DE)?DF
 *
 *  The optional '(DE)?' should only be entered if we see 'DE'. a single Token 'D' is not sufficient to distinguish between the two
 *  alternatives.
 *
 *  @returns A Lookahead function which will return true IFF the parser should parse the Optional production.
 */
export function buildLookaheadFuncForOptionalProd(
    occurrence: number,
    ruleGrammar: gast.Rule,
    prodType: PROD_TYPE,
    k: number,
    tokenMatcher: TokenMatcher,
    tokenClassIdentityFunc: TokenClassIdentityFunc,
    tokenInstanceIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): () => boolean {
    let lookAheadPaths = getLookaheadPathsForOptionalProd(
        occurrence,
        ruleGrammar,
        prodType,
        k
    )
    return buildSingleAlternativeLookaheadFunction(
        lookAheadPaths[0],
        tokenMatcher,
        tokenClassIdentityFunc,
        tokenInstanceIdentityFunc,
        dynamicTokensEnabled
    )
}

export function buildLookaheadForOption(
    optionOccurrence: number,
    ruleGrammar: gast.Rule,
    k: number,
    tokenMatcher: TokenMatcher,
    tokenClassIdentityFunc: TokenClassIdentityFunc,
    tokenInstanceIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): () => boolean {
    return buildLookaheadFuncForOptionalProd(
        optionOccurrence,
        ruleGrammar,
        PROD_TYPE.OPTION,
        k,
        tokenMatcher,
        tokenClassIdentityFunc,
        tokenInstanceIdentityFunc,
        dynamicTokensEnabled
    )
}

export function buildLookaheadForMany(
    optionOccurrence: number,
    ruleGrammar: gast.Rule,
    k: number,
    tokenMatcher: TokenMatcher,
    tokenClassIdentityFunc: TokenClassIdentityFunc,
    tokenInstanceIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): () => boolean {
    return buildLookaheadFuncForOptionalProd(
        optionOccurrence,
        ruleGrammar,
        PROD_TYPE.REPETITION,
        k,
        tokenMatcher,
        tokenClassIdentityFunc,
        tokenInstanceIdentityFunc,
        dynamicTokensEnabled
    )
}

export function buildLookaheadForManySep(
    optionOccurrence: number,
    ruleGrammar: gast.Rule,
    k: number,
    tokenMatcher: TokenMatcher,
    tokenClassIdentityFunc: TokenClassIdentityFunc,
    tokenInstanceIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): () => boolean {
    return buildLookaheadFuncForOptionalProd(
        optionOccurrence,
        ruleGrammar,
        PROD_TYPE.REPETITION_WITH_SEPARATOR,
        k,
        tokenMatcher,
        tokenClassIdentityFunc,
        tokenInstanceIdentityFunc,
        dynamicTokensEnabled
    )
}

export function buildLookaheadForAtLeastOne(
    optionOccurrence: number,
    ruleGrammar: gast.Rule,
    k: number,
    tokenMatcher: TokenMatcher,
    tokenIdentityFunc: TokenClassIdentityFunc,
    tokenInstanceIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): () => boolean {
    return buildLookaheadFuncForOptionalProd(
        optionOccurrence,
        ruleGrammar,
        PROD_TYPE.REPETITION_MANDATORY,
        k,
        tokenMatcher,
        tokenIdentityFunc,
        tokenInstanceIdentityFunc,
        dynamicTokensEnabled
    )
}

export function buildLookaheadForAtLeastOneSep(
    optionOccurrence: number,
    ruleGrammar: gast.Rule,
    k: number,
    tokenMatcher: TokenMatcher,
    tokenClassIdentityFunc: TokenClassIdentityFunc,
    tokenInstanceIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): () => boolean {
    return buildLookaheadFuncForOptionalProd(
        optionOccurrence,
        ruleGrammar,
        PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
        k,
        tokenMatcher,
        tokenClassIdentityFunc,
        tokenInstanceIdentityFunc,
        dynamicTokensEnabled
    )
}

export type Alternative = TokenConstructor[][]
export type lookAheadSequence = TokenConstructor[][]

export function buildAlternativesLookAheadFunc(
    alts: lookAheadSequence[],
    hasPredicates: boolean,
    tokenMatcher: TokenMatcher,
    tokenClassIdentityFunc: TokenClassIdentityFunc,
    tokenInstanceIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): (orAlts?: IAnyOrAlt<any>[]) => number {
    let numOfAlts = alts.length
    let areAllOneTokenLookahead = every(alts, currAlt => {
        return every(currAlt, currPath => {
            return currPath.length === 1
        })
    })

    // This version takes into account the predicates as well.
    if (hasPredicates) {
        /**
         * @returns {number} - The chosen alternative index
         */
        return function(orAlts: IAnyOrAlt<any>[]): number {
            // unfortunately the predicates must be extracted every single time
            // as they cannot be cached due to keep references to parameters(vars) which are no longer valid.
            // note that in the common case of no predicates, no cpu time will be wasted on this (see else block)
            let predicates: Predicate[] = map(orAlts, currAlt => currAlt.GATE)

            for (let t = 0; t < numOfAlts; t++) {
                let currAlt = alts[t]
                let currNumOfPaths = currAlt.length

                let currPredicate = predicates[t]
                if (currPredicate && !currPredicate.call(this)) {
                    // if the predicate does not match there is no point in checking the paths
                    continue
                }
                nextPath: for (let j = 0; j < currNumOfPaths; j++) {
                    let currPath = currAlt[j]
                    let currPathLength = currPath.length
                    for (let i = 0; i < currPathLength; i++) {
                        let nextToken = this.LA(i + 1)
                        if (!tokenMatcher(nextToken, currPath[i])) {
                            // mismatch in current path
                            // try the next pth
                            continue nextPath
                        }
                    }
                    // found a full path that matches.
                    // this will also work for an empty ALT as the loop will be skipped
                    return t
                }
                // none of the paths for the current alternative matched
                // try the next alternative
            }
            // none of the alternatives could be matched
            return undefined
        }
    } else if (areAllOneTokenLookahead && !dynamicTokensEnabled) {
        // optimized (common) case of all the lookaheads paths requiring only
        // a single token lookahead. These Optimizations cannot work if dynamically defined Tokens are used.
        let singleTokenAlts = map(alts, currAlt => {
            return flatten(currAlt)
        })

        let choiceToAlt = reduce(
            singleTokenAlts,
            (result, currAlt, idx) => {
                forEach(currAlt, currTokClass => {
                    if (!has(result, tokenClassIdentityFunc(currTokClass))) {
                        result[tokenClassIdentityFunc(currTokClass)] = idx
                    }
                    forEach(
                        currTokClass.extendingTokenTypes,
                        currExtendingType => {
                            if (!has(result, currExtendingType)) {
                                result[currExtendingType] = idx
                            }
                        }
                    )
                })
                return result
            },
            {}
        )

        /**
         * @returns {number} - The chosen alternative index
         */
        return function(): number {
            let nextToken = this.LA(1)
            return choiceToAlt[tokenInstanceIdentityFunc(nextToken)]
        }
    } else {
        // optimized lookahead without needing to check the predicates at all.
        // this causes code duplication which is intentional to improve performance.
        /**
         * @returns {number} - The chosen alternative index
         */
        return function(): number {
            for (let t = 0; t < numOfAlts; t++) {
                let currAlt = alts[t]
                let currNumOfPaths = currAlt.length
                nextPath: for (let j = 0; j < currNumOfPaths; j++) {
                    let currPath = currAlt[j]
                    let currPathLength = currPath.length
                    for (let i = 0; i < currPathLength; i++) {
                        let nextToken = this.LA(i + 1)
                        if (!tokenMatcher(nextToken, currPath[i])) {
                            // mismatch in current path
                            // try the next pth
                            continue nextPath
                        }
                    }
                    // found a full path that matches.
                    // this will also work for an empty ALT as the loop will be skipped
                    return t
                }
                // none of the paths for the current alternative matched
                // try the next alternative
            }
            // none of the alternatives could be matched
            return undefined
        }
    }
}

export function buildSingleAlternativeLookaheadFunction(
    alt: lookAheadSequence,
    tokenMatcher: TokenMatcher,
    tokenClassIdentityFunc: TokenClassIdentityFunc,
    tokenInstanceIdentityFunc: TokenInstanceIdentityFunc,
    dynamicTokensEnabled: boolean
): () => boolean {
    let areAllOneTokenLookahead = every(alt, currPath => {
        return currPath.length === 1
    })

    let numOfPaths = alt.length

    // optimized (common) case of all the lookaheads paths requiring only
    // a single token lookahead.
    if (areAllOneTokenLookahead && !dynamicTokensEnabled) {
        let singleTokensClasses = flatten(alt)

        if (
            singleTokensClasses.length === 1 &&
            isEmpty((<any>singleTokensClasses[0]).extendingTokenTypes)
        ) {
            let expectedTokenType = singleTokensClasses[0]
            let expectedTokenUniqueKey = tokenClassIdentityFunc(
                <any>expectedTokenType
            )
            return function(): boolean {
                return (
                    tokenInstanceIdentityFunc(this.LA(1)) ===
                    expectedTokenUniqueKey
                )
            }
        } else {
            let choiceToAlt = reduce(
                singleTokensClasses,
                (result, currTokClass, idx) => {
                    result[tokenClassIdentityFunc(currTokClass)] = true
                    forEach(
                        currTokClass.extendingTokenTypes,
                        currExtendingType => {
                            result[currExtendingType] = true
                        }
                    )
                    return result
                },
                {}
            )
            return function(): boolean {
                let nextToken = this.LA(1)
                return choiceToAlt[tokenInstanceIdentityFunc(nextToken)] ===
                    true
                    ? true
                    : false
            }
        }
    } else {
        return function(): boolean {
            nextPath: for (let j = 0; j < numOfPaths; j++) {
                let currPath = alt[j]
                let currPathLength = currPath.length
                for (let i = 0; i < currPathLength; i++) {
                    let nextToken = this.LA(i + 1)
                    if (!tokenMatcher(nextToken, currPath[i])) {
                        // mismatch in current path
                        // try the next pth
                        continue nextPath
                    }
                }
                // found a full path that matches.
                return true
            }

            // none of the paths matched
            return false
        }
    }
}

class RestDefinitionFinderWalker extends RestWalker {
    private restDef: gast.IProduction[]

    constructor(
        private topProd: gast.Rule,
        private targetOccurrence: number,
        private targetProdType: PROD_TYPE
    ) {
        super()
    }

    startWalking(): gast.IProduction[] {
        this.walk(this.topProd)
        return this.restDef
    }

    private checkIsTarget(
        node: gast.AbstractProduction & gast.IProductionWithOccurrence,
        expectedProdType: PROD_TYPE,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): boolean {
        if (
            node.occurrenceInParent === this.targetOccurrence &&
            this.targetProdType === expectedProdType
        ) {
            this.restDef = currRest.concat(prevRest)
            return true
        }
        // performance optimization, do not iterate over the entire Grammar ast after we have found the target
        return false
    }

    walkOption(
        optionProd: gast.Option,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (
            !this.checkIsTarget(
                optionProd,
                PROD_TYPE.OPTION,
                currRest,
                prevRest
            )
        ) {
            super.walkOption(optionProd, currRest, prevRest)
        }
    }

    walkAtLeastOne(
        atLeastOneProd: gast.RepetitionMandatory,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (
            !this.checkIsTarget(
                atLeastOneProd,
                PROD_TYPE.REPETITION_MANDATORY,
                currRest,
                prevRest
            )
        ) {
            super.walkOption(atLeastOneProd, currRest, prevRest)
        }
    }

    walkAtLeastOneSep(
        atLeastOneSepProd: gast.RepetitionMandatoryWithSeparator,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (
            !this.checkIsTarget(
                atLeastOneSepProd,
                PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
                currRest,
                prevRest
            )
        ) {
            super.walkOption(atLeastOneSepProd, currRest, prevRest)
        }
    }

    walkMany(
        manyProd: gast.Repetition,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (
            !this.checkIsTarget(
                manyProd,
                PROD_TYPE.REPETITION,
                currRest,
                prevRest
            )
        ) {
            super.walkOption(manyProd, currRest, prevRest)
        }
    }

    walkManySep(
        manySepProd: gast.RepetitionWithSeparator,
        currRest: gast.IProduction[],
        prevRest: gast.IProduction[]
    ): void {
        if (
            !this.checkIsTarget(
                manySepProd,
                PROD_TYPE.REPETITION_WITH_SEPARATOR,
                currRest,
                prevRest
            )
        ) {
            super.walkOption(manySepProd, currRest, prevRest)
        }
    }
}

/**
 * Returns the definition of a target production in a top level level rule.
 */
class InsideDefinitionFinderVisitor extends gast.GAstVisitor {
    public result: gast.IProduction[] = []

    constructor(
        private targetOccurrence: number,
        private targetProdType: PROD_TYPE
    ) {
        super()
    }

    private checkIsTarget(
        node: gast.AbstractProduction & gast.IProductionWithOccurrence,
        expectedProdName: PROD_TYPE
    ): void {
        if (
            node.occurrenceInParent === this.targetOccurrence &&
            this.targetProdType === expectedProdName
        ) {
            this.result = node.definition
        }
    }

    public visitOption(node: gast.Option): void {
        this.checkIsTarget(node, PROD_TYPE.OPTION)
    }

    public visitRepetition(node: gast.Repetition): void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION)
    }

    public visitRepetitionMandatory(node: gast.RepetitionMandatory): void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY)
    }

    public visitRepetitionMandatoryWithSeparator(
        node: gast.RepetitionMandatoryWithSeparator
    ): void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR)
    }

    public visitRepetitionWithSeparator(
        node: gast.RepetitionWithSeparator
    ): void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_WITH_SEPARATOR)
    }

    public visitAlternation(node: gast.Alternation): void {
        this.checkIsTarget(node, PROD_TYPE.ALTERNATION)
    }
}

export function lookAheadSequenceFromAlternatives(
    altsDefs: gast.IProduction[],
    k: number
): lookAheadSequence[] {
    function getOtherPaths(pathsAndSuffixes, filterIdx): Function[][] {
        return reduce(
            pathsAndSuffixes,
            (result, currPathsAndSuffixes, currIdx) => {
                if (currIdx !== filterIdx) {
                    let currPartialPaths = map(
                        currPathsAndSuffixes,
                        singlePathAndSuffix => singlePathAndSuffix.partialPath
                    )
                    return result.concat(currPartialPaths)
                }
                return result
            },
            []
        )
    }

    function isUniquePrefix<T>(arr: T[][], item: T[]): boolean {
        return (
            find(arr, currOtherPath => {
                return every(
                    item,
                    (currPathTok, idx) => currPathTok === currOtherPath[idx]
                )
            }) === undefined
        )
    }

    function initializeArrayOfArrays(size): any[][] {
        let result = []
        for (let i = 0; i < size; i++) {
            result.push([])
        }
        return result
    }

    let partialAlts = map(altsDefs, currAlt => possiblePathsFrom([currAlt], 1))
    let finalResult = initializeArrayOfArrays(partialAlts.length)
    let newData = partialAlts

    // maxLookahead loop
    for (let pathLength = 1; pathLength <= k; pathLength++) {
        let currDataset = newData
        newData = initializeArrayOfArrays(currDataset.length)

        // alternatives loop
        for (let resultIdx = 0; resultIdx < currDataset.length; resultIdx++) {
            let currAltPathsAndSuffixes = currDataset[resultIdx]
            let otherPaths = getOtherPaths(currDataset, resultIdx)

            // paths in current alternative loop
            for (
                let currPathIdx = 0;
                currPathIdx < currAltPathsAndSuffixes.length;
                currPathIdx++
            ) {
                let currPathPrefix =
                    currAltPathsAndSuffixes[currPathIdx].partialPath
                let suffixDef = currAltPathsAndSuffixes[currPathIdx].suffixDef
                let isUnique = isUniquePrefix(otherPaths, currPathPrefix)

                // even if a path is not unique, but there are no longer alternatives to try
                // or if we have reached the maximum lookahead (k) permitted.
                if (
                    isUnique ||
                    isEmpty(suffixDef) ||
                    currPathPrefix.length === k
                ) {
                    let currAltResult = finalResult[resultIdx]
                    if (!containsPath(currAltResult, currPathPrefix)) {
                        currAltResult.push(currPathPrefix)
                    }
                } else {
                    let newPartialPathsAndSuffixes = possiblePathsFrom(
                        suffixDef,
                        pathLength + 1,
                        currPathPrefix
                    )
                    newData[resultIdx] = newData[resultIdx].concat(
                        newPartialPathsAndSuffixes
                    )
                }
            }
        }
    }

    return finalResult
}

export function getLookaheadPathsForOr(
    occurrence: number,
    ruleGrammar: gast.Rule,
    k: number
): lookAheadSequence[] {
    let visitor = new InsideDefinitionFinderVisitor(
        occurrence,
        PROD_TYPE.ALTERNATION
    )
    ruleGrammar.accept(visitor)
    return lookAheadSequenceFromAlternatives(visitor.result, k)
}

export function getLookaheadPathsForOptionalProd(
    occurrence: number,
    ruleGrammar: gast.Rule,
    prodType: PROD_TYPE,
    k: number
): lookAheadSequence[] {
    let insideDefVisitor = new InsideDefinitionFinderVisitor(
        occurrence,
        prodType
    )
    ruleGrammar.accept(insideDefVisitor)
    let insideDef = insideDefVisitor.result

    let afterDefWalker = new RestDefinitionFinderWalker(
        ruleGrammar,
        occurrence,
        prodType
    )
    let afterDef = afterDefWalker.startWalking()

    let insideFlat = new gast.Flat(insideDef)
    let afterFlat = new gast.Flat(afterDef)

    return lookAheadSequenceFromAlternatives([insideFlat, afterFlat], k)
}

export function containsPath(
    alternative: Alternative,
    path: Function[]
): boolean {
    let found = find(alternative, otherPath => {
        return (
            path.length === otherPath.length &&
            every(path, (targetItem, idx) => {
                return targetItem === otherPath[idx]
            })
        )
    })
    return found !== undefined
}

export function isStrictPrefixOfPath(
    prefix: Function[],
    other: Function[]
): boolean {
    return (
        prefix.length < other.length &&
        every(prefix, (tokType, idx) => {
            return tokType === other[idx]
        })
    )
}
