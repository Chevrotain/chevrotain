// wrapping in UMD to allow code to work both in node.js
// and in the browser
;(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory(require("chevrotain"))
	} else {
		// Browser globals (root is window)
		root["grammar"] = factory(root.chevrotain)
	}
})(this, function(chevrotain) {
	// ----------------- lexer -----------------
	const createToken = chevrotain.createToken
	const Lexer = chevrotain.Lexer
	const Parser = chevrotain.Parser

	// In ES6, custom inheritance implementation (such as 'extendToken(...)') can be replaced with simple "class X extends Y"...
	const True = createToken({ name: "True", pattern: /true/ })
	const False = createToken({ name: "False", pattern: /false/ })
	const Null = createToken({ name: "Null", pattern: /null/ })
	const LCurly = createToken({ name: "LCurly", pattern: /{/ })
	const RCurly = createToken({ name: "RCurly", pattern: /}/ })
	const LSquare = createToken({ name: "LSquare", pattern: /\[/ })
	const RSquare = createToken({ name: "RSquare", pattern: /]/ })
	const Comma = createToken({ name: "Comma", pattern: /,/ })
	const Colon = createToken({ name: "Colon", pattern: /:/ })
	const StringLiteral = createToken({
		name: "StringLiteral",
		pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
	})
	const NumberLiteral = createToken({
		name: "NumberLiteral",
		pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
	})
	const WhiteSpace = createToken({
		name: "WhiteSpace",
		pattern: /\s+/,
		group: Lexer.SKIPPED,
		line_breaks: true
	})

	const allTokens = [
		WhiteSpace,
		NumberLiteral,
		StringLiteral,
		LCurly,
		RCurly,
		LSquare,
		RSquare,
		Comma,
		Colon,
		True,
		False,
		Null
	]
	const JsonLexer = new Lexer(allTokens)

	// ----------------- parser -----------------

	function JsonParser(input) {
		// invoke super constructor
		Parser.call(this, input, allTokens)

		// not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
		const $ = this

		this.RULE("json", function() {
			// prettier-ignore
			$.OR([
                {ALT: function() {$.SUBRULE($.object)}},
                {ALT: function() {$.SUBRULE($.array)}}
            ])
		})

		this.RULE("object", function() {
			$.CONSUME(LCurly)
			$.OPTION(function() {
				$.SUBRULE($.objectItem)
				$.MANY(function() {
					$.CONSUME(Comma)
					$.SUBRULE2($.objectItem)
				})
			})
			$.CONSUME(RCurly)
		})

		this.RULE("objectItem", function() {
			$.CONSUME(StringLiteral)
			$.CONSUME(Colon)
			$.SUBRULE($.value)
		})

		this.RULE("array", function() {
			$.CONSUME(LSquare)
			$.OPTION(function() {
				$.SUBRULE($.value)
				$.MANY(function() {
					$.CONSUME(Comma)
					$.SUBRULE2($.value)
				})
			})
			$.CONSUME(RSquare)
		})

		this.RULE("value", function() {
			// prettier-ignore
			$.OR([
                {ALT: function() {$.CONSUME(StringLiteral)}},
                {ALT: function() {$.CONSUME(NumberLiteral)}},
                {ALT: function() {$.SUBRULE($.object)}},
                {ALT: function() {$.SUBRULE($.array)}},
                {ALT: function() {$.CONSUME(True)}},
                {ALT: function() {$.CONSUME(False)}},
                {ALT: function() {$.CONSUME(Null)}}
            ])
		})

		// very important to call this after all the rules have been defined.
		// otherwise the parser may not work correctly as it will lack information
		// derived during the self analysis phase.
		Parser.performSelfAnalysis(this)
	}

	// inheritance as implemented in javascript in the previous decade... :(
	JsonParser.prototype = Object.create(Parser.prototype)
	JsonParser.prototype.constructor = JsonParser

	// ----------------- wrapping it all together -----------------

	// reuse the same parser instance.
	const parser = new JsonParser([])

	return {
		parse: function(text) {
			const lexResult = JsonLexer.tokenize(text)

			// setting a new input will RESET the parser instance's state.
			parser.input = lexResult.tokens

			// any top level rule may be used as an entry point
			const value = parser.json()

			return {
				value: value, // this is a pure grammar, the value will always be <undefined>
				lexErrors: lexResult.errors,
				parseErrors: parser.errors
			}
		},

		parserInstance: parser
	}
})
