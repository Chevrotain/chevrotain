const expect = require("chai").expect
const customPatterns = require("./custom_patterns")
const customPayloads = require("./custom_patterns_payloads")

const tokenMatcher = require("chevrotain").tokenMatcher

describe("The Chevrotain Lexer ability to use custom pattern implementations.", () => {
    const { tokenize, Comma, IntegerLiteral } = customPatterns

    it("Can Lex a simple input using a Custom Integer Literal RegExp", () => {
        const text = `1 , 2 , 3`
        const lexResult = tokenize(text)

        expect(lexResult.errors).to.be.empty
        expect(lexResult.tokens).to.have.lengthOf(5)
        expect(tokenMatcher(lexResult.tokens[0], IntegerLiteral)).to.be.true
        expect(lexResult.tokens[0].image).to.equal("1")
        expect(tokenMatcher(lexResult.tokens[1], Comma)).to.be.true
        expect(tokenMatcher(lexResult.tokens[2], IntegerLiteral)).to.be.true
        expect(lexResult.tokens[2].image).to.equal("2")
        expect(tokenMatcher(lexResult.tokens[3], Comma)).to.be.true
        expect(tokenMatcher(lexResult.tokens[4], IntegerLiteral)).to.be.true
        expect(lexResult.tokens[4].image).to.equal("3")
    })

    context("Custom Payloads", () => {
        const { tokenize, StringLiteral, DateLiteral } = customPayloads

        it("Can be used to save the text of a string literal **without the quotes**", () => {
            const text = `"hello-world"`
            const lexResult = tokenize(text)

            expect(lexResult.errors).to.be.empty
            expect(lexResult.tokens).to.have.lengthOf(1)
            const stringLiteralTok = lexResult.tokens[0]
            expect(tokenMatcher(stringLiteralTok, StringLiteral))
            // Base Token's "image" with quotes
            expect(stringLiteralTok.image).to.eql('"hello-world"')
            // stripped away quotes in the payload
            expect(stringLiteralTok.payload).to.eql("hello-world")
        })

        it("Can be used to save the integer values of a DateLiteral parts", () => {
            const text = `31-12-1999`
            const lexResult = tokenize(text)

            expect(lexResult.errors).to.be.empty
            expect(lexResult.tokens).to.have.lengthOf(1)
            const dateLiteralTok = lexResult.tokens[0]
            expect(tokenMatcher(dateLiteralTok, DateLiteral))
            // Base Token's image
            expect(dateLiteralTok.image).to.eql("31-12-1999")
            // The payload includes multiple computed values
            expect(dateLiteralTok.payload.day).to.eql(31)
            expect(dateLiteralTok.payload.month).to.eql(12)
            expect(dateLiteralTok.payload.year).to.eql(1999)
        })
    })
})
