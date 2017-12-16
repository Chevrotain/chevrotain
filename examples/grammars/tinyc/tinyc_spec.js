const assert = require("assert")
const parseTinyC = require("./tinyc")

describe("The TinyC Grammar", function() {
	it("can parse a simple TinyC sample without errors", function() {
		const inputText =
			"{ " +
			"i=125;" +
			" j=100;" +
			" while (i-j)" +
			"   if (i<j) " +
			"       j=j-i; " +
			"   else i=i-j;" +
			"}"
		const lexAndParseResult = parseTinyC(inputText)

		assert.equal(lexAndParseResult.lexErrors.length, 0)
		assert.equal(lexAndParseResult.parseErrors.length, 0)
	})
})
