import {
  buildAlternativesLookAheadFunc,
  buildDFALookaheadFuncForOptionalProd,
  buildDFALookaheadFuncForOr,
  buildLookaheadFuncForOptionalProd,
  buildLookaheadFuncForOr,
  buildSingleAlternativeLookaheadFunction,
  PROD_TYPE
} from "../../grammar/lookahead"
import forEach from "lodash/forEach"
import has from "lodash/has"
import {
  DEFAULT_PARSER_CONFIG,
  LookAheadSequence,
  TokenMatcher
} from "../parser"
import { IOrAlt, IParserConfig, IProduction } from "@chevrotain/types"
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
import { Rule } from "../../grammar/gast/gast_public"
import { collectMethods, getProductionDslName } from "../../grammar/gast/gast"
import { ATN, ATNState, ATN_RULE_STOP, AtomTransition, createATN, DecisionState, EpsilonTransition, RuleTransition, Transition } from "../../grammar/atn"
import { ATNSimulator, createATNSimulator } from "../../grammar/atn_simulator"
// import * as fs from 'fs'

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
    // printATN(atn, rules)
    const atnSimulator = createATNSimulator(this, atn)
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
        const laFunc = buildDFALookaheadFuncForOr(atnSimulator, decisionIndex, currProd, currProd.maxLookahead || this.maxLookahead, currProd.hasPredicates, this.dynamicTokensEnabled)
        const key = getKeyForAutomaticLookahead(
          this.fullRuleNameToShort[currRule.name],
          OR_IDX,
          currProd.idx
        )
        this.setLaFuncCache(key, laFunc)
      })

      forEach(repetition, (currProd) => {
        this.computeLookaheadFunc(
          atnSimulator,
          currRule,
          currProd,
          currProd.idx,
          MANY_IDX,
		      PROD_TYPE.REPETITION,
          currProd.maxLookahead,
          getProductionDslName(currProd)
        )
      })

      forEach(option, (currProd) => {
        this.computeLookaheadFunc(
          atnSimulator,
          currRule,
          currProd,
          currProd.idx,
          OPTION_IDX,
		      PROD_TYPE.OPTION,
          currProd.maxLookahead,
          getProductionDslName(currProd)
        )
      })

      forEach(repetitionMandatory, (currProd) => {
        this.computeLookaheadFunc(
          atnSimulator,
          currRule,
          currProd,
          currProd.idx,
          AT_LEAST_ONE_IDX,
		      PROD_TYPE.REPETITION_MANDATORY,
          currProd.maxLookahead,
          getProductionDslName(currProd)
        )
      })

      forEach(repetitionMandatoryWithSeparator, (currProd) => {
        this.computeLookaheadFunc(
          atnSimulator,
          currRule,
          currProd,
          currProd.idx,
          AT_LEAST_ONE_SEP_IDX,
		      PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR,
          currProd.maxLookahead,
          getProductionDslName(currProd)
        )
      })

      forEach(repetitionWithSeparator, (currProd) => {
        this.computeLookaheadFunc(
          atnSimulator,
          currRule,
          currProd,
          currProd.idx,
          MANY_SEP_IDX,
		      PROD_TYPE.REPETITION_WITH_SEPARATOR,
          currProd.maxLookahead,
          getProductionDslName(currProd)
        )
      })
	  })
  }

  computeLookaheadFunc(
    this: MixedInParser,
    atnSimulator: ATNSimulator,
    rule: Rule,
	  prod: IProduction,
    prodOccurrence: number,
    prodKey: number,
    prodType: PROD_TYPE,
    prodMaxLookahead: number | undefined,
    dslMethodName: string
  ): void {
    this.TRACE_INIT(
      `${dslMethodName}${prodOccurrence === 0 ? "" : prodOccurrence}`,
      () => {
        const atnState = prod.atnState as DecisionState
        const laFunc = buildDFALookaheadFuncForOptionalProd(
          atnSimulator,
          rule,
          prodOccurrence,
          prodType,
          atnState.decision,
          prodMaxLookahead ?? this.maxLookahead,
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

  lookAheadBuilderForOptional(
    this: MixedInParser,
    alt: LookAheadSequence,
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
    alts: LookAheadSequence[],
    hasPredicates: boolean,
    tokenMatcher: TokenMatcher,
    dynamicTokensEnabled: boolean
  ): (orAlts: IOrAlt<any>[]) => number | undefined {
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

function printATN(atn: ATN, rules: Rule[]) {
	let text = "digraph G {\n"
	rules.forEach((rule, i) => {
		const startState = atn.ruleToStartState.get(rule)!
		iterateOverStates(startState, e => text += buildState(atn, i, e))
		iterateOverTransitions(startState, (state, transition, index) => text += buildTransition(atn, i, state, transition, index))
	})
	text += "}"
	// fs.writeFileSync('/workspace/chevrotain/atn.dot', text)
}

function iterateOverStates(atnState: ATNState, action: (state: ATNState) => void, visited: Set<ATNState> = new Set()): void {
	action(atnState)
	for (const transition of atnState.transitions) {
		const target = getTarget(transition)
		if (!visited.has(target)) {
			visited.add(target)
			iterateOverStates(target, action, visited)
		}
	}
}

function iterateOverTransitions(atnState: ATNState, action: (startState: ATNState, transition: Transition, i: number) => void, visited: Set<ATNState> = new Set()): void {
  atnState.transitions.forEach((transition, i) => {
    action(atnState, transition, i)
  })
	for (const transition of atnState.transitions) {
		const target = getTarget(transition)
		if (!visited.has(target)) {
			visited.add(target)
			iterateOverTransitions(target, action, visited)
		}
	}
}

function buildTransition(atn: ATN, ruleIndex: number, state: ATNState, transition: Transition, index: number): string {
	const name = stateName(atn, state)
	const targetName = stateName(atn, getTarget(transition))
	return `node_${ruleIndex}_${name} -> node_${ruleIndex}_${targetName} [label="${transitionName(transition)}@${index}"]\n`
}

function buildState(atn: ATN, ruleIndex: number, state: ATNState): string {
	const name = stateName(atn, state)
	let attributes = ""
	if (state.type === ATN_RULE_STOP) {
		attributes = " peripheries=2"
	}
	return `node_${ruleIndex}_${name}[label="${name}"${attributes}]\n`
}

function stateName(atn: ATN, state: ATNState): string {
	return "P" + (atn.states.indexOf(state) + 1);
}

function getTarget(transition: Transition): ATNState {
	return transition instanceof RuleTransition ? transition.followState : transition.target
}

function transitionName(transition: Transition): string {
	if (transition instanceof EpsilonTransition) {
		return "ε"
	} else if (transition instanceof RuleTransition) {
		return transition.rule.name
	} else if (transition instanceof AtomTransition) {
		return transition.tokenType.name
	} else {
		return ""
	}
}