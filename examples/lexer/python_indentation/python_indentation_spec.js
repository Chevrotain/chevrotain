"use strict"

const expect = require("chai").expect
const ie = require("./python_indentation")
const { tokenMatcher } = require("chevrotain")
const tokenize = ie.tokenize

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
        expect(tokenMatcher(actualTokens[0], ie.If)).to.be.true
        expect(tokenMatcher(actualTokens[1], ie.LParen)).to.be.true
        expect(tokenMatcher(actualTokens[2], ie.IntegerLiteral)).to.be.true
        expect(tokenMatcher(actualTokens[3], ie.RParen)).to.be.true
        expect(tokenMatcher(actualTokens[4], ie.Indent)).to.be.true
        expect(tokenMatcher(actualTokens[5], ie.If)).to.be.true
        expect(tokenMatcher(actualTokens[6], ie.LParen)).to.be.true
        expect(tokenMatcher(actualTokens[7], ie.IntegerLiteral)).to.be.true
        expect(tokenMatcher(actualTokens[8], ie.RParen)).to.be.true
        expect(tokenMatcher(actualTokens[9], ie.Indent)).to.be.true
        expect(tokenMatcher(actualTokens[10], ie.If)).to.be.true
        expect(tokenMatcher(actualTokens[11], ie.LParen)).to.be.true
        expect(tokenMatcher(actualTokens[12], ie.IntegerLiteral)).to.be.true
        expect(tokenMatcher(actualTokens[13], ie.RParen)).to.be.true
        expect(tokenMatcher(actualTokens[14], ie.Indent)).to.be.true
        expect(tokenMatcher(actualTokens[15], ie.Print)).to.be.true
        expect(tokenMatcher(actualTokens[16], ie.IntegerLiteral)).to.be.true
        expect(tokenMatcher(actualTokens[17], ie.Outdent)).to.be.true
        expect(tokenMatcher(actualTokens[18], ie.Outdent)).to.be.true
        expect(tokenMatcher(actualTokens[19], ie.Else)).to.be.true
        expect(tokenMatcher(actualTokens[20], ie.Indent)).to.be.true
        expect(tokenMatcher(actualTokens[21], ie.Print)).to.be.true
        expect(tokenMatcher(actualTokens[22], ie.IntegerLiteral)).to.be.true
        expect(tokenMatcher(actualTokens[23], ie.Outdent)).to.be.true
        expect(tokenMatcher(actualTokens[24], ie.Outdent)).to.be.true
    })

    it("Can Lex another simple python style if-else ", () => {
        const input =
            "if 1\n" + "  if 2\n" + "    if 3\n" + "else\n" + "  print 666\n"

        const lexResult = tokenize(input)
        const actualTokenTypes = lexResult.tokens.map(tok => tok.tokenType.name)
        expect(actualTokenTypes).to.eql([
            "If",
            "IntegerLiteral",
            "Indent",
            "If",
            "IntegerLiteral",
            "Indent",
            "If",
            "IntegerLiteral",
            // TODO: BUG there should be two outdents before the else
            "Else",
            // TODO: BUG there should an indent before the print
            "Outdent",
            "Print",
            "IntegerLiteral",
            // TODO: verify we should output outdents on EOF (probably true)
            "Outdent"
        ])
    })
})
