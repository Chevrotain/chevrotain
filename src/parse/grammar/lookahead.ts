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
import { possiblePathsFrom } from "./interpreter"
import { RestWalker } from "./rest"
import {
    Predicate,
    IAnyOrAlt,
    TokenMatcher,
    lookAheadSequence
} from "../parser_public"
import { TokenType } from "../../scan/lexer_public"
import {
    tokenStructuredMatcher,
    tokenStructuredMatcherNoCategories
} from "../../scan/tokens"
import {
    AbstractProduction,
    Alternation,
    Flat,
    IProduction,
    IProductionWithOccurrence,
    Option,
    Repetition,
    RepetitionMandatory,
    RepetitionMandatoryWithSeparator,
    RepetitionWithSeparator,
    Rule
} from "./gast/gast_public"
import { GAstVisitor } from "./gast/gast_visitor_public"

export enum PROD_TYPE {
    OPTION,
    REPETITION,
    REPETITION_MANDATORY,
    REPETITION_MANDATORY_WITH_SEPARATOR,
    REPETITION_WITH_SEPARATOR,
    ALTERNATION
}

export function getProdType(prod: IProduction): PROD_TYPE {
    if (prod instanceof Option) {
        return PROD_TYPE.OPTION
    } else if (prod instanceof Repetition) {
        return PROD_TYPE.REPETITION
    } else if (prod instanceof RepetitionMandatory) {
        return PROD_TYPE.REPETITION_MANDATORY
    } else if (prod instanceof RepetitionMandatoryWithSeparator) {
        return PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR
    } else if (prod instanceof RepetitionWithSeparator) {
        return PROD_TYPE.REPETITION_WITH_SEPARATOR
    } else if (prod instanceof Alternation) {
        return PROD_TYPE.ALTERNATION
    } else {
        /* istanbul ignore next */
        throw Error("non exhaustive match")
    }
}

