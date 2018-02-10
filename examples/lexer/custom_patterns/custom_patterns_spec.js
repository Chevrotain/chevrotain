const expect = require("chai").expect
const { tokenize, Comma, IntegerLiteral } = require("./custom_patterns")
const tokenMatcher = require("chevrotain").tokenMatcher

describe("The Chevrotain Lexer ability to use custom pattern implementations.", () => {
    it("Can Lex a simple input using a Custom Integer Literal RegExp", () => {
        const text = `1 , 2 , 3`
        const lexResult = tokenize(text)

        expect(lexResult.errors).to.be.empty
        expect(lexResult.tokens).to.have.lengthOf(5)
        expect(tokenMatcher(lexResult.tokens[0], IntegerLiteral))
        expect(lexResult.tokens[0].image).to.equal("1")
        expect(tokenMatcher(lexResult.tokens[1], Comma))
        expect(tokenMatcher(lexResult.tokens[2], IntegerLiteral))
        expect(lexResult.tokens[2].image).to.equal("2")
        expect(tokenMatcher(lexResult.tokens[3], Comma))
        expect(tokenMatcher(lexResult.tokens[4], IntegerLiteral))
        expect(lexResult.tokens[4].image).to.equal("3")
    })
})
