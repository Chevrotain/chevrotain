import { IToken } from "@chevrotain/types";
import { EOF } from "../../scan/tokens_public";
import { TokenMatcher } from "../parser/parser";
import { MixedInParser } from "../parser/traits/parser_traits";
import { ATN, ATNState, ATN_RULE_STOP, AtomTransition, EpsilonTransition, RuleTransition, Transition } from "./atn";
import { ATNConfig, ATNConfigSet, DFA, DFAState, DFA_ERROR } from "./dfa";

export function createATNSimulator(parser: MixedInParser, atn: ATN, tokenMatcher: TokenMatcher): ATNSimulator {
	const decisionLength = atn.decisionStates.length
	const decisionToDFA: DFA[] = Array(decisionLength)
	for (let i = 0; i < decisionLength; i++) {
		decisionToDFA[i] = {
			atnStartState: atn.decisionStates[i],
			decision: i,
			precedenceDfa: false,
			states: new Map()
		}
	}
	return new ATNSimulator(parser, atn, tokenMatcher, decisionToDFA)
}

export class ATNSimulator {

	parser: MixedInParser
	atn: ATN
	decisionToDFA: DFA[]
	tokenMatcher: TokenMatcher

	constructor(parser: MixedInParser, atn: ATN, tokenMatcher: TokenMatcher, decisionToDFA: DFA[]) {
		this.parser = parser
		this.atn = atn
		this.tokenMatcher = tokenMatcher
		this.decisionToDFA = decisionToDFA
	}

	adaptivePredict(decision: number) {
		const dfa = this.decisionToDFA[decision]
		let start = dfa.start;
		if (start === undefined) {
			const closure = this.computeStartState(dfa.atnStartState as ATNState)
			start = this.addDFAState(dfa, this.newDFAState(closure))
			dfa.start = start
		}

		const alt = this.execATN(dfa, start)
		return alt
	}

	execATN(dfa: DFA, s0: DFAState): number | undefined {
		let previousD = s0

		let i = 1
		let t = this.parser.LA(i++)

		while (true) {
			let d = this.getExistingTargetState(previousD, t)
			if (d === undefined) {
				d = this.computeTargetState(dfa, previousD, t)
			}

			if (d === DFA_ERROR) {
				return undefined
			}

			if (d.isAcceptState === true) {
				return d.prediction
			}

			previousD = d
			t = this.parser.LA(i++)
		}
	}

	getExistingTargetState(state: DFAState, token: IToken): DFAState | undefined {
		return state.edges.get(token.tokenType)
	}

	computeTargetState(dfa: DFA, previousD: DFAState, token: IToken): DFAState {
		const reach = this.computeReachSet(previousD.configs, token)
		if (reach === undefined) {
			this.addDFAEdge(dfa, previousD, token, DFA_ERROR)
			return DFA_ERROR
		}

		const d = this.newDFAState(reach)
		const predictedAlt = this.getUniqueAlt(reach)

		if (predictedAlt !== undefined) {
			d.isAcceptState = true
			d.prediction = predictedAlt
			d.configs.uniqueAlt = predictedAlt
		} 
		// else if (hasConflictTerminatingPrediction(reach)) {

		// }

		this.addDFAEdge(dfa, previousD, token, d)
		return d
	}

