import { TokenType } from "@chevrotain/types";
import map from "lodash/map";
import { ATNState, DecisionState } from "./atn";

export interface DFA {
	start?: DFAState
	states: Map<DFAState, DFAState>
	decision: number
	atnStartState: DecisionState
	precedenceDfa: boolean
}

export interface DFAState {
	stateNumber: number
	configs: ATNConfigSet
	edges: Map<TokenType, DFAState>
	isAcceptState: boolean
	prediction: number
}

export const DFA_ERROR = {} as DFAState

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
		return map(this.configs, e => e.state)
	}

	get alts(): number[] {
		return map(this.configs, e => e.alt)
	}

	private atnConfigToString(config: ATNConfig) {
		return `${config.state.stateNumber}_${config.alt}`
	}

}