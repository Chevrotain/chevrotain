/*
 * Example Of using parametrized grammar rules.
 * An call to a sub grammar rule may supply an array of argument which will be used
 * in the invocation of the sub-rule.
 *
 * This example additionally displays the use of gates/predicates to control the grammar flow.
 *
 * The Parser in this example accepts a <mood> argument with the invocation of the <topRule>
 * This parameter is passed down to the <hello> rule where it is used to determine the possible grammar path.
 */
"use strict"

var chevrotain = require("chevrotain")

// ----------------- lexer -----------------
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser
var createToken = chevrotain.createToken

class Hello {}
Hello.PATTERN = /hello/
class World {}
World.PATTERN = /world/

class Cruel {}
Cruel.PATTERN = /cruel/
class Bad {}
Bad.PATTERN = /bad/
class Evil {}
Evil.PATTERN = /evil/

class Good {}
Good.PATTERN = /good/
class Wonderful {}
Wonderful.PATTERN = /wonderful/
class Amazing {}
Amazing.PATTERN = /amazing/

class WhiteSpace {}
WhiteSpace.PATTERN = /\s+/
WhiteSpace.GROUP = Lexer.SKIPPED
WhiteSpace.LINE_BREAKS = true

var allTokens = [
	WhiteSpace,
	Hello,
	World,
	Cruel,
	Bad,
	Evil,
	Good,
	Wonderful,
	Amazing
]

var HelloLexer = new Lexer(allTokens)

// ----------------- parser -----------------
class HelloParser extends chevrotain.Parser {
	constructor(input) {
		super(input, allTokens)

		this.RULE("topRule", mood => {
			// SUBRULE may be called with a array of arguments which will be passed to the sub-rule's implementation
			this.SUBRULE(this.hello, [mood])
		})

		// the <hello> rule's implementation is defined with a <mood> parameter
		this.RULE("hello", mood => {
			this.CONSUME(Hello)

			// The mood parameter is used to determine which path to take
			this.OR([
				{
					GATE: () => mood === "positive",
					ALT: () => this.SUBRULE(this.positive)
				},
				{
					GATE: () => mood === "negative",
					ALT: () => this.SUBRULE(this.negative)
				}
			])

			this.CONSUME(World)
		})

		this.RULE("negative", () => {
			this.OR([
				{
					ALT: () => {
						this.CONSUME(Cruel)
					}
				},
				{
					ALT: () => {
						this.CONSUME(Bad)
					}
				},
				{
					ALT: () => {
						this.CONSUME(Evil)
					}
				}
			])
		})

		this.RULE("positive", () => {
			this.OR([
				{
					ALT: () => {
						this.CONSUME(Good)
					}
				},
				{
					ALT: () => {
						this.CONSUME(Wonderful)
					}
				},
				{
					ALT: () => {
						this.CONSUME(Amazing)
					}
				}
			])
		})

		// very important to call this after all the rules have been defined.
		// otherwise the parser may not work correctly as it will lack information
		// derived during the self analysis phase.
		Parser.performSelfAnalysis(this)
	}
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
var parser = new HelloParser([])

module.exports = function(text, mood) {
	var lexResult = HelloLexer.tokenize(text)

	// setting a new input will RESET the parser instance's state.
	parser.input = lexResult.tokens

	// Passing the argument to the top rule.
	// note that because we are invoking a "start rule" we must provide the arguments as the second parameter.
	// with the first parameter provided the value <1>
	// also note that the arguments are passed as an array
	var value = parser.topRule(1, [mood])

	return {
		value: value, // this is a pure grammar, the value will always be <undefined>
		lexErrors: lexResult.errors,
		parseErrors: parser.errors
	}
}
