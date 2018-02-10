"use strict"

const expect = require("chai").expect
const indentationExample = require("./python_indentation")
const { tokenMatcher } = require("chevrotain")
const tokenize = indentationExample.tokenize

describe("The Chevrotain Lexer ability to lex python like indentation.", () => {
    it("Can Lex a simple python style if-else ", () => {
        let input =
            "if (1)\n" +
            "  if (2)\n" +
            "    if(3)\n" +
            "      print 666\n" +
            "  else\n" +
            "    print 999\n"

        let lexResult = tokenize(input)
        let actualTokens = lexResult.tokens
        expect(tokenMatcher(actualTokens[0], indentationExample.If)).to.be.true
        expect(tokenMatcher(actualTokens[1], indentationExample.LParen)).to.be
            .true
        expect(tokenMatcher(actualTokens[2], indentationExample.IntegerLiteral))
            .to.be.true
        expect(tokenMatcher(actualTokens[3], indentationExample.RParen)).to.be
            .true
        expect(tokenMatcher(actualTokens[4], indentationExample.Indent)).to.be
            .true
        expect(tokenMatcher(actualTokens[5], indentationExample.If)).to.be.true
        expect(tokenMatcher(actualTokens[6], indentationExample.LParen)).to.be
            .true
        expect(tokenMatcher(actualTokens[7], indentationExample.IntegerLiteral))
            .to.be.true
        expect(tokenMatcher(actualTokens[8], indentationExample.RParen)).to.be
            .true
        expect(tokenMatcher(actualTokens[9], indentationExample.Indent)).to.be
            .true
        expect(tokenMatcher(actualTokens[10], indentationExample.If)).to.be.true
        expect(tokenMatcher(actualTokens[11], indentationExample.LParen)).to.be
            .true
        expect(
            tokenMatcher(actualTokens[12], indentationExample.IntegerLiteral)
        ).to.be.true
        expect(tokenMatcher(actualTokens[13], indentationExample.RParen)).to.be
            .true
        expect(tokenMatcher(actualTokens[14], indentationExample.Indent)).to.be
            .true
        expect(tokenMatcher(actualTokens[15], indentationExample.Print)).to.be
            .true
        expect(
            tokenMatcher(actualTokens[16], indentationExample.IntegerLiteral)
        ).to.be.true
        expect(tokenMatcher(actualTokens[17], indentationExample.Outdent)).to.be
            .true
        expect(tokenMatcher(actualTokens[18], indentationExample.Outdent)).to.be
            .true
        expect(tokenMatcher(actualTokens[19], indentationExample.Else)).to.be
            .true
        expect(tokenMatcher(actualTokens[20], indentationExample.Indent)).to.be
            .true
        expect(tokenMatcher(actualTokens[21], indentationExample.Print)).to.be
            .true
        expect(
            tokenMatcher(actualTokens[22], indentationExample.IntegerLiteral)
        ).to.be.true
        expect(tokenMatcher(actualTokens[23], indentationExample.Outdent)).to.be
            .true
        expect(tokenMatcher(actualTokens[24], indentationExample.Outdent)).to.be
            .true
    })
})
