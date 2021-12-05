import map from "lodash/map";
import some from "lodash/some";
import { IProduction, IToken, TokenType } from "@chevrotain/types";
import { TokenMatcher } from "../parser/parser";
import { Alternation, NonTerminal, Rule, Option, RepetitionMandatory, Repetition, Terminal, AbstractProduction, Alternative, RepetitionWithSeparator, RepetitionMandatoryWithSeparator } from "./gast/gast_public";
import filter from "lodash/filter";

export interface ATN {
	states: ATNState[]
	decisionStates: DecisionState[]
	ruleToStartState: Map<Rule, RuleStartState>
	ruleToStopState: Map<Rule, RuleStopState>
}

export const ATN_INVALID_TYPE = 0
export const ATN_BASIC = 1
export const ATN_RULE_START = 2
export const ATN_BLOCK_START = 3
export const ATN_PLUS_BLOCK_START = 4
export const ATN_STAR_BLOCK_START = 5
// Currently unused as the ATN is not used for lexing
export const ATN_TOKEN_START = 6
export const ATN_RULE_STOP = 7
export const ATN_BLOCK_END = 8
export const ATN_STAR_LOOP_BACK = 9
export const ATN_STAR_LOOP_ENTRY = 10
export const ATN_PLUS_LOOP_BACK = 11
export const ATN_LOOP_END = 12

export type ATNState = BasicState
	| BasicBlockStartState
	| PlusBlockStartState
	| PlusLoopbackState
	| StarBlockStartState
	| StarLoopbackState
	| StarLoopEntryState
	| BlockEndState
	| RuleStartState
	| RuleStopState
	| LoopEndState

export interface ATNBaseState {
	atn: ATN
	stateNumber: number
	rule: Rule
	epsilonOnlyTransitions: boolean
	transitions: Transition[]
	nextTokenWithinRule: number[]
}

export interface BasicState extends ATNBaseState {
	type: typeof ATN_BASIC
}

export interface BlockStartState extends DecisionState {
	end: BlockEndState
}

export interface BasicBlockStartState extends BlockStartState {
	type: typeof ATN_BLOCK_START
}

export interface PlusBlockStartState extends BlockStartState {
	loopback: PlusLoopbackState
	type: typeof ATN_PLUS_BLOCK_START
}

export interface PlusLoopbackState extends DecisionState {
	type: typeof ATN_PLUS_LOOP_BACK
}

export interface StarBlockStartState extends BlockStartState {
	type: typeof ATN_STAR_BLOCK_START
}

export interface StarLoopbackState extends ATNBaseState {
	type: typeof ATN_STAR_LOOP_BACK
}

export interface StarLoopEntryState extends DecisionState {
	loopback: StarLoopbackState
	isPrecedenceDecision: boolean
	type: typeof ATN_STAR_LOOP_ENTRY
}

export interface BlockEndState extends ATNBaseState {
	start: BlockStartState
	type: typeof ATN_BLOCK_END
}

export interface DecisionState extends ATNBaseState {
	decision: number
	nonGreedy: boolean
}

export interface LoopEndState extends ATNBaseState {
	loopback: ATNState
	type: typeof ATN_LOOP_END
}

export interface RuleStartState extends ATNBaseState {
	stop: RuleStopState
	type: typeof ATN_RULE_START
}

export interface RuleStopState extends ATNBaseState {
	type: typeof ATN_RULE_STOP
}

export interface Transition {
	target: ATNState
	label(): TokenType[]
	isEpsilon(): boolean
}

export abstract class AbstractTransition implements Transition {

	target: ATNState

	constructor(target: ATNState) {
		this.target = target
	}

	label(): TokenType[] {
		return []
	}

	isEpsilon() {
		return false
	}
}

export class AtomTransition extends AbstractTransition {

	tokenType: TokenType

	constructor(target: ATNState, tokenType: TokenType) {
		super(target)
		this.tokenType = tokenType
	}

	label(): TokenType[] {
		return [this.tokenType]
	}

}

export class EpsilonTransition extends AbstractTransition {

	outermostPrecedenceReturn: number

	constructor(target: ATNState, outermostPrecedenceReturn = -1) {
		super(target)
		this.outermostPrecedenceReturn = outermostPrecedenceReturn
	}

	isEpsilon() {
		return true
	}
}

export class RuleTransition extends AbstractTransition {

