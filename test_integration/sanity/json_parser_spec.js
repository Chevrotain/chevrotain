;(function(root, factory) {
	if (typeof define === "function" && define.amd) {
		// AMD. Register as an anonymous module.
		define(["chevrotain"], factory)
	} else {
		factory(root.chevrotain)
	}
})(this, function(chevrotain) {
	// ----------------- lexer -----------------
	var createToken = chevrotain.createToken
	var Lexer = chevrotain.Lexer
	var Parser = chevrotain.Parser

	// In ES6, custom inheritance implementation (such as 'createToken({name:...)') can be replaced with simple "class X extends Y"...
	var True = createToken({ name: "True", pattern: /true/ })
	var False = createToken({ name: "False", pattern: /false/ })
	var Null = createToken({ name: "Null", pattern: /null/ })
	var LCurly = createToken({ name: "LCurly", pattern: /{/ })
	var RCurly = createToken({ name: "RCurly", pattern: /}/ })
	var LSquare = createToken({ name: "LSquare", pattern: /\[/ })
	var RSquare = createToken({ name: "RSquare", pattern: /]/ })
	var Comma = createToken({ name: "Comma", pattern: /,/ })
	var Colon = createToken({ name: "Colon", pattern: /:/ })
	var StringLiteral = createToken({
		name: "StringLiteral",
		pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
	})
	var NumberLiteral = createToken({
		name: "NumberLiteral",
		pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
	})
	var WhiteSpace = createToken({
		name: "WhiteSpace",
		pattern: /\s+/,
		group: Lexer.SKIPPED,
		line_breaks: true
	})

	var allTokens = [
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
	var JsonLexer = new Lexer(allTokens)

	// ----------------- parser -----------------
	function JsonParser(input) {
		// invoke super constructor
		Parser.call(this, input, allTokens)

		// not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
		var $ = this

		this.json = this.RULE("json", function() {
			// prettier-ignore
			$.OR([
                {ALT: function() {$.SUBRULE($.object)}},
                {ALT: function() {$.SUBRULE($.array)}}
            ])
		})

		this.object = this.RULE("object", function() {
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

		this.objectItem = this.RULE("objectItem", function() {
			$.CONSUME(StringLiteral)
			$.CONSUME(Colon)
			$.SUBRULE($.value)
		})

		this.array = this.RULE("array", function() {
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

		this.value = this.RULE("value", function() {
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
	var parser = new JsonParser([])

	function parseJson(text) {
		var lexResult = JsonLexer.tokenize(text)

		// setting a new input will RESET the parser instance's state.
		parser.input = lexResult.tokens

		// any top level rule may be used as an entry point
		var value = parser.json()

		return {
			value: value, // this is a pure grammar, the value will always be <undefined>
			lexErrors: lexResult.errors,
			parseErrors: parser.errors
		}
	}

	describe("The Json Parser", function() {
		it("can parse a simple Json without errors", function() {
			var inputText = '{ "arr": [1,2,3], "obj": {"num":666}}'
			var lexAndParseResult = parseJson(inputText)

			expect(lexAndParseResult.lexErrors).to.be.empty
			expect(lexAndParseResult.parseErrors).to.be.empty
		})

		// attempt to resolve random failures when running multiple (separate) karma tests
		// on travis-ci + chrome.
		after(function(done) {
			setTimeout(done, 1000)
		})
	})
})
