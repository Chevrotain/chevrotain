import { IToken } from "@chevrotain/types"
import { tokenStructuredMatcher } from "../../../scan/tokens"
import { PredicateSet } from "../../../parse/grammar/lookahead"
import { MixedInParser } from "./parser_traits"
import {
  ATN,
  ATNState,
  ATN_RULE_STOP,
  AtomTransition,
  DecisionState,
  EpsilonTransition,
  RuleTransition,
  Transition
} from "../../grammar/atn"
import {
  ATNConfig,
  ATNConfigSet,
  DFA,
  DFAState,
  DFA_ERROR,
  getATNConfigKey
} from "../../grammar/dfa"
import min from "lodash/min"

type DFACache = (predicateSet: PredicateSet) => DFA

function createDFACache(startState: DecisionState, decision: number): DFACache {
  const map: Record<string, DFA | undefined> = {}
  return (predicateSet) => {
    const key = predicateSet.toString()
    let existing = map[key]
    if (existing !== undefined) {
      return existing
    } else {
      existing = {
        atnStartState: startState,
        decision,
        states: {}
      }
      map[key] = existing
      return existing
    }
  }
}

export class ATNSimulator {
  decisionToDFA: DFACache[]

  initATNSimulator(atn: ATN): void {
    const decisionLength = atn.decisionStates.length
    this.decisionToDFA = Array(decisionLength)
    for (let i = 0; i < decisionLength; i++) {
      this.decisionToDFA[i] = createDFACache(atn.decisionStates[i], i)
    }
  }

  adaptivePredict(
    this: MixedInParser,
    decision: number,
    predicateSet: PredicateSet
  ) {
    const dfa = this.decisionToDFA[decision](predicateSet)
    let start = dfa.start
    if (start === undefined) {
      const closure = computeStartState(dfa.atnStartState as ATNState)
      start = addDFAState(dfa, newDFAState(closure))
      dfa.start = start
    }

    const alt = this.execATN(dfa, start, predicateSet)
    return alt
  }

  execATN(
    this: MixedInParser,
    dfa: DFA,
    s0: DFAState,
    predicateSet: PredicateSet
  ): number | undefined {
    let previousD = s0

    let i = 1
    let t = this.LA(i++)

    while (true) {
      let d = getExistingTargetState(previousD, t)
      if (d === undefined) {
        d = computeTargetState(dfa, previousD, t, predicateSet)
      }

      if (d === DFA_ERROR) {
        return undefined
      }

      if (d.isAcceptState === true) {
        return d.prediction
      }

      previousD = d
      t = this.LA(i++)
    }
  }
}

function getExistingTargetState(
  state: DFAState,
  token: IToken
): DFAState | undefined {
  return state.edges[token.tokenTypeIdx]
}

function computeTargetState(
  dfa: DFA,
  previousD: DFAState,
  token: IToken,
  predicateSet: PredicateSet
): DFAState {
  const reach = computeReachSet(previousD.configs, token, predicateSet)
  if (reach.size === 0) {
    addDFAEdge(dfa, previousD, token, DFA_ERROR)
    return DFA_ERROR
  }

  let newState = newDFAState(reach)
  const predictedAlt = getUniqueAlt(reach, predicateSet)

  if (predictedAlt !== undefined) {
    newState.isAcceptState = true
    newState.prediction = predictedAlt
    newState.configs.uniqueAlt = predictedAlt
  } else if (hasConflictTerminatingPrediction(reach)) {
    const prediction = min(reach.alts)!
    newState.isAcceptState = true
    newState.prediction = prediction
    newState.configs.uniqueAlt = prediction
  }

  newState = addDFAEdge(dfa, previousD, token, newState)
  return newState
}

function computeReachSet(
  configs: ATNConfigSet,
  token: IToken,
  predicateSet: PredicateSet
): ATNConfigSet {
  const intermediate = new ATNConfigSet()
  const skippedStopStates: ATNConfig[] = []

  for (const c of configs.elements) {
    if (predicateSet.is(c.alt) === false) {
      continue
    }
    if (c.state.type === ATN_RULE_STOP) {
      skippedStopStates.push(c)
      continue
    }
    const transitionLength = c.state.transitions.length
    for (let i = 0; i < transitionLength; i++) {
      const transition = c.state.transitions[i]
      const target = getReachableTarget(transition, token)
      if (target !== undefined) {
        intermediate.add({
          state: target,
          alt: c.alt,
          stack: c.stack
        })
      }
    }
  }

  let reach: ATNConfigSet | undefined

  if (skippedStopStates.length === 0 && intermediate.size === 1) {
    reach = intermediate
  }

  if (reach === undefined) {
    reach = new ATNConfigSet()
    for (const c of intermediate.elements) {
      closure(c, reach)
    }
  }

  if (skippedStopStates.length > 0 && !hasConfigInRuleStopState(reach)) {
    for (const c of skippedStopStates) {
      reach.add(c)
    }
  }

  return reach
}

