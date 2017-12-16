"use strict"

const path = require("path")
const fs = require("fs")
const assert = require("assert")
const parseCsv = require("./csv")

describe("The CSV Grammar", () => {
	const samplePath = path.resolve(__dirname, "./sample.csv")
	const sampleCsvText = fs.readFileSync(samplePath, "utf8").toString()

	it("can parse a simple CSV without errors", () => {
		const lexAndParseResult = parseCsv(sampleCsvText)

		assert.equal(lexAndParseResult.lexResult.errors.length, 0)
		assert.equal(lexAndParseResult.parseErrors.length, 0)
	})
})