	rule: Rule
	precedence: number
	followState: ATNState

	constructor(ruleStart: RuleStartState, rule: Rule, precedence: number, followState: ATNState) {
		super(ruleStart)
		this.rule = rule
		this.precedence = precedence
		this.followState = followState
	}

	isEpsilon() {
		return true
	}
}

export interface ATNHandle {
	left: ATNState
	right: ATNState
}

export function createATN(rules: Rule[]): ATN {
	const atn: ATN = {
		decisionStates: [],
		ruleToStartState: new Map(),
		ruleToStopState: new Map(),
		states: []
	}
	createRuleStartAndStopATNStates(atn, rules)
	const ruleLength = rules.length
	for (let i = 0; i < ruleLength; i++) {
		const rule = rules[i]
		const ruleBlock = block(atn, rule, rule)
		if (ruleBlock === undefined) {
			continue
		}
		buildRuleHandle(atn, rule, ruleBlock)
	}
	addRuleFollowLinks(atn)
	return atn
}

function createRuleStartAndStopATNStates(atn: ATN, rules: Rule[]): void {
	const ruleLength = rules.length
	for (let i = 0; i < ruleLength; i++) {
		const rule = rules[i]
		const start = newState<RuleStartState>(atn, rule, {
			type: ATN_RULE_START
		})
		const stop = newState<RuleStopState>(atn, rule, {
			type: ATN_RULE_STOP
		})
		start.stop = stop
		atn.ruleToStartState.set(rule, start)
		atn.ruleToStopState.set(rule, stop)
	}
}

function atom(atn: ATN, rule: Rule, production: IProduction): ATNHandle | undefined {
	if (production instanceof Terminal) {
		return tokenRef(atn, rule, production)
	} else if (production instanceof NonTerminal) {
		return ruleRef(atn, rule, production)
	} else if (production instanceof Alternation) {
		return alternation(atn, rule, production)
	} else if (production instanceof Option) {
		return option(atn, rule, production)
	} else if (production instanceof Repetition) {
		return repetition(atn, rule, production)
	} else if (production instanceof RepetitionWithSeparator) {
		return repetitionSep(atn, rule, production)
	} else if (production instanceof RepetitionMandatory) {
		return repetitionMandatory(atn, rule, production)
	} else if (production instanceof RepetitionMandatoryWithSeparator) {
		return repetitionMandatorySep(atn, rule, production)
	} else if (production instanceof Alternative || production instanceof Rule) {
		return block(atn, rule, production)
	} else {
		throw new Error('Invalid atom')
	}
}

function repetition(atn: ATN, rule: Rule, repetition: Repetition): ATNHandle {
	const starState = newState<StarBlockStartState>(atn, rule, {
		type: ATN_STAR_BLOCK_START
	})
	defineDecisionState(atn, starState)
	const handle = makeAlts(atn, rule, starState, repetition, block(atn, rule, repetition))
	return star(atn, rule, repetition, handle)
}

function repetitionSep(atn: ATN, rule: Rule, repetition: RepetitionWithSeparator): ATNHandle {
	const starState = newState<StarBlockStartState>(atn, rule, {
		type: ATN_STAR_BLOCK_START
	})
	defineDecisionState(atn, starState)
	const handle = makeAlts(atn, rule, starState, repetition, block(atn, rule, repetition))
	const sep = tokenRef(atn, rule, repetition.separator)
	return star(atn, rule, repetition, handle, sep)
}

function repetitionMandatory(atn: ATN, rule: Rule, repetition: RepetitionMandatory): ATNHandle {
	const plusState = newState<PlusBlockStartState>(atn, rule, {
		type: ATN_PLUS_BLOCK_START
	})
	defineDecisionState(atn, plusState)
	const handle = makeAlts(atn, rule, plusState, repetition, block(atn, rule, repetition))
	return plus(atn, rule, repetition, handle)
}

function repetitionMandatorySep(atn: ATN, rule: Rule, repetition: RepetitionMandatoryWithSeparator): ATNHandle {
	const plusState = newState<PlusBlockStartState>(atn, rule, {
		type: ATN_PLUS_BLOCK_START
	})
	defineDecisionState(atn, plusState)
	const handle = makeAlts(atn, rule, plusState, repetition, block(atn, rule, repetition))
	const sep = tokenRef(atn, rule, repetition.separator)
	return plus(atn, rule, repetition, handle, sep)
}

