/*
 * An example showing that any Production may be used as a start rule in chevrotain.
 * There is no artificial limit of which rule may be a start rule.
 *
 * Multiple start rules can be useful in certain contexts, for example:
 * 1. Unit Testing the grammar.
 * 2. Partial parsing of only the modified parts of a document in an IDE.
 */

var chevrotain = require("chevrotain")

// ----------------- lexer -----------------
var createToken = chevrotain.createToken
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser

var Alpha = createToken({ name: "Alpha", pattern: /A/ })
var Bravo = createToken({ name: "Bravo", pattern: /B/ })
var Charlie = createToken({ name: "Charlie", pattern: /C/ })

var WhiteSpace = createToken({
	name: "WhiteSpace",
	pattern: /\s+/,
	group: Lexer.SKIPPED,
	line_breaks: true
})

var allTokens = [
	WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
	Alpha,
	Bravo,
	Charlie
]

var PhoneticLexer = new Lexer(allTokens)

// ----------------- parser -----------------
function MultiStartParser(input) {
	Parser.call(this, input, allTokens)

	var $ = this

	$.RULE("firstRule", function() {
		$.CONSUME(Alpha)

		$.OPTION(function() {
			$.SUBRULE($.secondRule)
		})
	})

	$.RULE("secondRule", function() {
		$.CONSUME(Bravo)

		$.OPTION(function() {
			$.SUBRULE($.thirdRule)
		})
	})

	$.RULE("thirdRule", function() {
		$.CONSUME(Charlie)
	})

	// very important to call this after all the rules have been defined.
	// otherwise the parser may not work correctly as it will lack information
	// derived during the self analysis phase.
	Parser.performSelfAnalysis(this)
}

MultiStartParser.prototype = Object.create(Parser.prototype)
MultiStartParser.prototype.constructor = MultiStartParser

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
var parser = new MultiStartParser([])

function parseStartingWithRule(ruleName) {
	return function(text) {
		var lexResult = PhoneticLexer.tokenize(text)
		// setting a new input will RESET the parser instance's state.
		parser.input = lexResult.tokens
		// just invoke which ever rule you want as the start rule. its all just plain javascript...
		var value = parser[ruleName]()

		return {
			value: value, // this is a pure grammar, the value will always be <undefined>
			lexErrors: lexResult.errors,
			parseErrors: parser.errors
		}
	}
}

module.exports = {
	parseFirst: parseStartingWithRule("firstRule"),
	parseSecond: parseStartingWithRule("secondRule"),
	parseThird: parseStartingWithRule("thirdRule")
}
