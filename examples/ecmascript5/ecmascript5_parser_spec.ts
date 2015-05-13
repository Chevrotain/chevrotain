/// <reference path="ecmascript5_parser.ts" />
/// <reference path="ecmascript5_tokens.ts" />
/// <reference path="../../libs/jasmine.d.ts" />


module chevrotain.examples.ecma5.spec {


    describe("The ECMAScript5 parser example", function () {

        it("can parse an 'Hello world' program", function () {
            var input = "function greet() {\n" +
                "// this is a comment\n" +
                "alert('Hello World!');" +
                "}"
            var lexResult = ECMA5Lexer.tokenize(input)
            expect(lexResult.errors.length).toBe(0)
            var parser = new ECMAScript5Parser(lexResult.tokens)
            parser.Program()
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
        })

    })

}
