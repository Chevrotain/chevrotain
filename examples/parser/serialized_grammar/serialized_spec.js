const { expect } = require("chai")
describe("Chevrotain serialized grammar support", () => {
    let oldNodeEnv
    before(() => {
        oldNodeEnv = process.env.NODE_ENV
        process.env.NODE_ENV = "production"
    })
    it("Can use a serialized grammar", () => {
        const { parse } = require("./grammar")
        const inputText = "ABC"
        const lexAndParseResult = parse(inputText)
        expect(lexAndParseResult.lexErrors).to.be.empty
        expect(lexAndParseResult.parseErrors).to.be.empty
    })
    after(() => {
        process.env.NODE_ENV = oldNodeEnv
    })
})
