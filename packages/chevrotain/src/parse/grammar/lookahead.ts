import isEmpty from "lodash/isEmpty"
import flatten from "lodash/flatten"
import every from "lodash/every"
import map from "lodash/map"
import forEach from "lodash/forEach"
import has from "lodash/has"
import reduce from "lodash/reduce"
import { possiblePathsFrom } from "./interpreter"
import { RestWalker } from "./rest"
import { LookAheadSequence } from "../parser/parser"
import {
  Alternation,
  Alternative as AlternativeGAST,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule
} from "@chevrotain/gast"
import { GAstVisitor } from "@chevrotain/gast"
import {
  IOrAlt,
  IProduction,
  IProductionWithOccurrence,
  TokenType
} from "@chevrotain/types"
import { MixedInParser } from "../parser/traits/parser_traits"
import { AdaptivePredictError } from "../parser/traits/atn_simulator"

export enum PROD_TYPE {
  OPTION,
  REPETITION,
  REPETITION_MANDATORY,
  REPETITION_MANDATORY_WITH_SEPARATOR,
  REPETITION_WITH_SEPARATOR,
  ALTERNATION
}

export class PredicateSet {
  private predicates: boolean[] = []

  is(index: number): boolean {
    return index >= this.predicates.length || this.predicates[index]
  }

  set(index: number, value: boolean) {
    this.predicates[index] = value
  }

