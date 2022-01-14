import { IToken, TokenType } from "@chevrotain/types"
import { tokenStructuredMatcher } from "../../scan/tokens"
import { EOF } from "../../scan/tokens_public"
import { MixedInParser } from "../parser/traits/parser_traits"
import {
  ATN,
  ATNState,
  ATN_RULE_STOP,
  AtomTransition,
  DecisionState,
  EpsilonTransition,
  RuleTransition,
  Transition
} from "./atn"
import { ATNConfig, ATNConfigSet, DFA, DFAState, DFA_ERROR } from "./dfa"
import min from "lodash/min"
import map from "lodash/map"
import { Predicate } from "../parser/parser"

export function createATNSimulator(
  parser: MixedInParser,
  atn: ATN
): ATNSimulator {
  const decisionLength = atn.decisionStates.length
  const decisionToDFA: DFACache[] = Array(decisionLength)
  for (let i = 0; i < decisionLength; i++) {
    decisionToDFA[i] = createDFAFactory(atn.decisionStates[i], i)
  }
  return new ATNSimulator(parser, atn, decisionToDFA)
}

export class PredicateSet {
  private predicates: boolean[] = []

  get size(): number {
    return this.predicates.length
  }

  is(index: number): boolean {
    return index >= this.predicates.length === true
      ? true
      : this.predicates[index]
  }

  set(index: number, value: boolean) {
    this.predicates[index] = value
  }

  toString(): string {
    let value = ""
    for (const predicate of this.predicates) {
      value += predicate ? "1" : "0"
    }
    return value
  }
}

export type DFACache = (predicateSet: PredicateSet) => DFA

function createDFAFactory(
  startState: DecisionState,
  decision: number
): DFACache {
  const map = new Map<string, DFA>()
  return (predicateSet) => {
    const key = predicateSet.toString()
    let existing = map.get(key)
    if (existing !== undefined) {
      return existing
    } else {
      existing = {
        atnStartState: startState,
        decision,
        states: new Map()
      }
      map.set(key, existing)
      return existing
    }
  }
}

export class ATNSimulator {
  parser: MixedInParser
  atn: ATN
  decisionToDFA: DFACache[]

  constructor(parser: MixedInParser, atn: ATN, decisionToDFA: DFACache[]) {
    this.parser = parser
    this.atn = atn
    this.decisionToDFA = decisionToDFA
  }

  adaptivePredict(decision: number, predicateSet: PredicateSet) {
    const dfa = this.decisionToDFA[decision](predicateSet)
    let start = dfa.start
    if (start === undefined) {
      const closure = this.computeStartState(dfa.atnStartState as ATNState)
      start = this.addDFAState(dfa, this.newDFAState(closure))
      dfa.start = start
    }

    const alt = this.execATN(dfa, start, predicateSet)
    return alt
  }

  execATN(
    dfa: DFA,
    s0: DFAState,
    predicateSet: PredicateSet
  ): number | undefined {
    let previousD = s0

    let i = 1
    let t = this.parser.LA(i++)

    while (true) {
      let d = this.getExistingTargetState(previousD, t)
      if (d === undefined) {
        d = this.computeTargetState(dfa, previousD, t, predicateSet)
      }

      if (d === DFA_ERROR) {
        return undefined
      }

      if (d.isAcceptState === true) {
        return d.prediction
      } else if (t.tokenType === EOF) {
        // If EOF does not result in an accepting state
        // return undefined which will result in a NoViableAltException
        return undefined
      }

      previousD = d
      t = this.parser.LA(i++)
    }
  }

  getExistingTargetState(state: DFAState, token: IToken): DFAState | undefined {
    return state.edges[token.tokenTypeIdx]
  }

  computeTargetState(
    dfa: DFA,
    previousD: DFAState,
    token: IToken,
    predicateSet: PredicateSet
  ): DFAState {
    const reach = this.computeReachSet(previousD.configs, token, predicateSet)
    if (reach.size === 0) {
      this.addDFAEdge(dfa, previousD, token, DFA_ERROR)
      return DFA_ERROR
    }

    let newState = this.newDFAState(reach)
    const predictedAlt = this.getUniqueAlt(reach, predicateSet)

    if (predictedAlt !== undefined) {
      newState.isAcceptState = true
      newState.prediction = predictedAlt
      newState.configs.uniqueAlt = predictedAlt
    } else if (hasConflictTerminatingPrediction(reach)) {
      const prediction = min(map(reach.elements, (e) => e.alt))!
      newState.isAcceptState = true
      newState.prediction = prediction
      newState.configs.uniqueAlt = prediction
    }

    newState = this.addDFAEdge(dfa, previousD, token, newState)
    return newState
  }

