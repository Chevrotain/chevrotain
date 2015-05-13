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

        //TODO: more assertions once the parsing rules actually returns a value
        it("can perform semicolon insertion #1", function () {
            var input = "{ 1\n" +
                "2 } 3"
            var lexResult = ECMA5Lexer.tokenize(input)
            expect(lexResult.errors.length).toBe(0)
            // TODO: this information should be produced by the 'full' lexer
            var LineTerminatorsInfo:any = {2: new LineFeed(-1, -1, "\n")}
            var parser = new ECMAScript5Parser(lexResult.tokens, LineTerminatorsInfo)
            parser.Program()
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
        })

        it("can perform semicolon insertion #2", function () {
            var input = "return\n" +
                "a + b"
            var lexResult = ECMA5Lexer.tokenize(input)
            expect(lexResult.errors.length).toBe(0)
            // TODO: this information should be produced by the 'full' lexer
            var LineTerminatorsInfo:any = {1: new LineFeed(-1, -1, "\n")}
            var parser = new ECMAScript5Parser(lexResult.tokens, LineTerminatorsInfo)
            parser.Program()
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
        })

        it("can perform semicolon insertion #3", function () {
            var input = "a = b\n" +
                "++c"
            var lexResult = ECMA5Lexer.tokenize(input)
            expect(lexResult.errors.length).toBe(0)
            // TODO: this information should be produced by the 'full' lexer
            var LineTerminatorsInfo:any = {3: new LineFeed(-1, -1, "\n")}
            var parser = new ECMAScript5Parser(lexResult.tokens, LineTerminatorsInfo)
            parser.Program()
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
        })

    })

}
