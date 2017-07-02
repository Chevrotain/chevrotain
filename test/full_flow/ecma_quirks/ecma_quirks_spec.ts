import { parse } from "./ecma_quirks"

describe("ECMAScript Quirks Example (ScannerLess Mode)", () => {
    it("can parse a valid text successfully", () => {
        const result = parse("return ;")
        expect(result.errors).to.be.empty
    })
})
