import {
    map,
    reduce,
    reject,
    find,
    every,
    isFunction,
    some
} from "../../utils/utils"

import {gast} from "./gast_public"
import {possiblePathsFrom} from "./interpreter"
import {RestWalker} from "./rest"
import {checkForOrAmbiguities} from "./ambiguities"


export enum PROD_TYPE {
    OPTION,
    REPETITION,
    REPETITION_MANDATORY,
    REPETITION_MANDATORY_WITH_SEPARATOR,
    REPETITION_WITH_SEPARATOR,
    ALTERNATION
}

export function buildLookaheadFuncForOr(occurrence:number,
                                        ruleGrammar:gast.Rule,
                                        k:number,
                                        ignoreAmbiguities:boolean = false,
                                        predicates:{():boolean}[] = []):() => number {
    let lookAheadPaths = getLookaheadPathsForOr(occurrence, ruleGrammar, k)
    if (!ignoreAmbiguities) {
        checkForOrAmbiguities(lookAheadPaths, occurrence, ruleGrammar.name)
    }
    return buildAlternativesLookAheadFunc(lookAheadPaths, predicates)
}

export function buildLookaheadForTopLevel(rule:gast.Rule, k:number):() => boolean {
    let paths = possiblePathsFrom(rule.definition, k)
    let lookAheadPaths = lookAheadSequenceFromAlternatives([paths])
    return buildSingleAlternativeLookaheadFunction(lookAheadPaths[0])
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
export function buildLookaheadFuncForOptionalProd(occurrence:number,
                                                  ruleGrammar:gast.Rule,
                                                  prodType:PROD_TYPE,
                                                  k:number):() => boolean {
    let lookAheadPaths = getLookaheadPathsForOptionalProd(occurrence, ruleGrammar, prodType, k)
    // TODO: ambiguity checks may go here?
    // we only need the lookaheadPaths from the "insideDef" to build the actual lookahead function.
    // the alternative of NOT taking the optional path is always valid and requires no lookahead.
    return buildSingleAlternativeLookaheadFunction(lookAheadPaths[0])
}

export function buildLookaheadForOption(optionOccurrence:number, ruleGrammar:gast.Rule, k:number):() => boolean {
    return buildLookaheadFuncForOptionalProd(optionOccurrence, ruleGrammar, PROD_TYPE.OPTION, k)
}

export function buildLookaheadForMany(optionOccurrence:number, ruleGrammar:gast.Rule, k:number):() => boolean {
    return buildLookaheadFuncForOptionalProd(optionOccurrence, ruleGrammar, PROD_TYPE.REPETITION, k)
}

export function buildLookaheadForManySep(optionOccurrence:number, ruleGrammar:gast.Rule, k:number):() => boolean {
    return buildLookaheadFuncForOptionalProd(optionOccurrence, ruleGrammar, PROD_TYPE.REPETITION_WITH_SEPARATOR, k)
}

export function buildLookaheadForAtLeastOne(optionOccurrence:number, ruleGrammar:gast.Rule, k:number):() => boolean {
    return buildLookaheadFuncForOptionalProd(optionOccurrence, ruleGrammar, PROD_TYPE.REPETITION_MANDATORY, k)
}

export function buildLookaheadForAtLeastOneSep(optionOccurrence:number, ruleGrammar:gast.Rule, k:number):() => boolean {
    return buildLookaheadFuncForOptionalProd(optionOccurrence, ruleGrammar, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR, k)
}

export type Alternative = Function[][]
export type lookAheadSequence = Function[][]

/**
 * @param alternatives - a Sequence of possible paths for each alternative. example:
 *                       input:
 *                       [
 *                         [[A, B] [B]],  // alternative 1, with 2 paths
 *                         [[C]]            // alternative 2, with 1 Path
 *                         [[C, D, E], [C, D, F]] // // alternative 3, with 2 Path
 *                       ]
 *
 *                       output:
 *                       [
 *                         [[A] [B]],  // one Token is enough to identify alternative 1 so [A, B] --> [A]
 *                         [[C]]       // no changes for alternative 2
 *                         [[C, D]] // // the third Tokens (E/F) are not needed to identify this alternative
 *                       ]
 */
export function lookAheadSequenceFromAlternatives(alternatives:Alternative[]):lookAheadSequence[] {

    function isUniquePrefix<T>(arr:T[][], item:T[]):boolean {
        return find(arr, (currOtherPath) => {
                return every(item, (currPathTok, idx) =>
                currPathTok === currOtherPath[idx])
            }) === undefined
    }

    let result = map(alternatives, (currAlt, currIdx) => {
        let otherAlts = reject(alternatives, (curAltInner) => curAltInner === currAlt)
        let allOtherPaths:any = reduce(otherAlts, (result, currOtherAlt) => {
            return result.concat(currOtherAlt)
        }, [])

        return reduce(currAlt, (currAltResult, currPath) => {
            let minimalPath = []
            for (let i = 0; i < currPath.length; i++) {
                minimalPath.push(currPath[i])
                let isUnique = isUniquePrefix(allOtherPaths, minimalPath)

                if (isUnique) {
                    break
                }
            }

            // At this point we either have a distinguishing path (unique) or a path the may be ambiguous
            // If it is a identical to a path from another alternative it is ambiguous, but if it is a strict prefix of a path from another
            // alternative than its ambiguous nature depends on the order of alternatives.
            if (!containsPath(currAltResult, minimalPath)) {
                // found one minimal path to distinguish this alternative.
                currAltResult.push(minimalPath)
                return currAltResult
            }
            return currAltResult
        }, [])
    })

    return result
}

/**
 * @param alts
 * @param predicates - An array of predicates, an alternative can only match if its lookahead sequence matches AND
 *                     Its predicate matches. Note that some alternatives may not have any predicates while some do
 *                     in the same set of alternatives.
 *
 * @returns {function(): number}
 */
export function buildAlternativesLookAheadFunc(alts:lookAheadSequence[], predicates:{():boolean}[] = []):() => number {
    // TODO: performance optimizations for the (common) edge case of K == 1

    let numOfAlts = alts.length


    // This version takes into account the predicates as well.
    if (some(predicates, (currPred) => isFunction(currPred))) {
        /**
         * @returns {number} - The chosen alternative index
         */
        return function ():number {
            for (let t = 0; t < numOfAlts; t++) {
                let currAlt = alts[t]
                let currNumOfPaths = currAlt.length

                let currPredicate = predicates[t]
                if (currPredicate && !currPredicate.call(this)) {
                    // if the predicate does not match there is no point in checking the paths
                    continue
                }
                nextPath:
                    for (let j = 0; j < currNumOfPaths; j++) {
                        let currPath = currAlt[j]
                        let currPathLength = currPath.length
                        for (let i = 0; i < currPathLength; i++) {
                            let nextToken = this.LA(i + 1)
                            if (!(nextToken instanceof currPath[i])) {
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
            return -1
        }
    }
    // optimized lookahead without needing to check for predicates at all.
    // this causes code duplication which is intentional...
    else {
        /**
         * @returns {number} - The chosen alternative index
         */
        return function ():number {
            for (let t = 0; t < numOfAlts; t++) {
                let currAlt = alts[t]
                let currNumOfPaths = currAlt.length
                nextPath:
                    for (let j = 0; j < currNumOfPaths; j++) {
                        let currPath = currAlt[j]
                        let currPathLength = currPath.length
                        for (let i = 0; i < currPathLength; i++) {
                            let nextToken = this.LA(i + 1)
                            if (!(nextToken instanceof currPath[i])) {
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
            return -1
        }

    }

}

export function buildSingleAlternativeLookaheadFunction(alt:lookAheadSequence):() => boolean {

    // TODO: performance optimizations for the (common) edge case of K == 1

    let numOfPaths = alt.length
    return function ():boolean {
        nextPath:
            for (let j = 0; j < numOfPaths; j++) {
                let currPath = alt[j]
                let currPathLength = currPath.length
                for (let i = 0; i < currPathLength; i++) {
                    let nextToken = this.LA(i + 1)
                    if (!(nextToken instanceof currPath[i])) {
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

class RestDefinitionFinderWalker extends RestWalker {

    private restDef:gast.IProduction[]

    constructor(private topProd:gast.Rule, private targetOccurrence:number, private targetProdType:PROD_TYPE) { super() }

    startWalking():gast.IProduction[] {
        this.walk(this.topProd)
        return this.restDef
    }

    private checkIsTarget(node:gast.AbstractProduction & gast.IProductionWithOccurrence,
                          expectedProdType:PROD_TYPE,
                          currRest:gast.IProduction[],
                          prevRest:gast.IProduction[]):boolean {
        if (node.occurrenceInParent === this.targetOccurrence &&
            this.targetProdType === expectedProdType) {
            this.restDef = currRest.concat(prevRest)
            return true
        }
        // performance optimization, do not iterate over the entire Grammar ast after we have found the target
        return false
    }

    walkOption(optionProd:gast.Option, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (!this.checkIsTarget(optionProd, PROD_TYPE.OPTION, currRest, prevRest)) {
            super.walkOption(optionProd, currRest, prevRest)
        }
    }

    walkAtLeastOne(atLeastOneProd:gast.RepetitionMandatory, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (!this.checkIsTarget(atLeastOneProd, PROD_TYPE.REPETITION_MANDATORY, currRest, prevRest)) {
            super.walkOption(atLeastOneProd, currRest, prevRest)
        }
    }

    walkAtLeastOneSep(atLeastOneSepProd:gast.RepetitionMandatoryWithSeparator,
                      currRest:gast.IProduction[],
                      prevRest:gast.IProduction[]):void {
        if (!this.checkIsTarget(atLeastOneSepProd, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR, currRest, prevRest)) {
            super.walkOption(atLeastOneSepProd, currRest, prevRest)
        }
    }

    walkMany(manyProd:gast.Repetition, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (!this.checkIsTarget(manyProd, PROD_TYPE.REPETITION, currRest, prevRest)) {
            super.walkOption(manyProd, currRest, prevRest)
        }
    }

    walkManySep(manySepProd:gast.RepetitionWithSeparator, currRest:gast.IProduction[], prevRest:gast.IProduction[]):void {
        if (!this.checkIsTarget(manySepProd, PROD_TYPE.REPETITION_WITH_SEPARATOR, currRest, prevRest)) {
            super.walkOption(manySepProd, currRest, prevRest)
        }
    }
}

/**
 * Returns the definition of a target production in a top level level rule.
 */
class InsideDefinitionFinderVisitor extends gast.GAstVisitor {

    public result:gast.IProduction[] = []

    constructor(private targetOccurrence:number, private targetProdType:PROD_TYPE) {
        super()
    }

    private checkIsTarget(node:gast.AbstractProduction & gast.IProductionWithOccurrence,
                          expectedProdName:PROD_TYPE):void {
        if (node.occurrenceInParent === this.targetOccurrence &&
            this.targetProdType === expectedProdName) {
            this.result = node.definition
        }
    }

    public visitOption(node:gast.Option):void {
        this.checkIsTarget(node, PROD_TYPE.OPTION)
    }

    public visitRepetition(node:gast.Repetition):void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION)
    }

    public visitRepetitionMandatory(node:gast.RepetitionMandatory):void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY)
    }

    public visitRepetitionMandatoryWithSeparator(node:gast.RepetitionMandatoryWithSeparator):void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR)
    }

    public visitRepetitionWithSeparator(node:gast.RepetitionWithSeparator):void {
        this.checkIsTarget(node, PROD_TYPE.REPETITION_WITH_SEPARATOR)
    }

    public visitAlternation(node:gast.Alternation):void {
        this.checkIsTarget(node, PROD_TYPE.ALTERNATION)
    }
}

export function getLookaheadPathsForOr(occurrence:number, ruleGrammar:gast.Rule, k:number):lookAheadSequence[] {
    let visitor = new InsideDefinitionFinderVisitor(occurrence, PROD_TYPE.ALTERNATION)
    ruleGrammar.accept(visitor)
    let alternatives = map(visitor.result, (currAlt) => possiblePathsFrom([currAlt], k))
    return lookAheadSequenceFromAlternatives(alternatives)
}

export function getLookaheadPathsForOptionalProd(occurrence:number,
                                                 ruleGrammar:gast.Rule,
                                                 prodType:PROD_TYPE,
                                                 k:number):lookAheadSequence[] {

    let insideDefVisitor = new InsideDefinitionFinderVisitor(occurrence, prodType)
    ruleGrammar.accept(insideDefVisitor)
    let insideDef = insideDefVisitor.result

    let afterDefWalker = new RestDefinitionFinderWalker(ruleGrammar, occurrence, prodType)
    let afterDef = afterDefWalker.startWalking()

    let insidePaths = possiblePathsFrom(insideDef, k)
    let afterPaths = possiblePathsFrom(afterDef, k)

    return lookAheadSequenceFromAlternatives([insidePaths, afterPaths])
}


export function containsPath(alternative:Alternative, path:Function[]):boolean {
    let found = find(alternative, (otherPath) => {
        return path.length === otherPath.length &&
            every(path, (targetItem, idx) => {
                return targetItem === otherPath[idx]
            })
    })
    return found !== undefined
}
