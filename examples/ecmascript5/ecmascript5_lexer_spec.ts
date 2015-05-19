/// <reference path="ecmascript5_parser.ts" />
/// <reference path="ecmascript5_tokens.ts" />
/// <reference path="../../libs/jasmine.d.ts" />


module chevrotain.examples.ecma5.lexer.spec {


    describe("The ECMAScript5 lexer example", function () {

        it("it can lex some Punctuators", function () {
            var input = "!==||&&!;>>>="
            var lexResult = lex(input)
            expect(lexResult.tokens.length).toBe(6)
            expect(lexResult.tokens[0]).toEqual(jasmine.any(NotEqEq))
            expect(lexResult.tokens[0].image).toBe("!==")
            expect(lexResult.tokens[0].startLine).toBe(1)
            expect(lexResult.tokens[0].startColumn).toBe(1)

            expect(lexResult.tokens[1]).toEqual(jasmine.any(VerticalBarVerticalBar))
            expect(lexResult.tokens[1].image).toBe("||")
            expect(lexResult.tokens[1].startLine).toBe(1)
            expect(lexResult.tokens[1].startColumn).toBe(4)

            expect(lexResult.tokens[2]).toEqual(jasmine.any(AmpersandAmpersand))
            expect(lexResult.tokens[2].image).toBe("&&")
            expect(lexResult.tokens[2].startLine).toBe(1)
            expect(lexResult.tokens[2].startColumn).toBe(6)

            expect(lexResult.tokens[3]).toEqual(jasmine.any(Exclamation))
            expect(lexResult.tokens[3].image).toBe("!")
            expect(lexResult.tokens[3].startLine).toBe(1)
            expect(lexResult.tokens[3].startColumn).toBe(8)

            expect(lexResult.tokens[4]).toEqual(jasmine.any(Semicolon))
            expect(lexResult.tokens[4].image).toBe(";")
            expect(lexResult.tokens[4].startLine).toBe(1)
            expect(lexResult.tokens[4].startColumn).toBe(9)

            expect(lexResult.tokens[5]).toEqual(jasmine.any(MoreMoreMoreEq))
            expect(lexResult.tokens[5].image).toBe(">>>=")
            expect(lexResult.tokens[5].startLine).toBe(1)
            expect(lexResult.tokens[5].startColumn).toBe(10)
        })

        it("it can lex some Identifiers and keywords", function () {
            var input = "ima var bamba"
            var lexResult = lex(input)
            expect(lexResult.tokens.length).toBe(3)
            expect(lexResult.tokens[0]).toEqual(jasmine.any(Identifier))
            expect(lexResult.tokens[0].image).toBe("ima")
            expect(lexResult.tokens[0].startLine).toBe(1)
            expect(lexResult.tokens[0].startColumn).toBe(1)

            expect(lexResult.tokens[1]).toEqual(jasmine.any(VarTok))
            expect(lexResult.tokens[1].image).toBe("var")
            expect(lexResult.tokens[1].startLine).toBe(1)
            expect(lexResult.tokens[1].startColumn).toBe(5)

            expect(lexResult.tokens[2]).toEqual(jasmine.any(Identifier))
            expect(lexResult.tokens[2].image).toBe("bamba")
            expect(lexResult.tokens[2].startLine).toBe(1)
            expect(lexResult.tokens[2].startColumn).toBe(9)
        })

        it("it can lex some escaped identifiers", function () {
            var input = "v\\u0061r \\u0061ba "
            var lexResult = lex(input)
            expect(lexResult.tokens.length).toBe(2)
            expect(lexResult.tokens[0]).toEqual(jasmine.any(VarTok))
            expect(lexResult.tokens[0].image).toBe("var")
            expect(lexResult.tokens[0].startLine).toBe(1)
            expect(lexResult.tokens[0].startColumn).toBe(1)

            expect(lexResult.tokens[1]).toEqual(jasmine.any(Identifier))
            expect(lexResult.tokens[1].image).toBe("aba")
            expect(lexResult.tokens[1].startLine).toBe(1)
            expect(lexResult.tokens[1].startColumn).toBe(10)
        })

        it("it can lex some string literals", function () {
            var input = "'hello' \"world\""
            var lexResult = lex(input)
            expect(lexResult.tokens.length).toBe(2)
            expect(lexResult.tokens[0]).toEqual(jasmine.any(SingleQuotationStringLiteral))
            expect(lexResult.tokens[0].image).toBe("'hello'")
            expect(lexResult.tokens[0].startLine).toBe(1)
            expect(lexResult.tokens[0].startColumn).toBe(1)

            expect(lexResult.tokens[1]).toEqual(jasmine.any(DoubleQuotationStringLiteral))
            expect(lexResult.tokens[1].image).toBe("\"world\"")
            expect(lexResult.tokens[1].startLine).toBe(1)
            expect(lexResult.tokens[1].startColumn).toBe(9)
        })


        it("it can lex a string literal with escaped symbols", function () {
            var input = "'he\\u00A9llo'"
            var lexResult = lex(input)
            expect(lexResult.tokens.length).toBe(1)
            expect(lexResult.tokens[0]).toEqual(jasmine.any(SingleQuotationStringLiteral))
            expect(lexResult.tokens[0].image).toBe("'he\u00A9llo'")
            expect(lexResult.tokens[0].startLine).toBe(1)
            expect(lexResult.tokens[0].startColumn).toBe(1)
        })


        it("it can lex some number literals", function () {
            var input = "654 .123 123E4 999e-4 777E+4 0x5Bbf1"
            var lexResult = lex(input)
            expect(lexResult.tokens.length).toBe(6)
            expect(lexResult.tokens[0]).toEqual(jasmine.any(DecimalLiteral))
            expect(lexResult.tokens[0].image).toBe("654")
            expect(lexResult.tokens[0].startLine).toBe(1)
            expect(lexResult.tokens[0].startColumn).toBe(1)

            expect(lexResult.tokens[1]).toEqual(jasmine.any(DecimalLiteral))
            expect(lexResult.tokens[1].image).toBe(".123")
            expect(lexResult.tokens[1].startLine).toBe(1)
            expect(lexResult.tokens[1].startColumn).toBe(5)

            expect(lexResult.tokens[2]).toEqual(jasmine.any(DecimalLiteral))
            expect(lexResult.tokens[2].image).toBe("123E4")
            expect(lexResult.tokens[2].startLine).toBe(1)
            expect(lexResult.tokens[2].startColumn).toBe(10)

            expect(lexResult.tokens[3]).toEqual(jasmine.any(DecimalLiteral))
            expect(lexResult.tokens[3].image).toBe("999e-4")
            expect(lexResult.tokens[3].startLine).toBe(1)
            expect(lexResult.tokens[3].startColumn).toBe(16)

            expect(lexResult.tokens[4]).toEqual(jasmine.any(DecimalLiteral))
            expect(lexResult.tokens[4].image).toBe("777E+4")
            expect(lexResult.tokens[4].startLine).toBe(1)
            expect(lexResult.tokens[4].startColumn).toBe(23)

            expect(lexResult.tokens[5]).toEqual(jasmine.any(HexIntegerLiteral))
            expect(lexResult.tokens[5].image).toBe("0x5Bbf1")
            expect(lexResult.tokens[5].startLine).toBe(1)
            expect(lexResult.tokens[5].startColumn).toBe(30)
        })

        it("it can lex input with line terminators", function () {
            var input = "ima\n" +
                "aba\r\n" +
                "bamba\r"

            var lexResult = lex(input)
            expect(lexResult.tokens.length).toBe(3)
            expect(lexResult.whitespace.length).toBe(3)
            expect(_.keys(lexResult.idxTolineTerminators).length).toBe(3)

            expect(lexResult.tokens[0]).toEqual(jasmine.any(Identifier))
            expect(lexResult.tokens[0].image).toBe("ima")
            expect(lexResult.tokens[0].startLine).toBe(1)
            expect(lexResult.tokens[0].startColumn).toBe(1)

            expect(lexResult.tokens[1]).toEqual(jasmine.any(Identifier))
            expect(lexResult.tokens[1].image).toBe("aba")
            expect(lexResult.tokens[1].startLine).toBe(2)
            expect(lexResult.tokens[1].startColumn).toBe(1)

            expect(lexResult.tokens[2]).toEqual(jasmine.any(Identifier))
            expect(lexResult.tokens[2].image).toBe("bamba")
            expect(lexResult.tokens[2].startLine).toBe(3)
            expect(lexResult.tokens[2].startColumn).toBe(1)

            expect(lexResult.whitespace[0]).toEqual(jasmine.any(Whitespace))
            expect(lexResult.whitespace[0].image).toBe("\n")
            expect(lexResult.whitespace[0].startLine).toBe(1)
            expect(lexResult.whitespace[0].startColumn).toBe(4)

            expect(lexResult.whitespace[1]).toEqual(jasmine.any(Whitespace))
            expect(lexResult.whitespace[1].image).toBe("\r\n")
            expect(lexResult.whitespace[1].startLine).toBe(2)
            expect(lexResult.whitespace[1].startColumn).toBe(4)

            expect(lexResult.whitespace[2]).toEqual(jasmine.any(Whitespace))
            expect(lexResult.whitespace[2].image).toBe("\r")
            expect(lexResult.whitespace[2].startLine).toBe(3)
            expect(lexResult.whitespace[2].startColumn).toBe(6)

            expect(lexResult.whitespace[0]).toEqual(lexResult.idxTolineTerminators[1])
            expect(lexResult.whitespace[1]).toEqual(lexResult.idxTolineTerminators[2])
            expect(lexResult.whitespace[2]).toEqual(lexResult.idxTolineTerminators[3])
        })

        it("it can lex some comments", function () {
            var input = "// I am a comment\n" +
                " /* multi line comment with only a single line */\n" +
                "/* multi line comment with more than one line\n" +
                "   I am second line! */"
            var lexResult = lex(input)
            expect(lexResult.comments.length).toBe(3)
            expect(lexResult.comments[0]).toEqual(jasmine.any(SingleLineComment))
            expect(lexResult.comments[0].image).toBe("// I am a comment")
            expect(lexResult.comments[0].startLine).toBe(1)
            expect(lexResult.comments[0].startColumn).toBe(1)

            expect(lexResult.comments[1]).toEqual(jasmine.any(MultipleLineCommentWithoutTerminator))
            expect(lexResult.comments[1].image).toBe("/* multi line comment with only a single line */")
            expect(lexResult.comments[1].startLine).toBe(2)
            expect(lexResult.comments[1].startColumn).toBe(2)

            expect(lexResult.comments[2]).toEqual(jasmine.any(MultipleLineCommentWithTerminator))
            expect(lexResult.comments[2].image).toBe("/* multi line comment with more than one line\n" +
                "   I am second line! */")
            expect(lexResult.comments[2].startLine).toBe(3)
            expect(lexResult.comments[2].startColumn).toBe(1)
        })

    })

}
