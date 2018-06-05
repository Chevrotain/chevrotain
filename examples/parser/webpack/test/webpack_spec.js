const { expect } = require("chai")

describe("Chevrotain Webpacking support", () => {
    it("Can be webpacked without any special configuration when the grammar and tokens are defined in the same file", () => {
        const parse = require("../lib/webpacked.min").parse
        const parseResult = parse("[1,2,3]")
        expect(parseResult.errors).to.be.empty
    })
})