function alternation(atn: ATN, rule: Rule, alternation: Alternation): ATNHandle {
	const start = newState<BasicBlockStartState>(atn, rule, {
		type: ATN_BLOCK_START
	})
	defineDecisionState(atn, start)
	const alts = map(alternation.definition, e => atom(atn, rule, e))
	const handle = makeAlts(atn, rule, start, alternation, ...alts)
	return handle
}

function option(atn: ATN, rule: Rule, option: Option): ATNHandle {
	const start = newState<BasicBlockStartState>(atn, rule, {
		type: ATN_BLOCK_START
	})
	defineDecisionState(atn, start)
	const handle = makeAlts(atn, rule, start, option, block(atn, rule, option))
	return optional(option, handle)
}

function block(atn: ATN, rule: Rule, block: AbstractProduction): ATNHandle | undefined {
	const handles = filter(map(block.definition, e => atom(atn, rule, e)), e => e !== undefined) as ATNHandle[]
	if (handles.length === 1) {
		return handles[0]
	} else if (handles.length === 0) {
		return undefined
	} else {
		return makeBlock(atn, handles)
	}
}

function plus(atn: ATN, rule: Rule, plus: IProduction, handle: ATNHandle, sep?: ATNHandle): ATNHandle {
	const blkStart = handle.left as PlusBlockStartState
	const blkEnd = handle.right

	const loop = newState<PlusLoopbackState>(atn, rule, {
		type: ATN_PLUS_LOOP_BACK
	})
	defineDecisionState(atn, loop)
	const end = newState<LoopEndState>(atn, rule, {
		type: ATN_LOOP_END
	})
	blkStart.loopback = loop
	end.loopback = loop
	plus.atnState = loop
	epsilon(blkEnd, loop) // block can see loop back

	if (sep === undefined) {
		epsilon(loop, blkStart) // loop back to start
	} else {
		// loop back to start with separator
		epsilon(loop, sep.right)
		epsilon(sep.left, blkStart)
	}
	epsilon(loop, end) // exit

	return {
		left: blkStart,
		right: end
	}
}

function star(atn: ATN, rule: Rule, star: IProduction, handle: ATNHandle, sep?: ATNHandle): ATNHandle {
	const start = handle.left
	const end = handle.right

	const entry = newState<StarLoopEntryState>(atn, rule, {
		type: ATN_STAR_LOOP_ENTRY
	})
	defineDecisionState(atn, entry)
	const loopEnd = newState<LoopEndState>(atn, rule, {
		type: ATN_LOOP_END
	})
	const loop = newState<StarLoopbackState>(atn, rule, {
		type: ATN_STAR_LOOP_BACK
	})
	entry.loopback = loop
	loopEnd.loopback = loop

	epsilon(entry, start) // loop enter edge (alt 2)
	epsilon(entry, loopEnd) // bypass loop edge (alt 1)
	epsilon(end, loop) // block end hits loop back
	if (sep === undefined) {
		epsilon(loop, entry) // loop back to entry/exit decision
	} else {
		// loop back to start of handle using separator
		epsilon(loop, sep.left)
		epsilon(sep.right, start)
	}
	

	star.atnState = entry
	return {
		left: entry,
		right: loopEnd
	}
}

function optional(optional: Option, handle: ATNHandle): ATNHandle {
	const start = handle.left
	const end = handle.right

	epsilon(start, end)

	optional.atnState = start
	return handle
}

function defineDecisionState(atn: ATN, state: DecisionState): number {
	atn.decisionStates.push(state)
	state.decision = atn.decisionStates.length - 1
	return state.decision
}

function makeAlts(atn: ATN, rule: Rule, start: BlockStartState, production: IProduction, ...alts: (ATNHandle | undefined)[]): ATNHandle {
	const end = newState<BlockEndState>(atn, rule, {
		type: ATN_BLOCK_END,
		start
	})
	start.end = end
	let hasEpsilonTransition = false
	for (const alt of alts) {
		if (alt !== undefined) {
			// hook alts up to decision block
			epsilon(start, alt.left)
			epsilon(alt.right, end)
		} else {
			hasEpsilonTransition = true
		}
	}
	if (hasEpsilonTransition === true) {
		epsilon(start, end)
	}

	const handle: ATNHandle = {
		left: start as ATNState,
		right: end
	}
	production.atnState = start
	return handle
}