function getReachableTarget(
  transition: Transition,
  token: IToken
): ATNState | undefined {
  if (
    transition instanceof AtomTransition &&
    tokenStructuredMatcher(token, transition.tokenType)
  ) {
    return transition.target
  }
  return undefined
}

function getUniqueAlt(
  configs: ATNConfigSet,
  predicateSet: PredicateSet
): number | undefined {
  let alt: number | undefined
  for (const c of configs.elements) {
    if (predicateSet.is(c.alt) === true) {
      if (alt === undefined) {
        alt = c.alt
      } else if (alt !== c.alt) {
        return undefined
      }
    }
  }
  return alt
}

function newDFAState(closure: ATNConfigSet): DFAState {
  return {
    configs: closure,
    edges: {},
    isAcceptState: false,
    prediction: -1
  }
}

function addDFAEdge(
  dfa: DFA,
  from: DFAState,
  token: IToken,
  to: DFAState
): DFAState {
  to = addDFAState(dfa, to)
  from.edges[token.tokenTypeIdx] = to
  return to
}

function addDFAState(dfa: DFA, state: DFAState): DFAState {
  if (state === DFA_ERROR) {
    return state
  }
  // Repetitions have the same config set
  // Therefore, storing the key of the config in a map allows us to create a loop in our DFA
  const mapKey = state.configs.key
  const existing = dfa.states[mapKey]
  if (existing !== undefined) {
    return existing
  }
  state.configs.finalize()
  dfa.states[mapKey] = state
  return state
}

function computeStartState(atnState: ATNState): ATNConfigSet {
  const configs = new ATNConfigSet()

  const numberOfTransitions = atnState.transitions.length
  for (let i = 0; i < numberOfTransitions; i++) {
    const target = atnState.transitions[i].target
    const config: ATNConfig = {
      state: target,
      alt: i,
      stack: []
    }
    closure(config, configs)
  }

  return configs
}

function closure(config: ATNConfig, configs: ATNConfigSet): void {
  const p = config.state

  if (p.type === ATN_RULE_STOP) {
    if (config.stack.length > 0) {
      const atnStack = [...config.stack]
      const followState = atnStack.pop()!
      const followConfig: ATNConfig = {
        state: followState,
        alt: config.alt,
        stack: atnStack
      }
      closure(followConfig, configs)
    } else {
      // Dipping into outer context, simply add the config
      // This will stop computation once every config is at the rule stop state
      configs.add(config)
    }
    return
  }

  if (!p.epsilonOnlyTransitions) {
    configs.add(config)
  }

  const transitionLength = p.transitions.length
  for (let i = 0; i < transitionLength; i++) {
    const transition = p.transitions[i]
    const c = getEpsilonTarget(config, transition)

    if (c !== undefined) {
      closure(c, configs)
    }
  }
}

function getEpsilonTarget(
  config: ATNConfig,
  transition: Transition
): ATNConfig | undefined {
  if (transition instanceof EpsilonTransition) {
    return {
      state: transition.target,
      alt: config.alt,
      stack: config.stack
    }
  } else if (transition instanceof RuleTransition) {
    const stack = [...config.stack, transition.followState]
    return {
      state: transition.target,
      alt: config.alt,
      stack
    }
  }
  return undefined
}

function hasConfigInRuleStopState(configs: ATNConfigSet): boolean {
  for (const c of configs.elements) {
    if (c.state.type === ATN_RULE_STOP) {
      return true
    }
  }
  return false
}

function allConfigsInRuleStopStates(configs: ATNConfigSet): boolean {
  for (const c of configs.elements) {
    if (c.state.type !== ATN_RULE_STOP) {
      return false
    }
  }
  return true
}

function hasConflictTerminatingPrediction(configs: ATNConfigSet): boolean {
  if (allConfigsInRuleStopStates(configs)) {
    return true
  }
  const altSets = getConflictingAltSets(configs.elements)
  const heuristic =
    hasConflictingAltSet(altSets) && !hasStateAssociatedWithOneAlt(altSets)
  return heuristic
}

function getConflictingAltSets(
  configs: readonly ATNConfig[]
): Map<string, Record<number, boolean>> {
  const configToAlts = new Map<string, Record<number, boolean>>()
  for (const c of configs) {
    const key = getATNConfigKey(c, false)
    let alts = configToAlts.get(key)
    if (alts === undefined) {
      alts = {}
      configToAlts.set(key, alts)
    }
    alts[c.alt] = true
  }
  return configToAlts
}

function hasConflictingAltSet(
  altSets: Map<string, Record<number, boolean>>
): boolean {
  for (const value of Array.from(altSets.values())) {
    if (Object.keys(value).length > 1) {
      return true
    }
  }
  return false
}

function hasStateAssociatedWithOneAlt(
  altSets: Map<string, Record<number, boolean>>
): boolean {
  for (const value of Array.from(altSets.values())) {
    if (Object.keys(value).length === 1) {
      return true
    }
  }
  return false
}
