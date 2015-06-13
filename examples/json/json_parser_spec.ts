/// <reference path="json_parser.ts" />
/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../libs/jasmine.d.ts" />


module chevrotain.examples.json.spec {

    import recog = chevrotain.recognizer

    describe("Simple json parser example", function () {

        it("can parse a simple Json", function () {
            var input = "{\"name\":\"shahar\", \"age\":32}"
            var lexResult = JsonLexer.tokenize(input)
            expect(lexResult.errors.length).toBe(0)
            var parser = new JsonParser(lexResult.tokens)
            parser.object()
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
        })

        it("can invoke another parsing rule as the top rule", function () {
            var input = "\"name\":\"shahar\""
            var lexResult = JsonLexer.tokenize(input)
            expect(lexResult.errors.length).toBe(0)
            var parser = new JsonParser(lexResult.tokens)
            parser.objectItem()
            expect(parser.errors.length).toBe(0)
            expect(parser.isAtEndOfInput()).toBe(true)
        })


        it("will encounter an NoViableAltException when none of the alternatives match", function () {
            var input = [new Colon(":", 0, 1, 1)]
            var parser = new JsonParser(input)
            parser.value()
            expect(parser.errors.length).toBe(1)
            expect(parser.errors[0]).toEqual(jasmine.any(recog.NoViableAltException))
            expect(parser.errors[0].message).toBe("expecting: a value but found ':'")
        })
    })

}