  toString(): string {
    let value = ""
    const size = this.predicates.length
    for (let i = 0; i < size; i++) {
      value += this.predicates[i] === true ? "1" : "0"
    }
    return value
  }
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

const EMPTY_PREDICATES = new PredicateSet()

export function buildLookaheadFuncForOr(
  rule: Rule,
  occurrence: number,
  decisionIndex: number,
  hasPredicates: boolean,
  dynamicTokensEnabled: boolean
): (orAlts?: IOrAlt<any>[]) => number | AdaptivePredictError {
  const partialAlts = map(
    getLookaheadPathsForOr(occurrence, rule, 1),
    (currAlt) => map(currAlt, (path) => path[0])
  )

  if (isLL1Sequence(partialAlts, false) && !dynamicTokensEnabled) {
    const choiceToAlt = reduce(
      partialAlts,
      (result, currAlt, idx) => {
        forEach(currAlt, (currTokType) => {
          result[currTokType.tokenTypeIdx!] = idx
          forEach(currTokType.categoryMatches!, (currExtendingType) => {
            result[currExtendingType] = idx
          })
        })
        return result
      },
      {} as Record<number, number>
    )

    if (hasPredicates) {
      return function (orAlts) {
        const nextToken = this.LA(1)
        const prediction: number = choiceToAlt[nextToken.tokenTypeIdx]
        if (orAlts !== undefined) {
          const gate = orAlts[prediction].GATE
          if (gate !== undefined && gate.call(this) === false) {
            return {
              tokenPath: [],
              actualToken: nextToken,
              possibleTokenTypes: getPossiblePredicatedTokenTypes.call(
                this,
                partialAlts,
                orAlts
              )
            }
          }
        }
        return prediction
      }
    } else {
      return function (): number {
        const nextToken = this.LA(1)
        return (
          choiceToAlt[nextToken.tokenTypeIdx] ?? {
            tokenPath: [],
            actualToken: nextToken,
            possibleTokenTypes: getPossiblePredicatedTokenTypes.call(
              this,
              partialAlts
            )
          }
        )
      }
    }
  } else if (hasPredicates) {
    return function (this: MixedInParser, orAlts) {
      const predicates = new PredicateSet()
      const length = orAlts === undefined ? 0 : orAlts.length
      for (let i = 0; i < length; i++) {
        const gate = orAlts?.[i].GATE
        predicates.set(i, gate === undefined || gate.call(this))
      }
      return this.adaptivePredict(decisionIndex, predicates)
    }
  } else {
    return function (this: MixedInParser) {
      return this.adaptivePredict(decisionIndex, EMPTY_PREDICATES)
    }
  }
}

function getPossiblePredicatedTokenTypes(
  alts: TokenType[][],
  orAlts?: IOrAlt<any>[]
): TokenType[] {
  const tokenTypes: TokenType[] = []
  const length = alts.length
  for (let i = 0; i < length; i++) {
    const gate = orAlts?.[i].GATE
    if (gate === undefined || gate.call(this)) {
      tokenTypes.push(...alts[i])
    }
  }
  return tokenTypes
}

export function buildLookaheadFuncForOptionalProd(
  rule: Rule,
  occurrence: number,
  prodType: PROD_TYPE,
  decisionIndex: number,
  dynamicTokensEnabled: boolean
): () => boolean | AdaptivePredictError {
  const alts = map(
    getLookaheadPathsForOptionalProd(occurrence, rule, prodType, 1),
    (e) => {
      return map(e, (g) => g[0])
    }
  )

  if (isLL1Sequence(alts) && alts[0][0] && !dynamicTokensEnabled) {
    const alt = alts[0]
    const singleTokensTypes = flatten(alt)

    if (
      singleTokensTypes.length === 1 &&
      isEmpty(singleTokensTypes[0].categoryMatches)
    ) {
      const expectedTokenType = singleTokensTypes[0]
      const expectedTokenUniqueKey = expectedTokenType.tokenTypeIdx

      return function (): boolean {
        return this.LA(1).tokenTypeIdx === expectedTokenUniqueKey
      }
    } else {
      const choiceToAlt = reduce(
        singleTokensTypes,
        (result, currTokType) => {
          if (currTokType !== undefined) {
            result[currTokType.tokenTypeIdx!] = true
            forEach(currTokType.categoryMatches, (currExtendingType) => {
              result[currExtendingType] = true
            })
          }
          return result
        },
        {} as Record<number, boolean>
      )

      return function (): boolean {
        const nextToken = this.LA(1)
        return choiceToAlt[nextToken.tokenTypeIdx] === true
      }
    }
  }
  return function (this: MixedInParser) {
    const result = this.adaptivePredict(decisionIndex, EMPTY_PREDICATES)
    return typeof result === "object" ? result : result === 0
  }
}

function isLL1Sequence(sequences: TokenType[][], allowEmpty = true): boolean {
  const fullSet = new Set<number>()

  for (const alt of sequences) {
    if (allowEmpty === false && alt[0] === undefined) {
      return false
    }
    const altSet = new Set<number>()
    for (const tokType of alt) {
      if (tokType === undefined) {
        // Epsilon production encountered
        break
      }
      const indices = [tokType.tokenTypeIdx!].concat(tokType.categoryMatches!)
      for (const index of indices) {
        if (fullSet.has(index)) {
          if (!altSet.has(index)) {
            return false
          }
        } else {
          fullSet.add(index)
          altSet.add(index)
        }
      }
    }
  }
  return true
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
    node: IProductionWithOccurrence,
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
    node: { definition: IProduction[] } & IProductionWithOccurrence,
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

function initializeArrayOfArrays(size: number): any[][] {
  const result = new Array(size)
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
    const longerKeys = []
    for (let j = 0; j < keys.length; j++) {
      const currShorterKey = keys[j]
      longerKeys.push(currShorterKey + "_" + tokType.tokenTypeIdx)
      for (let t = 0; t < tokType.categoryMatches!.length; t++) {
        const categoriesKeySuffix = "_" + tokType.categoryMatches![t]
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
): LookAheadSequence[] {
  const partialAlts = map(altsDefs, (currAlt) =>
    possiblePathsFrom([currAlt], 1)
  )
  const finalResult = initializeArrayOfArrays(partialAlts.length)
  const altsHashes = map(partialAlts, (currAltPaths) => {
    const dict: { [key: string]: boolean } = {}
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
    const currDataset = newData
    newData = initializeArrayOfArrays(currDataset.length)

    // alternatives loop
    for (let altIdx = 0; altIdx < currDataset.length; altIdx++) {
      const currAltPathsAndSuffixes = currDataset[altIdx]
      // paths in current alternative loop
      for (
        let currPathIdx = 0;
        currPathIdx < currAltPathsAndSuffixes.length;
        currPathIdx++
      ) {
        const currPathPrefix = currAltPathsAndSuffixes[currPathIdx].partialPath
        const suffixDef = currAltPathsAndSuffixes[currPathIdx].suffixDef
        const prefixKeys = pathToHashKeys(currPathPrefix)
        const isUnique = isUniquePrefixHash(altsHashes, prefixKeys, altIdx)
        // End of the line for this path.
        if (isUnique || isEmpty(suffixDef) || currPathPrefix.length === k) {
          const currAltResult = finalResult[altIdx]
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
          const newPartialPathsAndSuffixes = possiblePathsFrom(
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
): LookAheadSequence[] {
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
): LookAheadSequence[] {
  const insideDefVisitor = new InsideDefinitionFinderVisitor(
    occurrence,
    prodType
  )
  ruleGrammar.accept(insideDefVisitor)
  const insideDef = insideDefVisitor.result

  const afterDefWalker = new RestDefinitionFinderWalker(
    ruleGrammar,
    occurrence,
    prodType
  )
  const afterDef = afterDefWalker.startWalking()

  const insideFlat = new AlternativeGAST({ definition: insideDef })
  const afterFlat = new AlternativeGAST({ definition: afterDef })

  return lookAheadSequenceFromAlternatives([insideFlat, afterFlat], k)
}

export type Alternative = TokenType[][]

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
        otherTok.categoryMatchesMap![searchTok.tokenTypeIdx!] !== undefined
      if (matchingTokens === false) {
        continue compareOtherPath
      }
    }
    return true
  }

  return false
}
