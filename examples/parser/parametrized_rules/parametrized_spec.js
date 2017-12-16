var expect = require("chai").expect
var chevrotain = require("chevrotain")
var NoViableAltException = chevrotain.exceptions.NoViableAltException

var parseHello = (parseHello = require("./parametrized"))

var POSITIVE = "positive"
var NEGATIVE = "negative"

describe("The Grammar Parametrized Rules example - using ES6 syntax", function() {
	it("can parse a cheerful hello sentence in <positive> mode", function() {
		var inputText = "hello wonderful world"
		var result = parseHello(inputText, POSITIVE)

		expect(result.lexErrors).to.be.empty
		expect(result.parseErrors).to.be.empty
	})

	it("cannot parse a cheerful hello sentence in <negative> mode", function() {
		var inputText = "hello amazing world"
		var result = parseHello(inputText, NEGATIVE)

		expect(result.lexErrors).to.be.empty
		expect(result.parseErrors).to.have.lengthOf(1)
		expect(result.parseErrors[0]).to.be.an.instanceof(NoViableAltException)
	})

	it("cannot parse a sad hello sentence in <positive> mode", function() {
		var inputText = "hello evil world"
		var result = parseHello(inputText, POSITIVE)

		expect(result.lexErrors).to.be.empty
		expect(result.parseErrors).to.have.lengthOf(1)
		expect(result.parseErrors[0]).to.be.an.instanceof(NoViableAltException)
	})

	it("can parse a sad hello sentence in <negative> mode", function() {
		var inputText = "hello cruel world"
		var result = parseHello(inputText, NEGATIVE)

		expect(result.lexErrors).to.be.empty
		expect(result.parseErrors).to.be.empty
	})
})
