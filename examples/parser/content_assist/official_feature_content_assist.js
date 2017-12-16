/*
 * Example Of using Chevrotain's built in syntactic content assist
 * To implement semantic content assist and content assist on partial inputs.
 *
 * Examples:
 * "Public static " --> ["function"]
 * "Public sta" --> ["static"]
 * "call f" --> ["foo"] // assuming foo is in the symbol table.
 */
"use strict"

const _ = require("lodash")
const chevrotain = require("chevrotain")

const Lexer = chevrotain.Lexer
const Parser = chevrotain.Parser
const tokenMatcher = chevrotain.tokenMatcher
const createToken = chevrotain.createToken
const EMPTY_ALT = chevrotain.EMPTY_ALT

const Keyword = createToken({ name: "Keyword", pattern: Lexer.NA })

const Private = createToken({
	name: "Private",
	pattern: /private/,
	categories: Keyword
})
const Public = createToken({
	name: "Public",
	pattern: /public/,
	categories: Keyword
})
const Static = createToken({
	name: "Static",
	pattern: /static/,
	categories: Keyword
})
const Declare = createToken({
	name: "Declare",
	pattern: /declare/,
	categories: Keyword
})
const Call = createToken({ name: "Call", pattern: /call/, categories: Keyword })
const Enum = createToken({ name: "Enum", pattern: /enum/, categories: Keyword })
const Function = createToken({
	name: "Function",
	pattern: /function/,
	categories: Keyword
})
const Identifier = createToken({ name: "Identifier", pattern: /\w+/ })
const WhiteSpace = createToken({
	name: "WhiteSpace",
	pattern: /\s+/,
	group: Lexer.SKIPPED,
	line_breaks: true
})

const allTokens = [
	WhiteSpace,
	Call,
	Private,
	Public,
	Static,
	Enum,
	Declare,
	Function,
	Identifier
]
const StatementsLexer = new Lexer(allTokens)

// A completely normal Chevrotain Parser, no changes needed to use the content assist capabilities.
class StatementsParser extends Parser {
	constructor(input) {
		super(input, allTokens)

		let $ = this

		$.RULE("startRule", () => {
			$.MANY(() => {
				$.SUBRULE($.stmt)
			})
		})

		$.RULE("stmt", () => {
			$.OR([
				{
					ALT: () => $.SUBRULE($.functionInvocation)
				},
				{
					ALT: () => $.SUBRULE($.functionStmt)
				},
				{ ALT: () => $.SUBRULE($.enumStmt) }
			])
		})

		$.RULE("functionInvocation", () => {
			$.CONSUME(Call)
			$.CONSUME(Identifier)
		})

		// e.g: "private static function foo"
		$.RULE("functionStmt", () => {
			$.SUBRULE($.visibility)
			$.OPTION(() => {
				$.CONSUME(Static)
			})
			$.CONSUME(Function)
			$.CONSUME(Identifier)
		})

		// e.g "public enum MONTHS"
		$.RULE("enumStmt", () => {
			$.SUBRULE($.visibility)
			$.CONSUME(Enum)
			$.CONSUME(Identifier)
		})

		$.RULE("visibility", () => {
			$.OR([
				{ ALT: () => $.CONSUME(Private) },
				{ ALT: () => $.CONSUME(Public) },
				{ ALT: EMPTY_ALT("EMPTY_ALT") }
			])
		})

		Parser.performSelfAnalysis(this)
	}
}

// No need for more than one instance.
const parserInstance = new StatementsParser([])

/**
 * @param text {string} - The text content assist is requested immediately afterwards.
 * @param symbolTable {string[]} - List of available symbol names.
 */
function getContentAssistSuggestions(text, symbolTable) {
	const lexResult = StatementsLexer.tokenize(text)
	if (lexResult.errors.length > 0) {
		throw new Error("sad sad panda, lexing errors detected")
	}

	const lastInputToken = _.last(lexResult.tokens)
	let partialSuggestionMode = false
	let assistanceTokenVector = lexResult.tokens

	// we have requested assistance while inside a Keyword or Identifier
	if (
		lastInputToken !== undefined &&
		(tokenMatcher(lastInputToken, Identifier) ||
			tokenMatcher(lastInputToken, Keyword)) &&
		/\w/.test(text[text.length - 1])
	) {
		assistanceTokenVector = _.dropRight(assistanceTokenVector)
		partialSuggestionMode = true
	}

	const syntacticSuggestions = parserInstance.computeContentAssist(
		"startRule",
		assistanceTokenVector
	)

	let finalSuggestions = []

	for (let i = 0; i < syntacticSuggestions.length; i++) {
		const currSyntaxSuggestion = syntacticSuggestions[i]
		const currTokenType = currSyntaxSuggestion.nextTokenType
		const currRuleStack = currSyntaxSuggestion.ruleStack
		const lastRuleName = _.last(currRuleStack)

		// easy case where a keyword is suggested.
		if (Keyword.categoryMatchesMap[currTokenType.tokenTypeIdx]) {
			finalSuggestions.push(currTokenType.PATTERN.source)
		} else if (currTokenType === Identifier) {
			// in declarations, should not provide content assist for new symbols (Identifiers)
			if (_.contains(["enumStmt", "functionStmt"], lastRuleName)) {
				// NO-OP
			} else if (lastRuleName === "functionInvocation") {
				// Inside "functionInvocation" an Identifier is a usage of a symbol
				// This is an overly simplified approach of adding all the symbols
				// in a real world example symbol scoping and probably more in depth logic will be required.
				// This scenario appears in this example to emphasize that Chevrotain only supplies Syntactic content assist
				// The Semantic content assist must be implemented by the Grammar's author.
				finalSuggestions = finalSuggestions.concat(symbolTable)
			} else {
				throw Error("non exhaustive match")
			}
		} else {
			throw Error("non exhaustive match")
		}
	}

	// throw away any suggestion that is not a suffix of the last partialToken.
	if (partialSuggestionMode) {
		finalSuggestions = _.filter(finalSuggestions, currSuggestion => {
			return _.startsWith(currSuggestion, lastInputToken.image)
		})
	}

	// we could have duplication because each suggestion also includes a Path, and the same Token may appear in multiple suggested paths.
	return _.uniq(finalSuggestions)
}

module.exports = {
	getContentAssistSuggestions: getContentAssistSuggestions
}
