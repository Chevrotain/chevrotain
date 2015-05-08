/// <reference path="grammar/samples.ts" />
/// <reference path="../../src/text/range.ts" />
/// <reference path="../../src/parse/gast_builder.ts" />
/// <reference path="../utils/matchers.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.recognizer.spec {

    import tok = chevrotain.tokens
    import recog = chevrotain.recognizer

    export class PlusTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "+")}
    }

    export class MinusTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "-")}
    }

    export class IntToken extends tok.Token {
        constructor(startLine:number, startColumn:number, image:string) {super(startLine, startColumn, image)}
    }


    class InvalidErrorRecoveryRecog extends BaseIntrospectionRecognizer {

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            // the invalid part is that we forgot to call the self analysis
            //recog.BaseErrorRecoveryRecognizer.performSelfAnalysis(this)
        }

        public someRule = this.RULE("someRule", this.parseSomeRule, () => { return undefined })
        public someNestedRule = this.RULE("someNestedRule", this.parseSomeNestedRule, () => { return undefined })

        private parseSomeRule():void {
            this.SUBRULE(this.someNestedRule)
        }

        private parseSomeNestedRule():void {
            this.CONSUME1(PlusTok)
        }
    }


    class ManyRepetitionRecovery extends BaseIntrospectionRecognizer {

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, () => { return undefined })

        private parseQualifiedName():string[] {
            var idents = []

            idents.push(this.CONSUME1(IdentTok).image)
            this.MANY(isQualifiedNamePart, () => {
                this.CONSUME1(DotTok)
                idents.push(this.CONSUME2(IdentTok).image)
            })

            this.CONSUME1(recog.EOF)

            return idents
        }

    }

    export class IdentTok extends tok.Token {}

    export class DotTok extends tok.Token {
        constructor(startLine:number, startColumn:number) { super(startLine, startColumn, ".") }
    }

    function isQualifiedNamePart():boolean {
        return this.NEXT_TOKEN() instanceof  DotTok
    }

    class SubRuleTestParser extends recog.BaseIntrospectionRecognizer {

        private result = ""
        private index = 1;

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public topRule = this.RULE("topRule", () => {
            this.SUBRULE1(this.subRule)
            this.SUBRULE2(this.subRule)
            this.SUBRULE3(this.subRule)
            this.SUBRULE4(this.subRule)
            this.SUBRULE5(this.subRule)
            return this.result
        })

        public subRule = this.RULE("subRule", () => {
            this.CONSUME(PlusTok)
            this.result += this.index++
        })
    }

    class SubRuleArgsParser extends recog.BaseIntrospectionRecognizer {

        private numbers = ""
        private letters = ""

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public topRule = this.RULE("topRule", () => {
            this.SUBRULE1(this.subRule, [5, "a"])
            this.SUBRULE2(this.subRule, [4, "b"])
            this.SUBRULE3(this.subRule, [3, "c"])
            this.SUBRULE4(this.subRule, [2, "d"])
            this.SUBRULE5(this.subRule, [1, "e"])
            return {numbers: this.numbers, letters: this.letters}
        })

        public subRule = this.RULE("subRule", (numFromCaller, charFromCaller) => {
            this.CONSUME(PlusTok)
            this.numbers += numFromCaller
            this.letters += charFromCaller
        })
    }

    describe("The Parsing DSL", function () {

        it("provides a production SUBRULE1-5 that invokes another rule", function () {
            var input = [new PlusTok(1, 1), new PlusTok(1, 1), new PlusTok(1, 1), new PlusTok(1, 1), new PlusTok(1, 1)]
            var parser = new SubRuleTestParser(input)
            var result = parser.topRule()
            expect(result).toBe("12345")
        })

        it("provides a production SUBRULE1-5 that can accept arguments from its caller", function () {
            var input = [new PlusTok(1, 1), new PlusTok(1, 1), new PlusTok(1, 1), new PlusTok(1, 1), new PlusTok(1, 1)]
            var parser = new SubRuleArgsParser(input)
            var result = parser.topRule()
            expect(result.letters).toBe("abcde")
            expect(result.numbers).toBe("54321")
        })
    })

    describe("The Error Recovery functionality of the IntrospectionParser", function () {

        it("can CONSUME tokens with an index specifying the occurrence for the specific token in the current rule", function () {
            var parser:any = new recog.BaseIntrospectionRecognizer([], <any>chevrotain.gastBuilder.spec);
            parser.reset()
            var testInput = [new IntToken(1, 1, "1"), new PlusTok(1, 1),
                new IntToken(1, 1, "2"), new PlusTok(1, 1), new IntToken(1, 1, "3")]

            parser.input = testInput
            expect(parser.CONSUME4(IntToken)).toBe(testInput[0])
            expect(parser.CONSUME2(PlusTok)).toBe(testInput[1])
            expect(parser.CONSUME1(IntToken)).toBe(testInput[2])
            expect(parser.CONSUME3(PlusTok)).toBe(testInput[3])
            expect(parser.CONSUME1(IntToken)).toBe(testInput[4])
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(recog.EOF))
        })

        it("does not allow duplicate grammar rule names", function () {
            var parser:any = new recog.BaseIntrospectionRecognizer([], {});
            parser.validateRuleName("bamba") // first time with a valid name.
            expect(() => parser.validateRuleName("bamba")).toThrow(
                Error("Duplicate definition, rule: bamba is already defined in the grammar: BaseIntrospectionRecognizer"))
        })

        it("only allows a subset of ECMAScript identifiers as rulenames", function () {
            var parser:any = new recog.BaseIntrospectionRecognizer([], {});
            expect(() => parser.validateRuleName("1baa")).toThrow()
            expect(() => parser.validateRuleName("שלום")).toThrow()
            expect(() => parser.validateRuleName("$bamba")).toThrow()
        })

        it("will not perform inRepetition recovery while in backtracking mode", function () {
            var parser:any = new recog.BaseIntrospectionRecognizer([], {})
            parser.isBackTrackingStack.push(1)
            expect(parser.shouldInRepetitionRecoveryBeTried(tok.NoneToken, 1)).toBe(false)
        })

        it("will rethrow and expose none InRuleRecoveryException while performing in rule recovery", function () {
            var parser:any = new recog.BaseIntrospectionRecognizer([], {})
            parser.isBackTrackingStack.push(1)
            expect(parser.shouldInRepetitionRecoveryBeTried(tok.NoneToken, 1)).toBe(false)
        })

        it("will throw an exception if we try to use it without performing self analysis in the constructor", function () {
            var parser = new InvalidErrorRecoveryRecog([])
            expect(() => parser.someRule()).toThrow(Error("missing re-sync follows information, possible cause: " +
            "did not call performSelfAnalysis(this) in the constructor implementation."))
        })

        it("can perform in-repetition recovery for MANY grammar rule", function () {
            // a.b+.c
            var input = [new IdentTok(1, 1, "a"), new DotTok(1, 1), new IdentTok(1, 1, "b"),
                new PlusTok(1, 1), new DotTok(1, 1), new IdentTok(1, 1, "c")]
            var parser = new ManyRepetitionRecovery(input)
            expect(parser.qualifiedName()).toEqual(["a", "b", "c"])
            expect(parser.errors.length).toBe(1)
        })
    })

    describe("The BaseRecognizer", function () {

        it("can be initialized without supplying an input vector", function () {
            var parser = new recog.BaseRecognizer()
            expect(parser.input).toBeDefined()
            expect(parser.input).toEqual(jasmine.any(Array))
        })

        it("can only SAVE_ERROR for recognition exceptions", function () {
            var parser:any = new recog.BaseRecognizer()
            expect(() => parser.SAVE_ERROR(new Error("I am some random Error"))).
                toThrow(Error("trying to save an Error which is not a RecognitionException"))
            expect(parser.input).toEqual(jasmine.any(Array))
        })

        it("when it runs out of input EOF will be returned", function () {
            var parser:any = new recog.BaseRecognizer([new IntToken(1, 1, "1"), new PlusTok(1, 1)])
            expect(parser.CONSUME(IntToken))
            expect(parser.CONSUME(PlusTok))
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(recog.EOF))
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(recog.EOF))
            expect(parser.SKIP_TOKEN()).toEqual(jasmine.any(recog.EOF))
            expect(parser.SKIP_TOKEN()).toEqual(jasmine.any(recog.EOF))
            // and we can go on and on and on... this avoid returning null/undefined
            // see: http://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions
        })

        it("invoking an OPTION will return true/false depending if it succeeded or not", function () {
            var parser:any = new recog.BaseIntrospectionRecognizer([new IntToken(1, 1, "1"), new PlusTok(1, 1)], {})

            var successfulOption = parser.OPTION(function () { return this.NEXT_TOKEN() instanceof IntToken }, () => {
                parser.CONSUME1(IntToken)
            })
            expect(successfulOption).toBe(true)

            var failedOption = parser.OPTION(function () {
                // this lookahead should fail because the first token has been consumed and
                // now the next one is a PlusTok
                return this.NEXT_TOKEN() instanceof IntToken
            }, () => { parser.CONSUME1(IntToken) })
            expect(failedOption).toBe(false)
        })

        it("will return false if a RecognitionException is thrown during " +
        "backtracking and rethrow any other kind of Exception", function () {
            var parser:any = new recog.BaseRecognizer([])
            var backTrackingThrows = parser.BACKTRACK(() => {throw new Error("division by zero, boom")}, () => { return true })
            expect(() => backTrackingThrows()).toThrow(Error("division by zero, boom"))

            var throwExceptionFunc = () => { throw new recog.NotAllInputParsedException("sad sad panda", new PlusTok(1, 1)) }
            var backTrackingFalse = parser.BACKTRACK(() => { throwExceptionFunc() }, () => { return true })
            expect(backTrackingFalse()).toBe(false)
        })

    })

}
