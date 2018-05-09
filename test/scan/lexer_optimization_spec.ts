import { createToken } from "../../src/scan/tokens_public"
import { Lexer } from "../../src/scan/lexer_public"
import { getStartCodes } from "../../src/scan/reg_exp"

describe("The Chevrotain Lexer Optimizations", () => {
    it("Will re-attempt none 'optimized' patterns if the optimization failed", () => {
        // won't be automatically optimized due to the '|' meta characters
        const Boolean = createToken({
            name: "Boolean",
            pattern: /true|false/,
            // But we provide the hints so it can be optimized
            start_chars_hint: ["t", "f"]
        })
        // simple string can perform optimization
        const Function = createToken({ name: "Function", pattern: "function" })
        // won't be optimized due to the '\w' and '+'
        const Name = createToken({ name: "False", pattern: /\w+/ })

        const WhiteSpace = createToken({
            name: "WhiteSpace",
            pattern: /\s+/,
            group: Lexer.SKIPPED,
            line_breaks: true
        })

        const allTokens = [WhiteSpace, Boolean, Function, Name]
        const JsonLexer = new Lexer(allTokens)
        const lexResult = JsonLexer.tokenize("fool")
        expect(lexResult.tokens).to.have.lengthOf(1)
        expect(lexResult.tokens[0].tokenType).to.equal(Name)
    })
})

describe("the regExp analysis", () => {
    context("first codes", () => {
        it("can compute for string literal", () => {
            expect(
                getStartCodes(
                    /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
                )
            ).to.deep.equal([34])
        })

        it("can compute with assertions", () => {
            expect(getStartCodes(/^$\b\Ba/)).to.deep.equal([97])
        })

        it("can compute with optional quantifiers", () => {
            expect(getStartCodes(/b*a/)).to.deep.equal([98, 97])
        })

        it("will not compute when using complements", () => {
            expect(getStartCodes(/\D/)).to.be.empty
        })

        it("Can compute for ignore case", () => {
            expect(getStartCodes(/w|A/i)).to.deep.equal([119, 87, 65, 97])
        })

        it("will not compute when using complements #2", () => {
            expect(getStartCodes(/[^a-z]/, true)).to.be.empty
        })
    })
})
