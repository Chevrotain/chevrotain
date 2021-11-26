import { IProduction, IToken, TokenType } from "@chevrotain/types";
import some from "lodash/some";
import { TokenMatcher } from "../parser/parser";
import { collectMethods } from "./gast/gast";
import { Alternation, NonTerminal, Rule, Option, RepetitionMandatory, Repetition } from "./gast/gast_public";

export interface ATN {
	states: ATNState[]
	decisionStates: DecisionState[]
	ruleToStartState: Map<Rule, RuleStartState>
	ruleToStopState: Map<Rule, RuleStopState>
	maxTokenType: number
	ruleToTokenType: Map<Rule, number>
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
	matches(token: IToken, tokenMatcher: TokenMatcher): boolean
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

	matches(_token: IToken, _tokenMatcher: TokenMatcher): boolean {
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

	matches(token: IToken, tokenMatcher: TokenMatcher): boolean {
		return tokenMatcher(token, this.tokenType)
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

export class SetTransition extends AbstractTransition {

	set: TokenType[]

	constructor(target: ATNState, set: TokenType[]) {
		super(target)
		this.set = set
	}

	label(): TokenType[] {
		return this.set
	}

	matches(token: IToken, tokenMatcher: TokenMatcher) {
		return some(this.set, tokenType => tokenMatcher(token, tokenType))
	}
}

export type Predicate = () => boolean

export class PredicateTransition extends AbstractTransition {

	rule: Rule
	predicate: Predicate
	isCtxDependent: boolean

	constructor(target: ATNState, rule: Rule, predicate: Predicate, isCtxDependent: boolean) {
		super(target)
		this.rule = rule
		this.predicate = predicate
		this.isCtxDependent = isCtxDependent
	}

	isEpsilon() {
		return true
	}
}

export class PredencePredicateTransition extends AbstractTransition {

	precendence: number

	constructor(target: ATNState, precedence: number) {
		super(target)
		this.precendence = precedence
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
		maxTokenType: 0,
		ruleToStartState: new Map(),
		ruleToStopState: new Map(),
		ruleToTokenType: new Map(),
		states: []
	}
	createRuleStartAndStopATNStates(atn, rules)
	const ruleLength = rules.length
	for (let i = 0; i < ruleLength; i++) {
		const rule = rules[i]
		const block = buildBlock(atn, rule, undefined)
		buildRuleHandle(atn, rule, block)
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

function buildBlock(atn: ATN, production: IProduction, ebnfRoot: IProduction | undefined): ATNHandle {
	
}

function block(atn: ATN, rule: Rule, block: IProduction, ebnfRoot: IProduction | undefined, alts: ATNHandle[]): ATNHandle {
	if (ebnfRoot === undefined) {
		if (alts.length === 1) {
			const h = alts[0]
			block.atnState = h.left
			return h
		}
		const start = newState<BasicBlockStartState>(atn, rule, {
			type: ATN_BLOCK_START
		})
		if (alts.length > 1) {
			defineDecisionState(atn, start)
		}
		return makeBlock(atn, start, rule, block, alts)
	} else if (ebnfRoot instanceof Option) {
		const start = newState<BasicBlockStartState>(atn, rule, {
			type: ATN_BLOCK_START
		})
		defineDecisionState(atn, start)
		const handle = makeBlock(atn, start, rule, block, alts)
		return optional(ebnfRoot, handle)
	} else if (ebnfRoot instanceof Repetition) {
		const starState = newState<StarBlockStartState>(atn, rule, {
			type: ATN_STAR_BLOCK_START
		})
		if (alts.length > 1) {
			defineDecisionState(atn, starState)
		}
		const handle = makeBlock(atn, starState, rule, block, alts)
		return star(atn, rule, ebnfRoot, handle)
	} else if (ebnfRoot instanceof RepetitionMandatory) {
		const plusState = newState<PlusBlockStartState>(atn, rule, {
			type: ATN_PLUS_BLOCK_START
		})
		if (alts.length > 1) {
			defineDecisionState(atn, plusState)
		}
		const handle = makeBlock(atn, plusState, rule, block, alts)
		return plus(atn, rule, ebnfRoot, handle)
	} else {
		throw new Error('Invalid ebnfRoot')
	}
}

function plus(atn: ATN, rule: Rule, plus: RepetitionMandatory, handle: ATNHandle): ATNHandle {
	const start = handle.left as PlusBlockStartState
	const end = handle.right as BlockEndState

	const loop = newState<PlusLoopbackState>(atn, rule, {
		type: ATN_PLUS_LOOP_BACK
	})
	defineDecisionState(atn, loop)
	const loopEnd = newState<LoopEndState>(atn, rule, {
		type: ATN_LOOP_END
	})
	start.loopback = loop
	loopEnd.loopback = loop
	plus.atnState = loop
	epsilon(end, loop) // block can see loop back

	epsilon(loop, loopEnd) // exit
	epsilon(loop, end) // loop back to start

	return {
		left: start,
		right: loopEnd
	}
}

function star(atn: ATN, rule: Rule, star: Repetition, handle: ATNHandle): ATNHandle {
	const start = handle.left as StarBlockStartState
	const end = handle.right as BlockEndState

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

	epsilon(entry, loopEnd) // bypass loop edge (alt 1)
	epsilon(entry, start) // loop enter edge (alt 2)
	epsilon(end, loop) // block end hits loop back
	epsilon(loop, entry) // loop back to entry/exit decision

	star.atnState = entry
	return {
		left: entry,
		right: loopEnd
	}
}

function optional(optional: Option, handle: ATNHandle): ATNHandle {
	const start = handle.left as BlockStartState
	const end = handle.right
	
	epsilon(start, end)

	optional.atnState = end
	return handle
}

function defineDecisionState(atn: ATN, state: DecisionState): number {
	atn.decisionStates.push(state)
	state.decision = atn.decisionStates.length - 1
	return state.decision
}

function makeBlock(atn: ATN, start: BlockStartState, rule: Rule, block: IProduction, alts: ATNHandle[]): ATNHandle {
	const end = newState<BlockEndState>(atn, rule, {
		type: ATN_BLOCK_END
	})
	start.end = end
	for (const alt of alts) {
		// hook alts up to decision block
		epsilon(start, alt.left)
		epsilon(alt.right, end)
	}

	const handle: ATNHandle = {
		left: start as ATNState,
		right: end
	}
	block.atnState= handle
	return handle
}

function alt(atn: ATN, rule: Rule, alts: ATNHandle[]): ATNHandle {
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

			if (isRuleTransition) { // we can avoid epsilon edge to next el
				ruleTransition.followState = alts[i + 1].left
			} else {
				transition.target = alts[i + 1].left
			}
			removeState(atn, handle.right) // we skipped over this state
		} else { // need epsilon if previous block's right end node is complicated
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
	left.transitions.push(call)

	nonTerminal.atnState = left;
	return {
		left,
		right
	}
}

function addFollowLink(atn: ATN, rule: Rule, right: ATNState): void {
	const stop = atn.ruleToStartState.get(rule)!
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

function epsilon(a: ATNBaseState, b: ATNBaseState, prepend = false): void {
	const transition = new EpsilonTransition(b as ATNState);
	if (prepend) {
		a.transitions.unshift(transition)
	} else {
		a.transitions.push(transition)
	}
}

function newState<T extends ATNState>(atn: ATN, rule: Rule, partial: Partial<T>): T {
	const t: T = {
		atn,
		epsilonOnlyTransitions: false,
		rule,
		transitions: [],
		nextTokenWithinRule: [],
		stateNumber: -1,
		...partial
	} as unknown as T
	atn.states.push(t)
	return t
}

function removeState(atn: ATN, state: ATNState): void {
	atn.states.splice(atn.states.indexOf(state), 1)
}