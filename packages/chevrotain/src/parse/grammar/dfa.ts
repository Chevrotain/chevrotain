import map from "lodash/map"
import { ATNState, DecisionState } from "./atn"

export interface DFA {
  start?: DFAState
  states: Map<string, DFAState>
  decision: number
  atnStartState: DecisionState
}

export interface DFAState {
  stateNumber: number
  configs: ATNConfigSet
  edges: Map<number, DFAState>
  isAcceptState: boolean
  prediction: number
}

export const DFA_ERROR = {} as DFAState

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

export interface ATNConfig {
  state: ATNState
  alt: number
  followState?: ATNState
}

export class ATNConfigSet {
  private map = new Map<string, number>()
  private configs: ATNConfig[] = []

  uniqueAlt: number | undefined

  get size(): number {
    return this.configs.length
  }

  add(config: ATNConfig): void {
    this.map.set(this.atnConfigToString(config), this.configs.length)
    this.configs.push(config)
  }

  get(index: number): ATNConfig {
    return this.configs[index]
  }

  get elements(): ATNConfig[] {
    return this.configs
  }

  get states(): ATNState[] {
    return map(this.configs, (e) => e.state)
  }

  get alts(): number[] {
    return map(this.configs, (e) => e.alt)
  }

  private atnConfigToString(config: ATNConfig) {
    return `${config.state.stateNumber}_${config.alt}`
  }

  get key(): string {
    return Array.from(this.map.keys()).join(":")
  }
}
