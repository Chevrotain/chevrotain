"use strict"
/**
 * An Example of implementing a CSV Grammar with Chevrotain.
 *
 * Based on: https://github.com/antlr/grammars-v4/blob/master/csv/CSV.g4
 *
 * Note that this is a pure grammar without any actions (either embedded or via a CST Visitor).
 */

var chevrotain = require("chevrotain")

// ----------------- lexer -----------------
var createToken = chevrotain.createToken
var Lexer = chevrotain.Lexer
var Parser = chevrotain.Parser

// Lexer
const Text = createToken({ name: "Text", pattern: /[^,\n\r"]+/ })
const Comma = createToken({ name: "Comma", pattern: /,/ })
const NewLine = createToken({
	name: "NewLine",
	pattern: /\r?\n/,
	line_breaks: true
})
const String = createToken({ name: "String", pattern: /"(?:""|[^"])*"/ })

const allTokens = [Text, String, Comma, NewLine]
const CsvLexer = new Lexer(allTokens)

// Parser
class CsvParser extends Parser {
	constructor(input) {
		super(input, allTokens, {
			// uncomment this to enable automatic CstOutput.
			// outputCst: true
		})

		// not mandatory, using $ (or any other sign) to reduce verbosity (this. this. this. this. .......)
		const $ = this

		$.RULE("csvFile", () => {
			$.SUBRULE($.hdr)
			$.AT_LEAST_ONE(() => {
				$.SUBRULE2($.row)
			})
		})

		$.RULE("hdr", () => {
			$.SUBRULE($.row)
		})

		// the parsing methods
		$.RULE("row", () => {
			// using ES2015 Arrow functions to reduce verbosity.
			$.SUBRULE($.field)
			$.MANY(() => {
				$.CONSUME(Comma)
				$.SUBRULE2($.field)
			})
			$.CONSUME(NewLine)
		})

		$.RULE("field", () => {
			// prettier-ignore
			$.OR([
                {ALT: () => {$.CONSUME(Text)}},
                {ALT: () => {$.CONSUME(String)}},
                {ALT: () => {/* empty alt */}}
            ])
		})

		// very important to call this after all the rules have been defined.
		// otherwise the parser may not work correctly as it will lack information
		// derived during the self analysis phase.
		Parser.performSelfAnalysis(this)
	}
}

// wrapping it all together
// reuse the same parser instance.
const parser = new CsvParser([])

module.exports = function(text) {
	// 1. Tokenize the input.
	const lexResult = CsvLexer.tokenize(text)

	// 2. Set the Parser's input
	parser.input = lexResult.tokens
	// 3. invoke the desired parser rule
	const value = parser.csvFile()

	return {
		// Unless we enable CstOutput the value will be undefined
		// as our csvFile parser rule does not return anything.
		value: value,
		lexResult: lexResult,
		parseErrors: parser.errors
	}
}
