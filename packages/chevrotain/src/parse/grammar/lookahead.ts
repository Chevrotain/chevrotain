import {
  map,
  reduce,
  every,
  isEmpty,
  flatten,
  forEach,
  has
} from "../../utils/utils"
import { possiblePathsFrom } from "./interpreter"
import { RestWalker } from "./rest"
import { Predicate, TokenMatcher, lookAheadSequence } from "../parser/parser"
import {
  tokenStructuredMatcher,
  tokenStructuredMatcherNoCategories
} from "../../scan/tokens"
import {
  AbstractProduction,
  Alternation,
  Alternative as AlternativeGAST,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule
} from "./gast/gast_public"
import { GAstVisitor } from "./gast/gast_visitor_public"
import {
  IOrAlt,
  IProduction,
  IProductionWithOccurrence,
  TokenType
} from "../../../api"

export enum PROD_TYPE {
  OPTION,
  REPETITION,
  REPETITION_MANDATORY,
  REPETITION_MANDATORY_WITH_SEPARATOR,
  REPETITION_WITH_SEPARATOR,
  ALTERNATION
}

export function getProdType(prod: IProduction): PROD_TYPE {
  /* istanbul ignore else */
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
    throw Error("non exhaustive match")
  }
}

export function buildLookaheadFuncForOr(
  occurrence: number,
  ruleGrammar: Rule,
  maxLookahead: number,
  hasPredicates: boolean,
  dynamicTokensEnabled: boolean,
  laFuncBuilder: Function
): (orAlts?: IOrAlt<any>[]) => number {
  let lookAheadPaths = getLookaheadPathsForOr(
    occurrence,
    ruleGrammar,
    maxLookahead
  )

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
  lookaheadBuilder: (lookAheadSequence, TokenMatcher, boolean) => () => boolean
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

  return lookaheadBuilder(lookAheadPaths[0], tokenMatcher, dynamicTokensEnabled)
}

export type Alternative = TokenType[][]

