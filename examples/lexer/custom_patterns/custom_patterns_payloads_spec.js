const expect = require("chai").expect
const {
    tokenize,
    StringLiteral,
    DateLiteral
} = require("./custom_patterns_payloads")

const tokenMatcher = require("chevrotain").tokenMatcher

describe("The Chevrotain Lexer ability to use custom pattern implementations.", () => {
    context("Custom Payloads", () => {
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
