/// <reference path="grammar/Samples.ts" />
/// <reference path="../../src/text/Range.ts" />
/// <reference path="../../src/parse/GAstBuilder.ts" />
/// <reference path="../utils/Matchers.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.parse.infra.recognizer.spec {

    import tok = chevrotain.scan.tokens
    import recog = chevrotain.parse.infra.recognizer

    export class PlusTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "+")}
    }

    export class MinusTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "-")}
    }

    export class IntToken extends tok.Token {
        constructor(startLine:number, startColumn:number, image:string) {super(startLine, startColumn, image)}
    }

    describe("The BaseErrorRecoveryRecognizer", function () {

        it("it can CONSUME tokens with an index specifying the occurrence for the specific token in the current rule", function () {
            var parser = new recog.BaseErrorRecoveryRecognizer([], <any>chevrotain.parse.grammar.gast.builder.spec);
            parser.reset()
            var testInput = [new IntToken(1, 1, "1"), new PlusTok(1, 1),
                new IntToken(1, 1, "2"), new PlusTok(1, 1), new IntToken(1, 1, "3")]

            parser.input = testInput
            expect(() => parser.CONSUME(IntToken)).
                toThrow(Error("must use COMSUME1/2/3... to indicate the occurrence of the specific Token inside the current rule"))

            expect(parser.CONSUME4(IntToken)).toBe(testInput[0])
            expect(parser.CONSUME2(PlusTok)).toBe(testInput[1])
            expect(parser.CONSUME1(IntToken)).toBe(testInput[2])
            expect(parser.CONSUME3(PlusTok)).toBe(testInput[3])
            expect(parser.CONSUME1(IntToken)).toBe(testInput[4])
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(recog.EOF))
        })
    })

    describe("The BaseRecognizer", function () {

        it("it can be initialized without supplying an input vector", function () {
            var parser = new recog.BaseRecognizer()
            expect(parser.input).toBeDefined()
            expect(parser.input).toEqual(jasmine.any(Array))
        })

        it("it can only SAVE_ERROR for recognition exceptions", function () {
            var parser = new recog.BaseRecognizer()
            expect(() => parser.SAVE_ERROR(new Error("I am some random Error"))).
                toThrow(Error("trying to save an Error which is not a RecognitionException"))
            expect(parser.input).toEqual(jasmine.any(Array))
        })

        it("when it runs out of input EOF will be returned", function () {
            var parser = new recog.BaseRecognizer([new IntToken(1, 1, "1"), new PlusTok(1, 1)])
            expect(parser.CONSUME(IntToken))
            expect(parser.CONSUME(PlusTok))
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(recog.EOF))
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(recog.EOF))
            expect(parser.SKIP_TOKEN()).toEqual(jasmine.any(recog.EOF))
            expect(parser.SKIP_TOKEN()).toEqual(jasmine.any(recog.EOF))
            // and we can go on and on and on... this avoid returning null/undefined
            // see: http://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions
        })

        it("invoking an OPTION will return true/false depending if it succeded or not", function () {
            var parser = new recog.BaseRecognizer([new IntToken(1, 1, "1"), new PlusTok(1, 1)])

            var successfulOption = parser.OPTION(function() { return this.NEXT_TOKEN() instanceof IntToken }, () => {
                parser.CONSUME(IntToken)
            })
            expect(successfulOption).toBe(true)

            var failedOption = parser.OPTION(function() {
                // this lookahead should fail because the first token has been consumed and
                // now the next one is a PlusTok
                return this.NEXT_TOKEN() instanceof IntToken
            }, () => { parser.CONSUME(IntToken) })
            expect(failedOption).toBe(false)
        })
    })

}