export function buildAlternativesLookAheadFunc(
  alts: lookAheadSequence[],
  hasPredicates: boolean,
  tokenMatcher: TokenMatcher,
  dynamicTokensEnabled: boolean
): (orAlts?: IOrAlt<any>[]) => number {
  let numOfAlts = alts.length
  let areAllOneTokenLookahead = every(alts, (currAlt) => {
    return every(currAlt, (currPath) => {
      return currPath.length === 1
    })
  })

  // This version takes into account the predicates as well.
  if (hasPredicates) {
    /**
     * @returns {number} - The chosen alternative index
     */
    return function (orAlts: IOrAlt<any>[]): number {
      // unfortunately the predicates must be extracted every single time
      // as they cannot be cached due to references to parameters(vars) which are no longer valid.
      // note that in the common case of no predicates, no cpu time will be wasted on this (see else block)
      let predicates: Predicate[] = map(orAlts, (currAlt) => currAlt.GATE)

      for (let t = 0; t < numOfAlts; t++) {
        let currAlt = alts[t]
        let currNumOfPaths = currAlt.length

        let currPredicate = predicates[t]
        if (currPredicate !== undefined && currPredicate.call(this) === false) {
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
    let singleTokenAlts = map(alts, (currAlt) => {
      return flatten(currAlt)
    })

    let choiceToAlt = reduce(
      singleTokenAlts,
      (result, currAlt, idx) => {
        forEach(currAlt, (currTokType) => {
          if (!has(result, currTokType.tokenTypeIdx)) {
            result[currTokType.tokenTypeIdx] = idx
          }
          forEach(currTokType.categoryMatches, (currExtendingType) => {
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
    return function (): number {
      let nextToken = this.LA(1)
      return choiceToAlt[nextToken.tokenTypeIdx]
    }
  } else {
    // optimized lookahead without needing to check the predicates at all.
    // this causes code duplication which is intentional to improve performance.
    /**
     * @returns {number} - The chosen alternative index
     */
    return function (): number {
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
  let areAllOneTokenLookahead = every(alt, (currPath) => {
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

      return function (): boolean {
        return this.LA(1).tokenTypeIdx === expectedTokenUniqueKey
      }
    } else {
      let choiceToAlt = reduce(
        singleTokensTypes,
        (result, currTokType, idx) => {
          result[currTokType.tokenTypeIdx] = true
          forEach(currTokType.categoryMatches, (currExtendingType) => {
            result[currExtendingType] = true
          })
          return result
        },
        []
      )

      return function (): boolean {
        let nextToken = this.LA(1)
        return choiceToAlt[nextToken.tokenTypeIdx] === true
      }
    }
  } else {
    return function (): boolean {
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
    if (!this.checkIsTarget(optionProd, PROD_TYPE.OPTION, currRest, prevRest)) {
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
      !this.checkIsTarget(manyProd, PROD_TYPE.REPETITION, currRest, prevRest)
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
    private targetProdType: PROD_TYPE,
    private targetRef?: any
  ) {
    super()
  }

  private checkIsTarget(
    node: AbstractProduction & IProductionWithOccurrence,
    expectedProdName: PROD_TYPE
  ): void {
    if (
      node.idx === this.targetOccurrence &&
      this.targetProdType === expectedProdName &&
      (this.targetRef === undefined || node === this.targetRef)
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

function initializeArrayOfArrays(size): any[][] {
  let result = new Array(size)
  for (let i = 0; i < size; i++) {
    result[i] = []
  }
  return result
}

/**
 * A sort of hash function between a Path in the grammar and a string.
 * Note that this returns multiple "hashes" to support the scenario of token categories.
 * -  A single path with categories may match multiple **actual** paths.
 */
function pathToHashKeys(path: TokenType[]): string[] {
  let keys = [""]
  for (let i = 0; i < path.length; i++) {
    const tokType = path[i]
    let longerKeys = []
    for (let j = 0; j < keys.length; j++) {
      const currShorterKey = keys[j]
      longerKeys.push(currShorterKey + "_" + tokType.tokenTypeIdx)
      for (let t = 0; t < tokType.categoryMatches.length; t++) {
        const categoriesKeySuffix = "_" + tokType.categoryMatches[t]
        longerKeys.push(currShorterKey + categoriesKeySuffix)
      }
    }
    keys = longerKeys
  }
  return keys
}

/**
 * Imperative style due to being called from a hot spot
 */
function isUniquePrefixHash(
  altKnownPathsKeys: Record<string, boolean>[],
  searchPathKeys: string[],
  idx: number
): boolean {
  for (
    let currAltIdx = 0;
    currAltIdx < altKnownPathsKeys.length;
    currAltIdx++
  ) {
    // We only want to test vs the other alternatives
    if (currAltIdx === idx) {
      continue
    }
    const otherAltKnownPathsKeys = altKnownPathsKeys[currAltIdx]
    for (let searchIdx = 0; searchIdx < searchPathKeys.length; searchIdx++) {
      const searchKey = searchPathKeys[searchIdx]
      if (otherAltKnownPathsKeys[searchKey] === true) {
        return false
      }
    }
  }
  // None of the SearchPathKeys were found in any of the other alternatives
  return true
}

export function lookAheadSequenceFromAlternatives(
  altsDefs: IProduction[],
  k: number
): lookAheadSequence[] {
  let partialAlts = map(altsDefs, (currAlt) => possiblePathsFrom([currAlt], 1))
  let finalResult = initializeArrayOfArrays(partialAlts.length)
  const altsHashes = map(partialAlts, (currAltPaths) => {
    const dict = {}
    forEach(currAltPaths, (item) => {
      const keys = pathToHashKeys(item.partialPath)
      forEach(keys, (currKey) => {
        dict[currKey] = true
      })
    })
    return dict
  })
  let newData = partialAlts

  // maxLookahead loop
  for (let pathLength = 1; pathLength <= k; pathLength++) {
    let currDataset = newData
    newData = initializeArrayOfArrays(currDataset.length)

    // alternatives loop
    for (let altIdx = 0; altIdx < currDataset.length; altIdx++) {
      let currAltPathsAndSuffixes = currDataset[altIdx]
      // paths in current alternative loop
      for (
        let currPathIdx = 0;
        currPathIdx < currAltPathsAndSuffixes.length;
        currPathIdx++
      ) {
        let currPathPrefix = currAltPathsAndSuffixes[currPathIdx].partialPath
        let suffixDef = currAltPathsAndSuffixes[currPathIdx].suffixDef
        const prefixKeys = pathToHashKeys(currPathPrefix)
        let isUnique = isUniquePrefixHash(altsHashes, prefixKeys, altIdx)
        // End of the line for this path.
        if (isUnique || isEmpty(suffixDef) || currPathPrefix.length === k) {
          let currAltResult = finalResult[altIdx]
          // TODO: Can we implement a containsPath using Maps/Dictionaries?
          if (containsPath(currAltResult, currPathPrefix) === false) {
            currAltResult.push(currPathPrefix)
            // Update all new  keys for the current path.
            for (let j = 0; j < prefixKeys.length; j++) {
              const currKey = prefixKeys[j]
              altsHashes[altIdx][currKey] = true
            }
          }
        }
        // Expand longer paths
        else {
          let newPartialPathsAndSuffixes = possiblePathsFrom(
            suffixDef,
            pathLength + 1,
            currPathPrefix
          )
          newData[altIdx] = newData[altIdx].concat(newPartialPathsAndSuffixes)

          // Update keys for new known paths
          forEach(newPartialPathsAndSuffixes, (item) => {
            const prefixKeys = pathToHashKeys(item.partialPath)
            forEach(prefixKeys, (key) => {
              altsHashes[altIdx][key] = true
            })
          })
        }
      }
    }
  }

  return finalResult
}

export function getLookaheadPathsForOr(
  occurrence: number,
  ruleGrammar: Rule,
  k: number,
  orProd?: Alternation
): lookAheadSequence[] {
  const visitor = new InsideDefinitionFinderVisitor(
    occurrence,
    PROD_TYPE.ALTERNATION,
    orProd
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
  let insideDefVisitor = new InsideDefinitionFinderVisitor(occurrence, prodType)
  ruleGrammar.accept(insideDefVisitor)
  let insideDef = insideDefVisitor.result

  let afterDefWalker = new RestDefinitionFinderWalker(
    ruleGrammar,
    occurrence,
    prodType
  )
  let afterDef = afterDefWalker.startWalking()

  let insideFlat = new AlternativeGAST({ definition: insideDef })
  let afterFlat = new AlternativeGAST({ definition: afterDef })

  return lookAheadSequenceFromAlternatives([insideFlat, afterFlat], k)
}

export function containsPath(
  alternative: Alternative,
  searchPath: TokenType[]
): boolean {
  compareOtherPath: for (let i = 0; i < alternative.length; i++) {
    const otherPath = alternative[i]
    if (otherPath.length !== searchPath.length) {
      continue
    }
    for (let j = 0; j < otherPath.length; j++) {
      const searchTok = searchPath[j]
      const otherTok = otherPath[j]

      const matchingTokens =
        searchTok === otherTok ||
        otherTok.categoryMatchesMap[searchTok.tokenTypeIdx] !== undefined
      if (matchingTokens === false) {
        continue compareOtherPath
      }
    }
    return true
  }

  return false
}

export function isStrictPrefixOfPath(
  prefix: TokenType[],
  other: TokenType[]
): boolean {
  return (
    prefix.length < other.length &&
    every(prefix, (tokType, idx) => {
      const otherTokType = other[idx]
      return (
        tokType === otherTokType ||
        otherTokType.categoryMatchesMap[tokType.tokenTypeIdx]
      )
    })
  )
}

export function areTokenCategoriesNotUsed(
  lookAheadPaths: lookAheadSequence[]
): boolean {
  return every(lookAheadPaths, (singleAltPaths) =>
    every(singleAltPaths, (singlePath) =>
      every(singlePath, (token) => isEmpty(token.categoryMatches))
    )
  )
}