export function buildLookaheadFuncForOr(
    occurrence: number,
    ruleGrammar: Rule,
    k: number,
    hasPredicates: boolean,
    dynamicTokensEnabled: boolean,
    laFuncBuilder: Function
): (orAlts?: IAnyOrAlt<any>[]) => number {
    let lookAheadPaths = getLookaheadPathsForOr(occurrence, ruleGrammar, k)

    const tokenMatcher = areTokenCategoriesNotUsed(lookAheadPaths)
        ? tokenStructuredMatcherNoCategories
        : tokenStructuredMatcher

    return laFuncBuilder(
        lookAheadPaths,
        hasPredicates,
        tokenMatcher,
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
    ruleGrammar: Rule,
    k: number,
    dynamicTokensEnabled: boolean,
    prodType: PROD_TYPE,
    lookaheadBuilder: (
        lookAheadSequence,
        TokenMatcher,
        boolean
    ) => () => boolean
): () => boolean {
    let lookAheadPaths = getLookaheadPathsForOptionalProd(
        occurrence,
        ruleGrammar,
        prodType,
        k
    )

    const tokenMatcher = areTokenCategoriesNotUsed(lookAheadPaths)
        ? tokenStructuredMatcherNoCategories
        : tokenStructuredMatcher

    return lookaheadBuilder(
        lookAheadPaths[0],
        tokenMatcher,
        dynamicTokensEnabled
    )
}

export type Alternative = TokenType[][]

export function buildAlternativesLookAheadFunc(
    alts: lookAheadSequence[],
    hasPredicates: boolean,
    tokenMatcher: TokenMatcher,
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
            // as they cannot be cached due to references to parameters(vars) which are no longer valid.
            // note that in the common case of no predicates, no cpu time will be wasted on this (see else block)
            let predicates: Predicate[] = map(orAlts, currAlt => currAlt.GATE)

            for (let t = 0; t < numOfAlts; t++) {
                let currAlt = alts[t]
                let currNumOfPaths = currAlt.length

                let currPredicate = predicates[t]
                if (
                    currPredicate !== undefined &&
                    currPredicate.call(this) === false
                ) {
                    // if the predicate does not match there is no point in checking the paths
                    continue
                }
                nextPath: for (let j = 0; j < currNumOfPaths; j++) {
                    let currPath = currAlt[j]
                    let currPathLength = currPath.length
                    for (let i = 0; i < currPathLength; i++) {
                        let nextToken = this.LA(i + 1)
                        if (tokenMatcher(nextToken, currPath[i]) === false) {
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
                forEach(currAlt, currTokType => {
                    if (!has(result, currTokType.tokenTypeIdx)) {
                        result[currTokType.tokenTypeIdx] = idx
                    }
                    forEach(currTokType.categoryMatches, currExtendingType => {
                        if (!has(result, currExtendingType)) {
                            result[currExtendingType] = idx
                        }
                    })
                })
                return result
            },
            []
        )

        /**
         * @returns {number} - The chosen alternative index
         */
        return function(): number {
            let nextToken = this.LA(1)
            return choiceToAlt[nextToken.tokenTypeIdx]
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
                        if (tokenMatcher(nextToken, currPath[i]) === false) {
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
    dynamicTokensEnabled: boolean
): () => boolean {
    let areAllOneTokenLookahead = every(alt, currPath => {
        return currPath.length === 1
    })

    let numOfPaths = alt.length

    // optimized (common) case of all the lookaheads paths requiring only
    // a single token lookahead.
    if (areAllOneTokenLookahead && !dynamicTokensEnabled) {
        let singleTokensTypes = flatten(alt)

        if (
            singleTokensTypes.length === 1 &&
            isEmpty((<any>singleTokensTypes[0]).categoryMatches)
        ) {
            let expectedTokenType = singleTokensTypes[0]
            let expectedTokenUniqueKey = (<any>expectedTokenType).tokenTypeIdx

            return function(): boolean {
                return this.LA(1).tokenTypeIdx === expectedTokenUniqueKey
            }
        } else {
            let choiceToAlt = reduce(
                singleTokensTypes,
                (result, currTokType, idx) => {
                    result[currTokType.tokenTypeIdx] = true
                    forEach(currTokType.categoryMatches, currExtendingType => {
                        result[currExtendingType] = true
                    })
                    return result
                },
                []
            )

            return function(): boolean {
                let nextToken = this.LA(1)
                return choiceToAlt[nextToken.tokenTypeIdx] === true
            }
        }
    } else {
        return function(): boolean {
            nextPath: for (let j = 0; j < numOfPaths; j++) {
                let currPath = alt[j]
                let currPathLength = currPath.length
                for (let i = 0; i < currPathLength; i++) {
                    let nextToken = this.LA(i + 1)
                    if (tokenMatcher(nextToken, currPath[i]) === false) {
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
    private restDef: IProduction[]

    constructor(
        private topProd: Rule,
        private targetOccurrence: number,
        private targetProdType: PROD_TYPE
    ) {
        super()
    }

    startWalking(): IProduction[] {
        this.walk(this.topProd)
        return this.restDef
    }

    private checkIsTarget(
        node: AbstractProduction & IProductionWithOccurrence,
        expectedProdType: PROD_TYPE,
        currRest: IProduction[],
        prevRest: IProduction[]
    ): boolean {
        if (
            node.idx === this.targetOccurrence &&
            this.targetProdType === expectedProdType
        ) {
            this.restDef = currRest.concat(prevRest)
            return true
        }
        // performance optimization, do not iterate over the entire Grammar ast after we have found the target
        return false
    }

    walkOption(
        optionProd: Option,
        currRest: IProduction[],
        prevRest: IProduction[]
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
        atLeastOneProd: RepetitionMandatory,
        currRest: IProduction[],
        prevRest: IProduction[]
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
        atLeastOneSepProd: RepetitionMandatoryWithSeparator,
        currRest: IProduction[],
        prevRest: IProduction[]
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
        manyProd: Repetition,
        currRest: IProduction[],
        prevRest: IProduction[]
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
        manySepProd: RepetitionWithSeparator,
        currRest: IProduction[],
        prevRest: IProduction[]
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
class InsideDefinitionFinderVisitor extends GAstVisitor {
    public result: IProduction[] = []

    constructor(
        private targetOccurrence: number,
        private targetProdType: PROD_TYPE
    ) {
        super()
    }

    private checkIsTarget(
        node: AbstractProduction & IProductionWithOccurrence,
        expectedProdName: PROD_TYPE
    ): void {
        if (
            node.idx === this.targetOccurrence &&
            this.targetProdType === expectedProdName
        ) {
            this.result = node.definition
        }
    }

    public visitOption(node: Option): void {
        this.checkIsTarget(node, PROD_TYPE.OPTION)
    }

    public visitRepetition(node: Repetition): void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION)
    }

    public visitRepetitionMandatory(node: RepetitionMandatory): void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY)
    }

    public visitRepetitionMandatoryWithSeparator(
        node: RepetitionMandatoryWithSeparator
    ): void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR)
    }

    public visitRepetitionWithSeparator(node: RepetitionWithSeparator): void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_WITH_SEPARATOR)
    }

    public visitAlternation(node: Alternation): void {
        this.checkIsTarget(node, PROD_TYPE.ALTERNATION)
    }
}

export function lookAheadSequenceFromAlternatives(
    altsDefs: IProduction[],
    k: number
): lookAheadSequence[] {
    function getOtherPaths(pathsAndSuffixes, filterIdx): TokenType[][] {
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
    ruleGrammar: Rule,
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
    ruleGrammar: Rule,
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

    let insideFlat = new Flat({ definition: insideDef })
    let afterFlat = new Flat({ definition: afterDef })

    return lookAheadSequenceFromAlternatives([insideFlat, afterFlat], k)
}

export function containsPath(
    alternative: Alternative,
    path: TokenType[]
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
    prefix: TokenType[],
    other: TokenType[]
): boolean {
    return (
        prefix.length < other.length &&
        every(prefix, (tokType, idx) => {
            return tokType === other[idx]
        })
    )
}

export function areTokenCategoriesNotUsed(
    lookAheadPaths: lookAheadSequence[]
): boolean {
    return every(lookAheadPaths, singleAltPaths =>
        every(singleAltPaths, singlePath =>
            every(singlePath, token => isEmpty(token.categoryMatches))
        )
    )
}
