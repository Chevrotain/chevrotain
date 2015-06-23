
module chevrotain.recognizer.spec {

    export class PlusTok extends Token {
        constructor() { super("+", 0, 1, 1) }
    }

    export class MinusTok extends Token {
        constructor() { super("+", 0, 1, 1) }
    }

    export class IntToken extends Token {
        constructor(image:string) { super(image, 0, 1, 1) }
    }

    class ManyRepetitionRecovery extends Parser {

        constructor(input:Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            Parser.performSelfAnalysis(this)
        }

        public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, () => { return undefined })

        private parseQualifiedName():string[] {
            var idents = []

            idents.push(this.CONSUME1(IdentTok).image)
            this.MANY(isQualifiedNamePart, () => {
                this.CONSUME1(DotTok)
                idents.push(this.CONSUME2(IdentTok).image)
            })

            this.CONSUME1(EOF)

            return idents
        }
    }

    export class IdentTok extends Token {
        constructor(image:string) { super(image, 0, 1, 1) }
    }

    export class DotTok extends Token {
        constructor() { super(".", 0, 1, 1) }
    }

    function isQualifiedNamePart():boolean {
        return this.NEXT_TOKEN() instanceof  DotTok
    }

    class SubRuleTestParser extends Parser {

        private result = ""
        private index = 1;

        constructor(input:Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            Parser.performSelfAnalysis(this)
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

    class SubRuleArgsParser extends Parser {

        private numbers = ""
        private letters = ""

        constructor(input:Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            Parser.performSelfAnalysis(this)
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

    class CustomLookaheadParser extends Parser {

        private result = ""
        public plusAllowed = true
        public minusAllowed = true

        constructor(input:Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            Parser.performSelfAnalysis(this)
        }

        private isPlus():boolean {
            return this.isNextRule("plusRule") && this.plusAllowed
        }

        private isMinus():boolean {
            return this.isNextRule("minusRule") && this.minusAllowed
        }

        public topRule = this.RULE("topRule", () => {
            this.OR([
                {WHEN: this.isPlus, THEN_DO: () => { this.SUBRULE1(this.plusRule) }},
                {WHEN: this.isMinus, THEN_DO: () => { this.SUBRULE1(this.minusRule) }}
            ], "a unicorn")


            return this.result
        })

        public plusRule = this.RULE("plusRule", () => {
            this.CONSUME(PlusTok)
            this.result += "plus"
        })

        public minusRule = this.RULE("minusRule", () => {
            this.CONSUME(MinusTok)
            this.result += "minus"
        })
    }

    describe("The Parsing DSL", function () {

        it("provides a production SUBRULE1-5 that invokes another rule", function () {
            var input = [new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok()]
            var parser = new SubRuleTestParser(input)
            var result = parser.topRule()
            expect(result).toBe("12345")
        })

        it("provides a production SUBRULE1-5 that can accept arguments from its caller", function () {
            var input = [new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok()]
            var parser = new SubRuleArgsParser(input)
            var result = parser.topRule()
            expect(result.letters).toBe("abcde")
            expect(result.numbers).toBe("54321")
        })

        it("allows using automatic lookahead even as part of custom lookahead functions valid", function () {
            var input1 = [new PlusTok()]
            var parser = new CustomLookaheadParser(input1)
            var result = parser.topRule()
            expect(result).toBe("plus")

            var input2 = [new MinusTok()]
            var parser2 = new CustomLookaheadParser(input2)
            var result2 = parser2.topRule()
            expect(result2).toBe("minus")
        })

        it("allows using automatic lookahead even as part of custom lookahead functions invalid", function () {
            var input1 = [new PlusTok()]
            var parser = new CustomLookaheadParser(input1)
            parser.plusAllowed = false
            var result = parser.topRule()
            expect(result).toBe(undefined)
            expect(parser.errors.length).toBe(1)
            expect(_.contains(parser.errors[0].message, "unicorn")).toBe(true)
        })
    })

    describe("The Error Recovery functionality of the IntrospectionParser", function () {

        it("can CONSUME tokens with an index specifying the occurrence for the specific token in the current rule", function () {
            var parser:any = new Parser([], <any>chevrotain.gastBuilder.spec);
            parser.reset()
            var testInput = [new IntToken("1"), new PlusTok(),
                new IntToken("2"), new PlusTok(), new IntToken("3")]

            parser.input = testInput
            expect(parser.CONSUME4(IntToken)).toBe(testInput[0])
            expect(parser.CONSUME2(PlusTok)).toBe(testInput[1])
            expect(parser.CONSUME1(IntToken)).toBe(testInput[2])
            expect(parser.CONSUME3(PlusTok)).toBe(testInput[3])
            expect(parser.CONSUME1(IntToken)).toBe(testInput[4])
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(EOF))
        })

        it("does not allow duplicate grammar rule names", function () {
            var parser:any = new Parser([], {});
            parser.validateRuleName("bamba") // first time with a valid name.
            expect(() => parser.validateRuleName("bamba")).toThrow(
                Error("Duplicate definition, rule: bamba is already defined in the grammar: Parser"))
        })

        it("only allows a subset of ECMAScript identifiers as rulenames", function () {
            var parser:any = new Parser([], {});
            expect(() => parser.validateRuleName("1baa")).toThrow()
            expect(() => parser.validateRuleName("שלום")).toThrow()
            expect(() => parser.validateRuleName("$bamba")).toThrow()
        })

        it("will not perform inRepetition recovery while in backtracking mode", function () {
            var parser:any = new Parser([], {})
            parser.isBackTrackingStack.push(1)
            expect(parser.shouldInRepetitionRecoveryBeTried(MinusTok, 1)).toBe(false)
        })

        it("can perform in-repetition recovery for MANY grammar rule", function () {
            // a.b+.c
            var input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
                new PlusTok(), new DotTok(), new IdentTok("c")]
            var parser = new ManyRepetitionRecovery(input)
            expect(parser.qualifiedName()).toEqual(["a", "b", "c"])
            expect(parser.errors.length).toBe(1)
        })
    })

    describe("The BaseRecognizer", function () {

        it("can be initialized without supplying an input vector", function () {
            var parser = new BaseRecognizer()
            expect(parser.input).toBeDefined()
            expect(parser.input).toEqual(jasmine.any(Array))
        })

        it("can only SAVE_ERROR for recognition exceptions", function () {
            var parser:any = new BaseRecognizer()
            expect(() => parser.SAVE_ERROR(new Error("I am some random Error"))).
                toThrow(Error("trying to save an Error which is not a RecognitionException"))
            expect(parser.input).toEqual(jasmine.any(Array))
        })

        it("when it runs out of input EOF will be returned", function () {
            var parser:any = new BaseRecognizer([new IntToken("1"), new PlusTok()])
            expect(parser.CONSUME(IntToken))
            expect(parser.CONSUME(PlusTok))
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(EOF))
            expect(parser.NEXT_TOKEN()).toEqual(jasmine.any(EOF))
            expect(parser.SKIP_TOKEN()).toEqual(jasmine.any(EOF))
            expect(parser.SKIP_TOKEN()).toEqual(jasmine.any(EOF))
            // and we can go on and on and on... this avoid returning null/undefined
            // see: http://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions
        })

        it("invoking an OPTION will return true/false depending if it succeeded or not", function () {
            var parser:any = new Parser([new IntToken("1"), new PlusTok()], {})

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
            var parser:any = new BaseRecognizer([])
            var backTrackingThrows = parser.BACKTRACK(() => {throw new Error("division by zero, boom")}, () => { return true })
            expect(() => backTrackingThrows()).toThrow(Error("division by zero, boom"))

            var throwExceptionFunc = () => { throw new NotAllInputParsedException("sad sad panda", new PlusTok()) }
            var backTrackingFalse = parser.BACKTRACK(() => { throwExceptionFunc() }, () => { return true })
            expect(backTrackingFalse()).toBe(false)
        })

    })

    describe("The BaseRecognizer", function () {

        it("can be initialized with a vector of Tokens", function () {
            var parser:any = new Parser([], [PlusTok, MinusTok, IntToken])
            var tokensMap = (<any>parser).tokensMap
            expect(tokensMap.PlusTok).toBe(PlusTok)
            expect(tokensMap.MinusTok).toBe(MinusTok)
            expect(tokensMap.IntToken).toBe(IntToken)
        })

        it("can be initialized with a Dictionary of Tokens", function () {
            var initTokenDictionary = {PlusTok: PlusTok, MinusTok: MinusTok, IntToken: IntToken}
            var parser:any = new Parser([], {
                PlusTok:  PlusTok,
                MinusTok: MinusTok,
                IntToken: IntToken
            })
            var tokensMap = (<any>parser).tokensMap
            // the implementation should clone the dictionary to avoid bugs caused by mutability
            expect(tokensMap).not.toBe(initTokenDictionary)
            expect(tokensMap.PlusTok).toBe(PlusTok)
            expect(tokensMap.MinusTok).toBe(MinusTok)
            expect(tokensMap.IntToken).toBe(IntToken)
        })

        it("cannot be initialized with other parameters", function () {
            expect(() => {
                return new Parser([], null)
            }).toThrow()

            expect(() => {
                return new Parser([], <any>666)
            }).toThrow()

            expect(() => {
                return new Parser([], <any>"woof woof")
            }).toThrow()
        })

    })

}
