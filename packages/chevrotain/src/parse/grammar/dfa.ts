import map from "lodash/map"
import { ATNState, DecisionState } from "./atn"

export interface DFA {
  start?: DFAState
  states: Record<string, DFAState>
  decision: number
  atnStartState: DecisionState
}

export interface DFAState {
  configs: ATNConfigSet
  edges: Record<number, DFAState>
  isAcceptState: boolean
  prediction: number
}

export const DFA_ERROR = {} as DFAState

export interface ATNConfig {
  state: ATNState
  alt: number
  stack: ATNState[]
}

export class ATNConfigSet {
  private map: Record<string, number> = {}
  private configs: ATNConfig[] = []

  uniqueAlt: number | undefined

  get size(): number {
    return this.configs.length
  }

  add(config: ATNConfig): void {
    this.map[getATNConfigKey(config)] = this.configs.length
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

  get key(): string {
    let value = ""
    for (const k in this.map) {
      value += k + ":"
    }
    return value
  }
}

export function getATNConfigKey(config: ATNConfig) {
	return `${config.state.stateNumber}_${config.alt}:${config.stack.map(e => e.stateNumber.toString()).join('_')}`;
}
