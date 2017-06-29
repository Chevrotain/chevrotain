"use strict"

let expect = require("chai").expect
let customPatternExample = require("./custom_patterns")

let tokenize = customPatternExample.tokenize
let tokenMatcher = require("chevrotain").tokenMatcher
let Comma = customPatternExample.Comma
let IntegerLiteral = customPatternExample.IntegerLiteral

describe("The Chevrotain Lexer ability to use custom pattern implementations.", () => {
    it("Can Lex a simple input using a Custom Integer Literal RegExp", () => {
        let text = `1 , 2 , 3`
        let lexResult = tokenize(text)

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