  computeReachSet(
    closure: ATNConfigSet,
    token: IToken,
    predicateSet: PredicateSet
  ): ATNConfigSet {
    const intermediate = new ATNConfigSet()
    const skippedStopStates: ATNConfig[] = []
    const tokenEOF = token.tokenType == EOF

    for (const c of closure.elements) {
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
        const target = this.getReachableTarget(transition, token)
        if (target !== undefined) {
          intermediate.add({
            state: target.state,
            alt: c.alt,
            stack: c.stack
          })
        }
      }
    }

    let reach: ATNConfigSet | undefined

    if (skippedStopStates.length === 0 && !tokenEOF) {
      if (intermediate.size === 1) {
        reach = intermediate
      } else if (this.getUniqueAlt(intermediate, predicateSet) !== undefined) {
        reach = intermediate
      }
    }

    if (reach === undefined) {
      reach = new ATNConfigSet()
      const closureBusy = new Set<ATNConfig>()
      for (const c of intermediate.elements) {
        this.closure(c, reach, closureBusy, tokenEOF)
      }
    }

    if (skippedStopStates.length > 0 && !hasConfigInRuleStopState(reach)) {
      for (const c of skippedStopStates) {
        reach.add(c)
      }
    }

    return reach
  }

  getReachableTarget(
    transition: Transition,
    token: IToken
  ): { state: ATNState; type: TokenType } | undefined {
    if (
      transition instanceof AtomTransition &&
      tokenStructuredMatcher(token, transition.tokenType)
    ) {
      return {
        state: transition.target,
        type: transition.tokenType
      }
    }
    return undefined
  }

  getUniqueAlt(
    configs: ATNConfigSet,
    predicateSet: PredicateSet
  ): number | undefined {
    let alt: number | undefined
    for (const c of configs.elements) {
      if (predicateSet.is(c.alt)) {
        if (alt === undefined) {
          alt = c.alt
        } else if (alt !== c.alt) {
          return undefined
        }
      }
    }
    return alt
  }

  newDFAState(closure: ATNConfigSet): DFAState {
    return {
      configs: closure,
      edges: {},
      isAcceptState: false,
      prediction: -1,
      stateNumber: -1
    }
  }

  addDFAEdge(dfa: DFA, from: DFAState, token: IToken, to: DFAState): DFAState {
    to = this.addDFAState(dfa, to)
    from.edges[token.tokenTypeIdx] = to
    return to
  }

  addDFAState(dfa: DFA, state: DFAState): DFAState {
    if (state === DFA_ERROR) {
      return state
    }
    // Repetitions have the same config set
    // Therefore, storing the key of the config in a map allows us to create a loop in our DFA
    const mapKey = state.configs.key
    const existing = dfa.states.get(mapKey)
    if (existing !== undefined) {
      return existing
    }
    state.stateNumber = dfa.states.size
    dfa.states.set(mapKey, state)
    return state
  }

  computeStartState(atnState: ATNState): ATNConfigSet {
    const configs = new ATNConfigSet()

    const numberOfTransitions = atnState.transitions.length
    for (let i = 0; i < numberOfTransitions; i++) {
      const target = atnState.transitions[i].target
      const config: ATNConfig = {
        state: target,
        alt: i,
        stack: []
      }
      this.closure(config, configs, new Set(), false)
    }

    return configs
  }

  closure(
    config: ATNConfig,
    configs: ATNConfigSet,
    closureBusy: Set<ATNConfig>,
    treatEofAsEpsilon: boolean
  ): void {
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
        this.closure(followConfig, configs, closureBusy, treatEofAsEpsilon)
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
      const c = this.getEpsilonTarget(config, transition, treatEofAsEpsilon)

      if (c !== undefined) {
        if (!transition.isEpsilon() && closureBusy.has(c)) {
          // avoid infinite recursion for Epsilon* and Epsilon+
          continue
        }
        closureBusy.add(c)
        this.closure(c, configs, closureBusy, treatEofAsEpsilon)
      }
    }
  }

  getEpsilonTarget(
    config: ATNConfig,
    transition: Transition,
    treatEofAsEpsilon: boolean
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
    } else if (transition instanceof AtomTransition) {
      if (treatEofAsEpsilon && EOF === transition.tokenType) {
        return {
          state: transition.target,
          alt: config.alt,
          stack: config.stack
        }
      }
    }
    return undefined
  }
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
  configs: ATNConfig[]
): Map<string, Record<number, boolean>> {
  const configToAlts = new Map<string, Record<number, boolean>>()
  for (const c of configs) {
    const key = getATNConfigKey(c)
    let alts = configToAlts.get(key)
    if (alts === undefined) {
      alts = {}
      configToAlts.set(key, alts)
    }
    alts[c.alt] = true
  }
  return configToAlts
}

function getATNConfigKey(config: ATNConfig): string {
  // Add the full rule stack to the config key
  // That way, we don't accidentally generate false positives with the heuristic
  return (
    config.state.stateNumber +
    "_" +
    config.stack.map((e) => e.stateNumber.toString()).join("_")
  )
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
