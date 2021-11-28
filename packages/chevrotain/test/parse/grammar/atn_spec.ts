import { createToken } from "../../../src/scan/tokens_public"
import {
	Alternation,
	Alternative,
	NonTerminal,
	Option,
	Repetition,
	RepetitionMandatory,
	RepetitionMandatoryWithSeparator,
	RepetitionWithSeparator,
	Rule,
	Terminal
} from "../../../src/parse/grammar/gast/gast_public"
import { ATN, ATNState, ATN_RULE_STOP, AtomTransition, createATN, EpsilonTransition, RuleTransition, Transition } from "../../../src/parse/grammar/atn"
import * as fs from 'fs'

describe("successful ATN creation", () => {

	const IdentTok = createToken({ name: "IdentTok" })
	const DotTok = createToken({ name: "DotTok" })
	const ColonTok = createToken({ name: "ColonTok" })
	const LSquareTok = createToken({ name: "LSquareTok" })
	const RSquareTok = createToken({ name: "RSquareTok" })
	const ActionTok = createToken({ name: "ActionTok" })
	const LParenTok = createToken({ name: "LParenTok" })
	const RParenTok = createToken({ name: "RParenTok" })
	const CommaTok = createToken({ name: "CommaTok" })
	const SemicolonTok = createToken({ name: "SemicolonTok" })
	const EntityTok = createToken({ name: "EntityTok" })
	const KeyTok = createToken({ name: "KeyTok" })

	it("first", () => {
		const qualifiedName = new Rule({
			name: "qualifiedName",
			definition: [
				new Terminal({ terminalType: IdentTok }),
				new Repetition({
					definition: [
						new Terminal({ terminalType: DotTok }),
						new Terminal({ terminalType: IdentTok, idx: 2 })
					]
				})
			]
		})
		const paramSpec = new Rule({
			name: "paramSpec",
			definition: [
				new Terminal({ terminalType: IdentTok }),
				new Terminal({ terminalType: ColonTok }),
				new NonTerminal({
					nonTerminalName: "qualifiedName",
					referencedRule: qualifiedName
				}),
				new Option({
					definition: [
						new Terminal({ terminalType: LSquareTok }),
						new Terminal({ terminalType: RSquareTok })
					]
				})
			]
		})
		const actionDec = new Rule({
			name: "actionDec",
			definition: [
				new Terminal({ terminalType: ActionTok }),
				new Terminal({ terminalType: IdentTok }),
				new Terminal({ terminalType: LParenTok }),
				new Option({
					definition: [
						new NonTerminal({
							nonTerminalName: "paramSpec",
							referencedRule: paramSpec
						}),
						new Repetition({
							definition: [
								new Terminal({ terminalType: CommaTok }),
								new NonTerminal({
									nonTerminalName: "paramSpec",
									referencedRule: paramSpec,
									idx: 2
								})
							]
						})
					]
				}),
				new Terminal({ terminalType: RParenTok }),
				new Option({
					definition: [
						new Terminal({ terminalType: ColonTok }),
						new NonTerminal({
							nonTerminalName: "qualifiedName",
							referencedRule: qualifiedName
						})
					],
					idx: 2
				}),
				new Terminal({ terminalType: SemicolonTok })
			]
		})

		const lotsOfOrs = new Rule({
			name: "lotsOfOrs",
			definition: [
				new Alternation({
					definition: [
						new Alternative({
							definition: [
								new Alternation({
									definition: [
										new Alternative({
											definition: [
												new Terminal({
													terminalType: CommaTok,
													idx: 1
												})
											]
										}),
										new Alternative({
											definition: [
												new Terminal({
													terminalType: KeyTok,
													idx: 1
												})
											]
										})
									],
									idx: 2
								})
							]
						}),
						new Alternative({
							definition: [
								new Terminal({
									terminalType: EntityTok,
									idx: 1
								})
							]
						})
					]
				}),
				new Alternation({
					definition: [
						new Alternative({
							definition: [
								new Terminal({
									terminalType: DotTok,
									idx: 1
								})
							]
						})
					],
					idx: 3
				})
			]
		})

		const emptyAltOr = new Rule({
			name: "emptyAltOr",
			definition: [
				new Alternation({
					definition: [
						new Alternative({
							definition: [
								new Terminal({
									terminalType: KeyTok,
									idx: 1
								})
							]
						}),
						new Alternative({
							definition: [
								new Terminal({
									terminalType: EntityTok,
									idx: 1
								})
							]
						}),
						new Alternative({ definition: [] }) // an empty alternative
					]
				})
			]
		})
		const rules = [qualifiedName, paramSpec, actionDec, lotsOfOrs, emptyAltOr]
		const atn = createATN(rules)
		printATN(atn, rules)
	})

})

function printATN(atn: ATN, rules: Rule[]) {
	let text = "digraph G {\n"
	rules.forEach((rule, i) => {
		const startState = atn.ruleToStartState.get(rule)!
		iterateOverStates(startState, e => text += buildState(atn, i, e))
		iterateOverTransitions(startState, (state, transition) => text += buildTransition(atn, i, state, transition))
	})
	text += "}"
	fs.writeFileSync('./atn.dot', text)
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

function iterateOverTransitions(atnState: ATNState, action: (startState: ATNState, transition: Transition) => void, visited: Set<ATNState> = new Set()): void {
	for (const transition of atnState.transitions) {
		action(atnState, transition)
	}
	for (const transition of atnState.transitions) {
		const target = getTarget(transition)
		if (!visited.has(target)) {
			visited.add(target)
			iterateOverTransitions(target, action, visited)
		}
	}
}

function buildTransition(atn: ATN, ruleIndex: number, state: ATNState, transition: Transition): string {
	const name = stateName(atn, state)
	const targetName = stateName(atn, getTarget(transition))
	return `node_${ruleIndex}_${name} -> node_${ruleIndex}_${targetName} [label="${transitionName(transition)}"]\n`
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