var expect = require("chai").expect
var rules = require("./multi_start_rules")

describe("The Chevrotain support using any rule as a start/top rule", function() {
	it("can invoke the first rule successfully", function() {
		expect(function() {
			rules.parseFirst("A B C")
		}).to.not.throw("sad sad panda")
		expect(function() {
			rules.parseFirst("A")
		}).to.not.throw("sad sad panda")
	})

	it("can invoke the second rule successfully", function() {
		expect(function() {
			rules.parseSecond("B C")
		}).to.not.throw("sad sad panda")
		expect(function() {
			rules.parseSecond("B")
		}).to.not.throw("sad sad panda")
	})

	it("can invoke the third rule successfully", function() {
		expect(function() {
			rules.parseThird("C")
		}).to.not.throw("sad sad panda")
	})
})
