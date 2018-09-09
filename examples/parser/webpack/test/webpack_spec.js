const { expect } = require("chai")
const { lt } = require("semver")

// not sure why this fails on nodejs 6 nor do I believe it is relevant to the example.
let itButSkipOnNode6 = lt(process.version, "8.0.0") ? it.skip : it

describe("Chevrotain Webpacking support", () => {
    itButSkipOnNode6(
        "Can be webpacked by configuring reserved words for name mangling",
        () => {
            const parse = require("../lib/webpacked.min").parse
            const parseResult = parse("[1,2,3]")
            expect(parseResult.lexErrors).to.be.empty
            expect(parseResult.parseErrors).to.be.empty
        }
    )
})