function makeBlock(atn: ATN, alts: ATNHandle[]): ATNHandle {
	const altsLength = alts.length
	for (let i = 0; i < altsLength - 1; i++) {
		const handle = alts[i]
		let transition: Transition | undefined
		if (handle.left.transitions.length === 1) {
			transition = handle.left.transitions[0]
		}
		const isRuleTransition = transition instanceof RuleTransition
		const ruleTransition = transition as RuleTransition
		if (handle.left.type === ATN_BASIC
			&& handle.right.type === ATN_BASIC
			&& transition !== undefined
			&& (isRuleTransition && ruleTransition.followState === handle.right || transition.target === handle.right)) {

			if (isRuleTransition) { // we can avoid epsilon edge to next element
				ruleTransition.followState = alts[i + 1].left
			} else {
				transition.target = alts[i + 1].left
			}
			removeState(atn, handle.right) // we skipped over this state
		} else { // need epsilon if previous block's right end node is complex
			epsilon(handle.right, alts[i + 1].left)
		}
	}

	const first = alts[0]
	const last = alts[altsLength - 1]
	if (first === undefined || last === undefined) {
		throw new Error('element list has first|last == null')
	}
	return {
		left: first.left,
		right: last.right
	}
}

function tokenRef(atn: ATN, rule: Rule, terminal: Terminal | TokenType): ATNHandle {
	const left = newState<BasicState>(atn, rule, {
		type: ATN_BASIC
	})
	const right = newState<BasicState>(atn, rule, {
		type: ATN_BASIC
	})
	addTransition(left, new AtomTransition(right, terminal instanceof Terminal ? terminal.terminalType : terminal))
	return {
		left,
		right
	}

}

function ruleRef(atn: ATN, currentRule: Rule, nonTerminal: NonTerminal): ATNHandle {
	const rule = nonTerminal.referencedRule
	const start = atn.ruleToStartState.get(rule)!
	const left = newState<BasicBlockStartState>(atn, currentRule, {
		type: ATN_BLOCK_START
	})
	const right = newState<BasicBlockStartState>(atn, currentRule, {
		type: ATN_BLOCK_START
	})

	const call = new RuleTransition(start, rule, 0, right)
	addTransition(left, call)

	nonTerminal.atnState = left;
	return {
		left,
		right
	}
}

function addFollowLink(atn: ATN, rule: Rule, right: ATNState): void {
	const stop = atn.ruleToStopState.get(rule)!
	epsilon(stop, right)
}

function addRuleFollowLinks(atn: ATN): void {
	for (const state of atn.states) {
		if (state.type === ATN_BASIC && state.transitions.length === 1 && state.transitions[0] instanceof RuleTransition) {
			const ruleTransition = state.transitions[0] as RuleTransition
			addFollowLink(atn, ruleTransition.rule, ruleTransition.followState)
		}
	}
}

function buildRuleHandle(atn: ATN, rule: Rule, block: ATNHandle): ATNHandle {
	const start = atn.ruleToStartState.get(rule)!
	epsilon(start, block.left)
	const stop = atn.ruleToStopState.get(rule)!
	epsilon(block.right, stop)
	const handle: ATNHandle = {
		left: start,
		right: stop
	}
	rule.atnState = start
	return handle
}

function epsilon(a: ATNBaseState, b: ATNBaseState): void {
	const transition = new EpsilonTransition(b as ATNState)
	addTransition(a, transition)
}

function newState<T extends ATNState>(atn: ATN, rule: Rule, partial: Partial<T>): T {
	const t: T = {
		atn,
		epsilonOnlyTransitions: false,
		rule,
		transitions: [],
		nextTokenWithinRule: [],
		stateNumber: atn.states.length,
		...partial
	} as unknown as T
	atn.states.push(t)
	return t
}

function addTransition(state: ATNBaseState, transition: Transition) {
	if (state.transitions.length === 0) {
		state.epsilonOnlyTransitions = transition.isEpsilon()
	} else if (state.epsilonOnlyTransitions !== transition.isEpsilon()) {
		state.epsilonOnlyTransitions = false
	}
	state.transitions.push(transition)
}

function removeState(atn: ATN, state: ATNState): void {
	atn.states.splice(atn.states.indexOf(state), 1)
}