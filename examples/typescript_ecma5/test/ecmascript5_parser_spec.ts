var expect = chai.expect

module ecma5.spec {

    describe("The ECMAScript5 parser example", function () {

        it("can parse an 'Hello world' program", function () {
            var input = "function greet() {\n" +
                "// this is a comment\n" +
                "alert('Hello World!');" +
                "}"
            var lexResult = lexer.lex(input)
            expect(lexResult.errors.length).to.equal(0)
            var parser = new ECMAScript5Parser(lexResult.tokens, lexResult.idxTolineTerminators)
            parser.Program()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
        })

        //TODO: more assertions once the parsing rules actually returns a value
        it("can perform semicolon insertion #1", function () {
            var input = "{ 1\n" +
                "2 } 3"
            var lexResult = lexer.lex(input)
            expect(lexResult.errors.length).to.equal(0)
            var parser = new ECMAScript5Parser(lexResult.tokens, lexResult.idxTolineTerminators)
            parser.Program()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
        })

        it("can perform semicolon insertion #2", function () {
            var input = "return\n" +
                "a + b"
            var lexResult = lexer.lex(input)
            expect(lexResult.errors.length).to.equal(0)
            var parser = new ECMAScript5Parser(lexResult.tokens, lexResult.idxTolineTerminators)
            parser.Program()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
        })

        it("can perform semicolon insertion #3", function () {
            var input = "a = b\n" +
                "++c"
            var lexResult = lexer.lex(input)
            expect(lexResult.errors.length).to.equal(0)
            var parser = new ECMAScript5Parser(lexResult.tokens, lexResult.idxTolineTerminators)
            parser.Program()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
        })

        it("can parse a 'forIn #1", function () {
            var input = "for (var x in arr) {alert(x)}"
            var lexResult = lexer.lex(input)
            expect(lexResult.errors.length).to.equal(0)
            var parser = new ECMAScript5Parser(lexResult.tokens)
            parser.ForIteration()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
        })

        it("can parse a 'forIn #2", function () {
            var input = "for (x in arr) {alert(x)}"
            var lexResult = lexer.lex(input)
            expect(lexResult.errors.length).to.equal(0)
            var parser = new ECMAScript5Parser(lexResult.tokens)
            parser.ForIteration()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
        })

        it("will return an invalidParseTree for an invalid statement text", function () {
            var input = "var x += 5;"
            var lexResult = lexer.lex(input)
            expect(lexResult.errors.length).to.equal(0)
            var parser = new ECMAScript5Parser(lexResult.tokens)
            var parseResult = parser.Statement()
            expect(parser.errors.length).to.equal(1)
            var errMessage = _.first(parser.errors).message
            expect(errMessage).to.equal("Expecting token of type --> Semicolon <-- but found --> '+=' <--")
            expect(parseResult.payload).to.be.an.instanceof(InvalidStatement)
        })

        it("can parse an assignment statement with an array literal", function () {
            var input = "var x = [1,2,3];"
            var lexResult = lexer.lex(input)
            expect(lexResult.errors.length).to.equal(0)
            var parser = new ECMAScript5Parser(lexResult.tokens)
            parser.Statement()
            expect(parser.errors.length).to.equal(0)
            expect(parser.isAtEndOfInput()).to.equal(true)
        })

    })
}