	computeReachSet(closure: ATNConfigSet, token: IToken): ATNConfigSet | undefined {
		const intermediate = new ATNConfigSet()
		const skippedStopStates: ATNConfig[] = []
		const tokenEOF = token.tokenType == EOF

		for (const c of closure.elements) {
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
						state: target,
						alt: c.alt,
						followState: c.followState
					})
				}
			}
		}

		let reach: ATNConfigSet | undefined

		if (skippedStopStates.length === 0 && !tokenEOF) {
			if (intermediate.size === 1) {
				reach = intermediate
			} else if (this.getUniqueAlt(intermediate) !== undefined) {
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

		// TODO add EOF case

		if (skippedStopStates.length > 0 && !hasConfigInRuleStopState(reach)) {
			for (const c of skippedStopStates) {
				reach.add(c)
			}
		}

		if (reach.size === 0) {
			return undefined
		}
		return reach
	}

	getReachableTarget(transition: Transition, token: IToken): ATNState | undefined {
		if (transition.matches(token, this.tokenMatcher)) {
			return transition.target
		}
		return undefined
	}

	getUniqueAlt(configs: ATNConfigSet): number | undefined {
		let alt: number | undefined
		for (const c of configs.elements) {
			if (alt === undefined) {
				alt = c.alt
			} else if (alt !== c.alt) {
				return undefined
			}
		}
		return alt
	}

	newDFAState(closure: ATNConfigSet): DFAState {
		return {
			configs: closure,
			edges: new Map(),
			isAcceptState: false,
			prediction: -1,
			stateNumber: -1
		}
	}

	addDFAEdge(dfa: DFA, from: DFAState, token: IToken, to: DFAState): void {
		to = this.addDFAState(dfa, to)
		from.edges.set(token.tokenType, to)
	}

	addDFAState(dfa: DFA, state: DFAState): DFAState {
		if (state === DFA_ERROR) {
			return state
		}
		const existing = dfa.states.get(state)
		if (existing !== undefined) {
			return existing
		}
		state.stateNumber = dfa.states.size
		dfa.states.set(state, state)
		return state
	}

	computeStartState(atnState: ATNState): ATNConfigSet {
		const configs = new ATNConfigSet()

		const numberOfTransitions = atnState.transitions.length
		for (let i = 0; i < numberOfTransitions; i++) {
			const target = atnState.transitions[i].target
			const config: ATNConfig = {
				state: target,
				alt: i
			}
			this.closure(config, configs, new Set(), false)
		}

		return configs
	}

	closure(config: ATNConfig, configs: ATNConfigSet, closureBusy: Set<ATNConfig>, treatEofAsEpsilon: boolean): void {
		const p = config.state

		if (p.type === ATN_RULE_STOP) {
			if (config.followState) {
				const followState = config.followState
				const followConfig: ATNConfig = {
					state: followState,
					alt: config.alt
				}
				this.closure(followConfig, configs, closureBusy, treatEofAsEpsilon)
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
					// avoid infinite recursion for EOF* and EOF+
					continue
				}
				closureBusy.add(c)
				this.closure(c, configs, closureBusy, treatEofAsEpsilon)
			}
		}
	}

	getEpsilonTarget(config: ATNConfig, transition: Transition, treatEofAsEpsilon: boolean): ATNConfig | undefined {
		if (transition instanceof EpsilonTransition) {
			return {
				state: transition.target,
				alt: config.alt,
				followState: config.followState
			}
		} else if (transition instanceof RuleTransition) {
			return this.ruleTransition(config, transition)
		} else if (transition instanceof AtomTransition) {
			if (treatEofAsEpsilon && EOF === transition.tokenType) {
				return {
					state: transition.target,
					alt: config.alt,
					followState: config.followState
				}
			}
		}
		return undefined
	}

	ruleTransition(config: ATNConfig, transition: RuleTransition): ATNConfig {
		// const returnState = transition.followState
		return {
			state: transition.target,
			alt: config.alt,
			followState: transition.followState 
		}
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

// function hasConflictTerminatingPrediction(configs: ATNConfigSet): boolean {
// 	if (allConfigsInRuleStopStates(configs)) {
// 		return true
// 	}

// 	const alts = getConflictingAltSubsets(configs)
// 	const heuristic = hasConflictingAltSet(alts) && !hasStateAssociatedWithOneAlt(configs)
// 	return heuristic
// }

// function getConflictingAltSubsets(configs: ATNConfigSet): number[] {
// 	const alts = new Set<number>()
// 	const configToAlts = new Map<ATNConfig, number[]>()
// 	for (const c of configs.elements) {
// 		let cAlts = configToAlts.get(c)
// 		if (cAlts === undefined) {
// 			cAlts = []
// 			configToAlts.set(c, cAlts)
// 		}
// 		cAlts
// 	}
// }

function allConfigsInRuleStopStates(configs: ATNConfigSet): boolean {
	for (const c of configs.elements) {
		if (c.state.type !== ATN_RULE_STOP) {
			return false
		}
	}
	return true
}