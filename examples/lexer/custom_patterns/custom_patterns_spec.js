"use strict"

let expect = require("chai").expect
let customPatternExample = require("./custom_patterns")

let tokenize = customPatternExample.tokenize
let Comma = customPatternExample.Comma
let IntegerLiteral = customPatternExample.IntegerLiteral

describe('The Chevrotain Lexer ability to use custom pattern implementations.', () => {

    it('Can Lex a simple input using a Custom Integer Literal RegExp', () => {
        let text = `1 , 2 , 3`
        let lexResult = tokenize(text)

        expect(lexResult.errors).to.be.empty
        expect(lexResult.tokens).to.have.lengthOf(5)
        expect(lexResult.tokens[0]).to.be.an.instanceof(IntegerLiteral)
        expect(lexResult.tokens[1]).to.be.an.instanceof(Comma)
        expect(lexResult.tokens[2]).to.be.an.instanceof(IntegerLiteral)
        expect(lexResult.tokens[3]).to.be.an.instanceof(Comma)
        expect(lexResult.tokens[4]).to.be.an.instanceof(IntegerLiteral)
    })
})
