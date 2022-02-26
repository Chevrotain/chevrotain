import {
  buildLookaheadFuncForOptionalProd,
  buildLookaheadFuncForOr,
  PROD_TYPE
} from "../../grammar/lookahead"
import forEach from "lodash/forEach"
import has from "lodash/has"
import { DEFAULT_PARSER_CONFIG } from "../parser"
import { IParserConfig, IProduction } from "@chevrotain/types"
import {
  AT_LEAST_ONE_IDX,
  AT_LEAST_ONE_SEP_IDX,
  getKeyForAutomaticLookahead,
  MANY_IDX,
  MANY_SEP_IDX,
  OPTION_IDX,
  OR_IDX
} from "../../grammar/keys"
import { MixedInParser } from "./parser_traits"
import {
  Alternation,
  GAstVisitor,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule
} from "@chevrotain/gast"
import { getProductionDslName } from "@chevrotain/gast"
import { createATN, DecisionState } from "../../grammar/atn"

/**
 * Trait responsible for the lookahead related utilities and optimizations.
 */
export class LooksAhead {
  maxLookahead: number
  lookAheadFuncsCache: any
  dynamicTokensEnabled: boolean

  initLooksAhead(config: IParserConfig) {
    this.dynamicTokensEnabled = has(config, "dynamicTokensEnabled")
      ? (config.dynamicTokensEnabled as boolean) // assumes end user provides the correct config value/type
      : DEFAULT_PARSER_CONFIG.dynamicTokensEnabled

    this.maxLookahead = has(config, "maxLookahead")
      ? (config.maxLookahead as number) // assumes end user provides the correct config value/type
      : DEFAULT_PARSER_CONFIG.maxLookahead

    this.lookAheadFuncsCache = new Map()
  }

  preComputeLookaheadFunctions(this: MixedInParser, rules: Rule[]): void {
    const atn = createATN(rules)
    this.initATNSimulator(atn)
    forEach(rules, (currRule) => {
      const {
        alternation,
        repetition,
        option,
        repetitionMandatory,
        repetitionMandatoryWithSeparator,
        repetitionWithSeparator
      } = collectMethods(currRule)

      forEach(alternation, (currProd) => {
        const atnState = currProd.atnState as DecisionState
        const decisionIndex = atnState.decision
        const laFunc = buildLookaheadFuncForOr(
          currRule,
          currProd.idx,
          decisionIndex,
          currProd.hasPredicates,
          this.dynamicTokensEnabled
        )
        const key = getKeyForAutomaticLookahead(
          this.fullRuleNameToShort[currRule.name],
          OR_IDX,
          currProd.idx
        )
        this.setLaFuncCache(key, laFunc)
      })

      forEach(repetition, (currProd) => {
        this.computeLookaheadFunc(
          currRule,
          currProd,
          currProd.idx,
          MANY_IDX,
          PROD_TYPE.REPETITION,
          getProductionDslName(currProd)
        )
      })

      forEach(option, (currProd) => {
        this.computeLookaheadFunc(
          currRule,
          currProd,
          currProd.idx,
          OPTION_IDX,
          PROD_TYPE.OPTION,
          getProductionDslName(currProd)
        )
      })

      forEach(repetitionMandatory, (currProd) => {
        this.computeLookaheadFunc(
          currRule,
          currProd,
          currProd.idx,
          AT_LEAST_ONE_IDX,
          PROD_TYPE.REPETITION_MANDATORY,
          getProductionDslName(currProd)
        )
      })

      forEach(repetitionMandatoryWithSeparator, (currProd) => {
        this.computeLookaheadFunc(
          currRule,
          currProd,
          currProd.idx,
          AT_LEAST_ONE_SEP_IDX,
          PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
          getProductionDslName(currProd)
        )
      })

      forEach(repetitionWithSeparator, (currProd) => {
        this.computeLookaheadFunc(
          currRule,
          currProd,
          currProd.idx,
          MANY_SEP_IDX,
          PROD_TYPE.REPETITION_WITH_SEPARATOR,
          getProductionDslName(currProd)
        )
      })
    })
  }

