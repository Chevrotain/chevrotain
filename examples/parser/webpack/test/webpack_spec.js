const { expect } = require("chai")

describe("Chevrotain Webpacking support", () => {
    it("Can be webpacked without any special configuration when the grammar and tokens are defined in the same file", () => {
        const parse = require("../gen/tokens_and_grammar.bundle").parse
        const parseResult = parse("[1,2,3]")
        expect(parseResult.errors).to.be.empty
    })

    it("Cannot be webpacked when the grammar and tokens are defined separately and the tokens are imported via ES6 imports", () => {
        expect(() =>
            require("../gen/grammar_only_es6.bundle").parse("[1,2,3]")
        ).to.throw(/Terminal Token name:.+WEBPACK_IMPORTED_MODULE.+not found/)
    })

    it("can be webpacked when the grammar and tokens are defined separately and the tokens are imported via commonjs require", () => {
        const parse = require("../gen/grammar_only_commonjs.bundle").parse
        const parseResult = parse("[1,2,3]")
        expect(parseResult.errors).to.be.empty
    })
})
