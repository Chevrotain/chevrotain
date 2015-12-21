
var expect = chai.expect

module ecma5.lexer.spec {

    describe("The ECMAScript5 lexer example", function () {

        it("it can lex some Punctuators", function () {
            var input = "!==||&&!;>>>="
            var lexResult = lex(input)
            expect(lexResult.tokens.length).to.equal(6)
            expect(lexResult.tokens[0]).to.be.an.instanceof(NotEqEq)
            expect(lexResult.tokens[0].image).to.equal("!==")
            expect(lexResult.tokens[0].startLine).to.equal(1)
            expect(lexResult.tokens[0].startColumn).to.equal(1)

            expect(lexResult.tokens[1]).to.be.an.instanceof(VerticalBarVerticalBar)
            expect(lexResult.tokens[1].image).to.equal("||")
            expect(lexResult.tokens[1].startLine).to.equal(1)
            expect(lexResult.tokens[1].startColumn).to.equal(4)

            expect(lexResult.tokens[2]).to.be.an.instanceof(AmpersandAmpersand)
            expect(lexResult.tokens[2].image).to.equal("&&")
            expect(lexResult.tokens[2].startLine).to.equal(1)
            expect(lexResult.tokens[2].startColumn).to.equal(6)

            expect(lexResult.tokens[3]).to.be.an.instanceof(Exclamation)
            expect(lexResult.tokens[3].image).to.equal("!")
            expect(lexResult.tokens[3].startLine).to.equal(1)
            expect(lexResult.tokens[3].startColumn).to.equal(8)

            expect(lexResult.tokens[4]).to.be.an.instanceof(Semicolon)
            expect(lexResult.tokens[4].image).to.equal(";")
            expect(lexResult.tokens[4].startLine).to.equal(1)
            expect(lexResult.tokens[4].startColumn).to.equal(9)

            expect(lexResult.tokens[5]).to.be.an.instanceof(MoreMoreMoreEq)
            expect(lexResult.tokens[5].image).to.equal(">>>=")
            expect(lexResult.tokens[5].startLine).to.equal(1)
            expect(lexResult.tokens[5].startColumn).to.equal(10)
        })

        it("it can lex some Identifiers and keywords", function () {
            var input = "ima var bamba"
            var lexResult = lex(input)
            expect(lexResult.tokens.length).to.equal(3)
            expect(lexResult.tokens[0]).to.be.an.instanceof(Identifier)
            expect(lexResult.tokens[0].image).to.equal("ima")
            expect(lexResult.tokens[0].startLine).to.equal(1)
            expect(lexResult.tokens[0].startColumn).to.equal(1)

            expect(lexResult.tokens[1]).to.be.an.instanceof(VarTok)
            expect(lexResult.tokens[1].image).to.equal("var")
            expect(lexResult.tokens[1].startLine).to.equal(1)
            expect(lexResult.tokens[1].startColumn).to.equal(5)

            expect(lexResult.tokens[2]).to.be.an.instanceof(Identifier)
            expect(lexResult.tokens[2].image).to.equal("bamba")
            expect(lexResult.tokens[2].startLine).to.equal(1)
            expect(lexResult.tokens[2].startColumn).to.equal(9)
        })

        it("it can lex some escaped identifiers", function () {
            var input = "v\\u0061r \\u0061ba "
            var lexResult = lex(input)
            expect(lexResult.tokens.length).to.equal(2)
            expect(lexResult.tokens[0]).to.be.an.instanceof(VarTok)
            expect(lexResult.tokens[0].image).to.equal("var")
            expect(lexResult.tokens[0].startLine).to.equal(1)
            expect(lexResult.tokens[0].startColumn).to.equal(1)

            expect(lexResult.tokens[1]).to.be.an.instanceof(Identifier)
            expect(lexResult.tokens[1].image).to.equal("aba")
            expect(lexResult.tokens[1].startLine).to.equal(1)
            expect(lexResult.tokens[1].startColumn).to.equal(10)
        })

        it("it can lex some string literals", function () {
            var input = "'hello' \"world\""
            var lexResult = lex(input)
            expect(lexResult.tokens.length).to.equal(2)
            expect(lexResult.tokens[0]).to.be.an.instanceof(SingleQuotationStringLiteral)
            expect(lexResult.tokens[0].image).to.equal("'hello'")
            expect(lexResult.tokens[0].startLine).to.equal(1)
            expect(lexResult.tokens[0].startColumn).to.equal(1)

            expect(lexResult.tokens[1]).to.be.an.instanceof(DoubleQuotationStringLiteral)
            expect(lexResult.tokens[1].image).to.equal("\"world\"")
            expect(lexResult.tokens[1].startLine).to.equal(1)
            expect(lexResult.tokens[1].startColumn).to.equal(9)
        })


        it("it can lex a string literal with escaped symbols", function () {
            var input = "'he\\u00A9llo'"
            var lexResult = lex(input)
            expect(lexResult.tokens.length).to.equal(1)
            expect(lexResult.tokens[0]).to.be.an.instanceof(SingleQuotationStringLiteral)
            expect(lexResult.tokens[0].image).to.equal("'he\u00A9llo'")
            expect(lexResult.tokens[0].startLine).to.equal(1)
            expect(lexResult.tokens[0].startColumn).to.equal(1)
        })


        it("it can lex some number literals", function () {
            var input = "654 .123 123E4 999e-4 777E+4 0x5Bbf1"
            var lexResult = lex(input)
            expect(lexResult.tokens.length).to.equal(6)
            expect(lexResult.tokens[0]).to.be.an.instanceof(DecimalLiteral)
            expect(lexResult.tokens[0].image).to.equal("654")
            expect(lexResult.tokens[0].startLine).to.equal(1)
            expect(lexResult.tokens[0].startColumn).to.equal(1)

            expect(lexResult.tokens[1]).to.be.an.instanceof(DecimalLiteral)
            expect(lexResult.tokens[1].image).to.equal(".123")
            expect(lexResult.tokens[1].startLine).to.equal(1)
            expect(lexResult.tokens[1].startColumn).to.equal(5)

            expect(lexResult.tokens[2]).to.be.an.instanceof(DecimalLiteral)
            expect(lexResult.tokens[2].image).to.equal("123E4")
            expect(lexResult.tokens[2].startLine).to.equal(1)
            expect(lexResult.tokens[2].startColumn).to.equal(10)

            expect(lexResult.tokens[3]).to.be.an.instanceof(DecimalLiteral)
            expect(lexResult.tokens[3].image).to.equal("999e-4")
            expect(lexResult.tokens[3].startLine).to.equal(1)
            expect(lexResult.tokens[3].startColumn).to.equal(16)

            expect(lexResult.tokens[4]).to.be.an.instanceof(DecimalLiteral)
            expect(lexResult.tokens[4].image).to.equal("777E+4")
            expect(lexResult.tokens[4].startLine).to.equal(1)
            expect(lexResult.tokens[4].startColumn).to.equal(23)

            expect(lexResult.tokens[5]).to.be.an.instanceof(HexIntegerLiteral)
            expect(lexResult.tokens[5].image).to.equal("0x5Bbf1")
            expect(lexResult.tokens[5].startLine).to.equal(1)
            expect(lexResult.tokens[5].startColumn).to.equal(30)
        })

        it("it can lex input with line terminators", function () {
            var input = "ima\n" +
                "aba\r\n" +
                "bamba\r"

            var lexResult = lex(input)
            expect(lexResult.tokens.length).to.equal(3)
            expect(lexResult.whitespace.length).to.equal(3)
            expect(_.keys(lexResult.idxTolineTerminators).length).to.equal(3)

            expect(lexResult.tokens[0]).to.be.an.instanceof(Identifier)
            expect(lexResult.tokens[0].image).to.equal("ima")
            expect(lexResult.tokens[0].startLine).to.equal(1)
            expect(lexResult.tokens[0].startColumn).to.equal(1)

            expect(lexResult.tokens[1]).to.be.an.instanceof(Identifier)
            expect(lexResult.tokens[1].image).to.equal("aba")
            expect(lexResult.tokens[1].startLine).to.equal(2)
            expect(lexResult.tokens[1].startColumn).to.equal(1)

            expect(lexResult.tokens[2]).to.be.an.instanceof(Identifier)
            expect(lexResult.tokens[2].image).to.equal("bamba")
            expect(lexResult.tokens[2].startLine).to.equal(3)
            expect(lexResult.tokens[2].startColumn).to.equal(1)

            expect(lexResult.whitespace[0]).to.be.an.instanceof(Whitespace)
            expect(lexResult.whitespace[0].image).to.equal("\n")
            expect(lexResult.whitespace[0].startLine).to.equal(1)
            expect(lexResult.whitespace[0].startColumn).to.equal(4)

            expect(lexResult.whitespace[1]).to.be.an.instanceof(Whitespace)
            expect(lexResult.whitespace[1].image).to.equal("\r\n")
            expect(lexResult.whitespace[1].startLine).to.equal(2)
            expect(lexResult.whitespace[1].startColumn).to.equal(4)

            expect(lexResult.whitespace[2]).to.be.an.instanceof(Whitespace)
            expect(lexResult.whitespace[2].image).to.equal("\r")
            expect(lexResult.whitespace[2].startLine).to.equal(3)
            expect(lexResult.whitespace[2].startColumn).to.equal(6)

            expect(lexResult.whitespace[0]).to.equal(lexResult.idxTolineTerminators[1])
            expect(lexResult.whitespace[1]).to.equal(lexResult.idxTolineTerminators[2])
            expect(lexResult.whitespace[2]).to.equal(lexResult.idxTolineTerminators[3])
        })

        it("it can lex some comments", function () {
            var input = "// I am a comment\n" +
                " /* multi line comment with only a single line */\n" +
                "/* multi line comment with more than one line\n" +
                "   I am second line! */"
            var lexResult = lex(input)
            expect(lexResult.comments.length).to.equal(3)
            expect(lexResult.comments[0]).to.be.an.instanceof(SingleLineComment)
            expect(lexResult.comments[0].image).to.equal("// I am a comment")
            expect(lexResult.comments[0].startLine).to.equal(1)
            expect(lexResult.comments[0].startColumn).to.equal(1)

            expect(lexResult.comments[1]).to.be.an.instanceof(MultipleLineCommentWithoutTerminator)
            expect(lexResult.comments[1].image).to.equal("/* multi line comment with only a single line */")
            expect(lexResult.comments[1].startLine).to.equal(2)
            expect(lexResult.comments[1].startColumn).to.equal(2)

            expect(lexResult.comments[2]).to.be.an.instanceof(MultipleLineCommentWithTerminator)
            expect(lexResult.comments[2].image).to.equal("/* multi line comment with more than one line\n" +
                "   I am second line! */")
            expect(lexResult.comments[2].startLine).to.equal(3)
            expect(lexResult.comments[2].startColumn).to.equal(1)
        })

    })

}
