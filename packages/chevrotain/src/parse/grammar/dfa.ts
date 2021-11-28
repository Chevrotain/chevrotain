import { DecisionState } from "./atn";

export interface DFA {
	states: Map<DFAState, DFAState>
	decision: number
	atnStartState: DecisionState
	precedenceDfa: boolean
}

export interface DFAState {
	stateNumber: number
	// configs: ATNConfigSet
	edges: DFAState[]
	isAcceptState: boolean
	prediction: number
}