  computeLookaheadFunc(
    this: MixedInParser,
    rule: Rule,
    prod: IProduction,
    prodOccurrence: number,
    prodKey: number,
    prodType: PROD_TYPE,
    dslMethodName: string
  ): void {
    this.TRACE_INIT(
      `${dslMethodName}${prodOccurrence === 0 ? "" : prodOccurrence}`,
      () => {
        const atnState = prod.atnState as DecisionState
        const laFunc = buildLookaheadFuncForOptionalProd(
          rule,
          prodOccurrence,
          prodType,
          atnState.decision,
          this.dynamicTokensEnabled
        )
        const key = getKeyForAutomaticLookahead(
          this.fullRuleNameToShort[rule.name],
          prodKey,
          prodOccurrence
        )
        this.setLaFuncCache(key, laFunc)
      }
    )
  }

  // this actually returns a number, but it is always used as a string (object prop key)
  getKeyForAutomaticLookahead(
    this: MixedInParser,
    dslMethodIdx: number,
    occurrence: number
  ): number {
    const currRuleShortName: any = this.getLastExplicitRuleShortName()
    return getKeyForAutomaticLookahead(
      currRuleShortName,
      dslMethodIdx,
      occurrence
    )
  }

  getLaFuncFromCache(this: MixedInParser, key: number): Function {
    return this.lookAheadFuncsCache.get(key)
  }

  /* istanbul ignore next */
  setLaFuncCache(this: MixedInParser, key: number, value: Function): void {
    this.lookAheadFuncsCache.set(key, value)
  }
}

class DslMethodsCollectorVisitor extends GAstVisitor {
  public dslMethods: {
    option: Option[]
    alternation: Alternation[]
    repetition: Repetition[]
    repetitionWithSeparator: RepetitionWithSeparator[]
    repetitionMandatory: RepetitionMandatory[]
    repetitionMandatoryWithSeparator: RepetitionMandatoryWithSeparator[]
  } = {
    option: [],
    alternation: [],
    repetition: [],
    repetitionWithSeparator: [],
    repetitionMandatory: [],
    repetitionMandatoryWithSeparator: []
  }

  reset() {
    this.dslMethods = {
      option: [],
      alternation: [],
      repetition: [],
      repetitionWithSeparator: [],
      repetitionMandatory: [],
      repetitionMandatoryWithSeparator: []
    }
  }

  public visitOption(option: Option): void {
    this.dslMethods.option.push(option)
  }

  public visitRepetitionWithSeparator(manySep: RepetitionWithSeparator): void {
    this.dslMethods.repetitionWithSeparator.push(manySep)
  }

  public visitRepetitionMandatory(atLeastOne: RepetitionMandatory): void {
    this.dslMethods.repetitionMandatory.push(atLeastOne)
  }

  public visitRepetitionMandatoryWithSeparator(
    atLeastOneSep: RepetitionMandatoryWithSeparator
  ): void {
    this.dslMethods.repetitionMandatoryWithSeparator.push(atLeastOneSep)
  }

  public visitRepetition(many: Repetition): void {
    this.dslMethods.repetition.push(many)
  }

  public visitAlternation(or: Alternation): void {
    this.dslMethods.alternation.push(or)
  }
}

const collectorVisitor = new DslMethodsCollectorVisitor()
export function collectMethods(rule: Rule): {
  option: Option[]
  alternation: Alternation[]
  repetition: Repetition[]
  repetitionWithSeparator: RepetitionWithSeparator[]
  repetitionMandatory: RepetitionMandatory[]
  repetitionMandatoryWithSeparator: RepetitionMandatoryWithSeparator[]
} {
  collectorVisitor.reset()
  rule.accept(collectorVisitor)
  const dslMethods = collectorVisitor.dslMethods
  // avoid uncleaned references
  collectorVisitor.reset()
  return <any>dslMethods
}
