// Using ES6 style imports for Chevrotain, this means Webpack 2 can perform tree shaking
import { Parser } from "chevrotain"
// Using commonjs require to import the tokens instead of ES6 imports to avoid Webpack tree shaking.
const tokens = require("./tokens_only")

class ArrayParserCommonJS extends Parser {
	constructor(input) {
		super(input, tokens.allTokens)
		const $ = this

		$.RULE("array", () => {
			$.CONSUME(tokens.LSquare)
			$.OPTION(() => {
				$.CONSUME(tokens.Integer)
				$.MANY(() => {
					$.CONSUME(tokens.Comma)
					$.CONSUME2(tokens.Integer)
				})
			})
			$.CONSUME(tokens.RSquare)
		})

		Parser.performSelfAnalysis(this)
	}
}

// ----------------- wrapping it all together -----------------

// reuse the same parser instance.
const parser = new ArrayParserCommonJS([])

export function parse(text) {
	const lexResult = tokens.ArrayLexer.tokenize(text)
	// setting a new input will RESET the parser instance's state.
	parser.input = lexResult.tokens
	// any top level rule may be used as an entry point
	const value = parser.array()

	return {
		value: value, // this is a pure grammar, the value will always be <undefined>
		lexErrors: lexResult.errors,
		parseErrors: parser.errors
	}
}
