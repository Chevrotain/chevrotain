import { IProduction, IToken, TokenType } from "@chevrotain/types";
import some from "lodash/some";
import { TokenMatcher } from "../parser/parser";
import { collectMethods } from "./gast/gast";
import { Alternation, Rule } from "./gast/gast_public";

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

export interface BlockStartState extends ATNBaseState {
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
		const {
			alternation,
			repetition,
			option,
			repetitionMandatory,
			repetitionMandatoryWithSeparator,
			repetitionWithSeparator
		  } = collectMethods(rule)
		// const block = buildBlock(atn, rule, alternation)
		// buildRuleHandle(atn, rule, block)
	}
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

// function buildBlock(atn: ATN, rule: Rule, ebnfRoot: IProduction | undefined, alts: ATNHandle[]): ATNHandle {
// 	if (ebnfRoot === undefined) {
// 		if (alts.length === 1) {
// 			const h = alts[0]
// 			rule.atnState = h.left
// 			return h
// 		}
// 		const start = newState<BasicBlockStartState>(atn, rule)
// 	}
// }

function buildRuleHandle(atn: ATN, rule: Rule, block: ATNHandle): ATNHandle {
	const start = atn.ruleToStartState.get(rule)!
	epsilon(start, block.left)
	const stop = atn.ruleToStopState.get(rule)!
	epsilon(block.right, stop)
	const handle: ATNHandle = {
		left: start,
		right: stop
	}
	return handle
}

function epsilon(a: ATNState, b: ATNState, prepend = false): void {
	const transition = new EpsilonTransition(b);
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