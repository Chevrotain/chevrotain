import { gast } from "../../../src/parse/grammar/gast_public"

let Rule = gast.Rule
let RepetitionMandatory = gast.RepetitionMandatory
let RepetitionMandatoryWithSeparator = gast.RepetitionMandatoryWithSeparator
let Repetition = gast.Repetition
let NonTerminal = gast.NonTerminal
let RepetitionWithSeparator = gast.RepetitionWithSeparator
let Terminal = gast.Terminal
let Option = gast.Option
let Alternation = gast.Alternation
let Flat = gast.Flat

export class IdentTok {
	static PATTERN = /NA/
}
export class DotTok {
	static PATTERN = /NA/
}
export class DotDotTok {
	static PATTERN = /NA/
}
export class ColonTok {
	static PATTERN = /NA/
}
export class LSquareTok {
	static PATTERN = /NA/
}
export class RSquareTok {
	static PATTERN = /NA/
}
export class ActionTok {
	static PATTERN = /NA/
}
export class LParenTok {
	static PATTERN = /NA/
}
export class RParenTok {
	static PATTERN = /NA/
}
export class CommaTok {
	static PATTERN = /NA/
}
export class SemicolonTok {
	static PATTERN = /NA/
}
export class UnsignedIntegerLiteralTok {
	static PATTERN = /NA/
}
export class DefaultTok {
	static PATTERN = /NA/
}
export class AsteriskTok {
	static PATTERN = /NA/
}
export class EntityTok {
	static PATTERN = /NA/
}
export class NamespaceTok {
	static PATTERN = /NA/
}
export class TypeTok {
	static PATTERN = /NA/
}
export class ConstTok {
	static PATTERN = /NA/
}
export class RequiredTok {
	static PATTERN = /NA/
}
export class KeyTok {
	static PATTERN = /NA/
}
export class ElementTok {
	static PATTERN = /NA/
}

export let atLeastOneRule = new Rule("atLeastOneRule", [
	new RepetitionMandatory([
		new RepetitionMandatory(
			[
				new RepetitionMandatory([new Terminal(EntityTok)], 3),
				new Terminal(CommaTok)
			],
			2
		),
		new Terminal(DotTok, 1)
	]),
	new Terminal(DotTok, 2)
])

export let atLeastOneSepRule = new Rule("atLeastOneSepRule", [
	new RepetitionMandatoryWithSeparator(
		[
			new RepetitionMandatoryWithSeparator(
				[
					new RepetitionMandatoryWithSeparator(
						[new Terminal(EntityTok)],
						SemicolonTok,
						3
					),
					new Terminal(CommaTok)
				],
				SemicolonTok,
				2
			),
			new Terminal(DotTok, 1)
		],
		SemicolonTok
	),
	new Terminal(DotTok, 2)
])

export let qualifiedName = new Rule("qualifiedName", [
	new Terminal(IdentTok),
	new Repetition([new Terminal(DotTok), new Terminal(IdentTok, 2)])
])

export let qualifiedNameSep = new Rule("qualifiedNameSep", [
	new RepetitionMandatoryWithSeparator([new Terminal(IdentTok, 1)], DotTok)
])

export let paramSpec = new Rule("paramSpec", [
	new Terminal(IdentTok),
	new Terminal(ColonTok),
	new NonTerminal("qualifiedName", qualifiedName),
	new Option([new Terminal(LSquareTok), new Terminal(RSquareTok)])
])

export let actionDec = new Rule("actionDec", [
	new Terminal(ActionTok),
	new Terminal(IdentTok),
	new Terminal(LParenTok),
	new Option([
		new NonTerminal("paramSpec", paramSpec),
		new Repetition([
			new Terminal(CommaTok),
			new NonTerminal("paramSpec", paramSpec, 2)
		])
	]),
	new Terminal(RParenTok),
	new Option(
		[
			new Terminal(ColonTok),
			new NonTerminal("qualifiedName", qualifiedName)
		],
		2
	),
	new Terminal(SemicolonTok)
])

export let actionDecSep = new Rule("actionDecSep", [
	new Terminal(ActionTok),
	new Terminal(IdentTok),
	new Terminal(LParenTok),

	new RepetitionWithSeparator(
		[new NonTerminal("paramSpec", paramSpec, 2)],
		CommaTok
	),

	new Terminal(RParenTok),
	new Option(
		[
			new Terminal(ColonTok),
			new NonTerminal("qualifiedName", qualifiedName)
		],
		2
	),
	new Terminal(SemicolonTok)
])

export let manyActions = new Rule("manyActions", [
	new Repetition([new NonTerminal("actionDec", actionDec, 1)])
])

export let cardinality = new Rule("cardinality", [
	new Terminal(LSquareTok),
	new Terminal(UnsignedIntegerLiteralTok),
	new Terminal(DotDotTok),
	new Alternation([
		new Flat([new Terminal(UnsignedIntegerLiteralTok, 2)]),
		new Flat([new Terminal(AsteriskTok)])
	]),
	new Terminal(RSquareTok)
])

export let assignedTypeSpec = new Rule("assignedTypeSpec", [
	new Terminal(ColonTok),
	new NonTerminal("assignedType"),

	new Option([new NonTerminal("enumClause")]),

	new Option([new Terminal(DefaultTok), new NonTerminal("expression")], 2)
])

export let lotsOfOrs = new Rule("lotsOfOrs", [
	new Alternation([
		new Flat([
			new Alternation(
				[
					new Flat([new Terminal(CommaTok, 1)]),
					new Flat([new Terminal(KeyTok, 1)])
				],
				2
			)
		]),
		new Flat([new Terminal(EntityTok, 1)])
	]),
	new Alternation([new Flat([new Terminal(DotTok, 1)])], 3)
])

export let emptyAltOr = new Rule("emptyAltOr", [
	new Alternation([
		new Flat([new Terminal(KeyTok, 1)]),
		new Flat([new Terminal(EntityTok, 1)]),
		new Flat([]) // an empty alternative
	])
])

export let callArguments = new Rule("callArguments", [
	new RepetitionWithSeparator([new Terminal(IdentTok, 1)], CommaTok),
	new RepetitionWithSeparator([new Terminal(IdentTok, 2)], CommaTok, 2)
])
