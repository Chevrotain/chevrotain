var chevrotain = require("chevrotain")

// ----------------- lexer -----------------
var createToken = chevrotain.createToken
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser

var One = createToken({ name: "One", pattern: /1/ })
var Two = createToken({ name: "Two", pattern: /2/ })
var Three = createToken({ name: "Three", pattern: /3/ })

var WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ })
WhiteSpace.GROUP = Lexer.SKIPPED // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
WhiteSpace.LINE_BREAKS = true

var allTokens = [
	WhiteSpace, // whitespace is normally very common so it should be placed first to speed up the lexer's performance
	One,
	Two,
	Three
]

var PredicateLookaheadLexer = new Lexer(allTokens)

/**
 * A Predicate / Gate function is invoked with context (this)
 * of the Parser. Thus it can access the Parser's internal state if needed.
 * In this example we limit some of the available alternatives using 'global' flag
 * 'maxNumberAllowed'
 *
 * A custom Predicate / Gate function should return true if the path should be taken or false otherwise.
 * Note that this logic is in addition to the built in grammar lookahead function (choosing the alternative according to the next tokens)
 * Not instead of it.
 */
var maxNumberAllowed = 3

function isOne() {
	return maxNumberAllowed >= 1
}

function isTwo() {
	return maxNumberAllowed >= 2
}

function isThree() {
	return maxNumberAllowed >= 3
}

// ----------------- parser -----------------
function PredicateLookaheadParser(input) {
	Parser.call(this, input, allTokens)

	var $ = this

	$.RULE("customPredicateRule", function() {
		return $.OR([
			// In this example we disable some of the alternatives depending on the value of the
			// "maxNumberAllowed" flag. For each alternative a custom Predicate / Gate function is provided
			// A Predicate / Gate function may also be provided for other grammar DSL rules.
			// (OPTION/MANY/AT_LEAST_ONE/...)
			{
				GATE: isOne,
				ALT: function() {
					$.CONSUME(One)
					return 1
				}
			},
			{
				GATE: isTwo,
				ALT: function() {
					$.CONSUME(Two)
					return 2
				}
			},
			{
				GATE: isThree,
				ALT: function() {
					$.CONSUME(Three)
					return 3
				}
			}
		])
	})

	// very important to call this after all the rules have been defined.
	// otherwise the parser may not work correctly as it will lack information
	// derived during the self analysis phase.
	Parser.performSelfAnalysis(this)
}

PredicateLookaheadParser.prototype = Object.create(Parser.prototype)
PredicateLookaheadParser.prototype.constructor = PredicateLookaheadParser

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
var parser = new PredicateLookaheadParser([])

module.exports = {
	parse: function(text) {
		var lexResult = PredicateLookaheadLexer.tokenize(text)
		// setting a new input will RESET the parser instance's state.
		parser.input = lexResult.tokens
		// any top level rule may be used as an entry point
		var value = parser.customPredicateRule()

		return {
			value: value,
			lexErrors: lexResult.errors,
			parseErrors: parser.errors
		}
	},

	setMaxAllowed: function(newMaxAllowed) {
		maxNumberAllowed = newMaxAllowed
	}
}
