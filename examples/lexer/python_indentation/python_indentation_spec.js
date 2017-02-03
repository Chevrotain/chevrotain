"use strict"

let expect = require("chai").expect
let indentationExample = require("./python_indentation")
let tokenize = indentationExample.tokenize

describe('The Chevrotain Lexer ability to lex python like indentation.', () => {

    it('Can Lex a simple python style if-else ', () => {
        let input =
            "if (1)\n" +
            "  print 5\n" +
            "else\n" +
            "  if (2)\n" +
            "    print 666\n" +
            "  else\n" +
            "    print 999\n" +
            ""

        let lexResult = tokenize(input)
        let actualTokens = lexResult.tokens
        expect(actualTokens[0]).to.be.an.instanceOf(indentationExample.If)
        expect(actualTokens[1]).to.be.an.instanceOf(indentationExample.LParen)
        expect(actualTokens[2]).to.be.an.instanceOf(indentationExample.IntegerLiteral)
        expect(actualTokens[3]).to.be.an.instanceOf(indentationExample.RParen)
        expect(actualTokens[4]).to.be.an.instanceOf(indentationExample.Indent)
        expect(actualTokens[5]).to.be.an.instanceOf(indentationExample.Print)
        expect(actualTokens[6]).to.be.an.instanceOf(indentationExample.IntegerLiteral)
        expect(actualTokens[7]).to.be.an.instanceOf(indentationExample.Outdent)
        expect(actualTokens[8]).to.be.an.instanceOf(indentationExample.Else)
        expect(actualTokens[9]).to.be.an.instanceOf(indentationExample.Indent)
        expect(actualTokens[10]).to.be.an.instanceOf(indentationExample.If)
        expect(actualTokens[11]).to.be.an.instanceOf(indentationExample.LParen)
        expect(actualTokens[12]).to.be.an.instanceOf(indentationExample.IntegerLiteral)
        expect(actualTokens[13]).to.be.an.instanceOf(indentationExample.RParen)
        expect(actualTokens[14]).to.be.an.instanceOf(indentationExample.Indent)
        expect(actualTokens[15]).to.be.an.instanceOf(indentationExample.Print)
        expect(actualTokens[16]).to.be.an.instanceOf(indentationExample.IntegerLiteral)
        expect(actualTokens[17]).to.be.an.instanceOf(indentationExample.Outdent)
        expect(actualTokens[18]).to.be.an.instanceOf(indentationExample.Else)
        expect(actualTokens[19]).to.be.an.instanceOf(indentationExample.Indent)
        expect(actualTokens[20]).to.be.an.instanceOf(indentationExample.Print)
        expect(actualTokens[21]).to.be.an.instanceOf(indentationExample.IntegerLiteral)
        expect(actualTokens[17]).to.be.an.instanceOf(indentationExample.Outdent)
    })
})
