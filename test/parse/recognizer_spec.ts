
namespace chevrotain.recognizer.spec {

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
            let idents = []

            idents.push(this.CONSUME1(IdentTok).image)
            this.MANY(isQualifiedNamePart, () => {
                this.CONSUME1(DotTok)
                idents.push(this.CONSUME2(IdentTok).image)
            })

            this.CONSUME1(EOF)

            return idents
        }
    }

    class ManySepRepetitionRecovery extends Parser {

        constructor(input:Token[] = []) {
            super(input, <any>chevrotain.recognizer.spec)
            Parser.performSelfAnalysis(this)
        }

        public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, () => { return undefined })

        private parseQualifiedName():string[] {
            let idents = []

            idents.push(this.CONSUME1(IdentTok).image)
            this.CONSUME1(DotTok)

            this.MANY_SEP(DotTok, () => {
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
            this.SUBRULE(this.subRule, [5, "a"])
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
            let input = [new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok()]
            let parser = new SubRuleTestParser(input)
            let result = parser.topRule()
            expect(result).to.equal("12345")
        })

        it("provides a production SUBRULE1-5 that can accept arguments from its caller", function () {
            let input = [new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok()]
            let parser = new SubRuleArgsParser(input)
            let result = parser.topRule()
            expect(result.letters).to.equal("abcde")
            expect(result.numbers).to.equal("54321")
        })

        it("allows using automatic lookahead even as part of custom lookahead functions valid", function () {
            let input1 = [new PlusTok()]
            let parser = new CustomLookaheadParser(input1)
            let result = parser.topRule()
            expect(result).to.equal("plus")

            let input2 = [new MinusTok()]
            let parser2 = new CustomLookaheadParser(input2)
            let result2 = parser2.topRule()
            expect(result2).to.equal("minus")
        })

        it("allows using automatic lookahead even as part of custom lookahead functions invalid", function () {
            let input1 = [new PlusTok()]
            let parser = new CustomLookaheadParser(input1)
            parser.plusAllowed = false
            let result = parser.topRule()
            expect(result).to.equal(undefined)
            expect(parser.errors.length).to.equal(1)
            expect(_.contains(parser.errors[0].message, "unicorn")).to.equal(true)
        })
    })

    describe("The Error Recovery functionality of the IntrospectionParser", function () {

        it("can CONSUME tokens with an index specifying the occurrence for the specific token in the current rule", function () {
            let parser:any = new Parser([], <any>chevrotain.gastBuilder.spec);
            parser.reset()
            let testInput = [new IntToken("1"), new PlusTok(),
                new IntToken("2"), new PlusTok(), new IntToken("3")]

            parser.input = testInput
            expect(parser.CONSUME4(IntToken)).to.equal(testInput[0])
            expect(parser.CONSUME2(PlusTok)).to.equal(testInput[1])
            expect(parser.CONSUME1(IntToken)).to.equal(testInput[2])
            expect(parser.CONSUME3(PlusTok)).to.equal(testInput[3])
            expect(parser.CONSUME1(IntToken)).to.equal(testInput[4])
            expect(parser.NEXT_TOKEN()).to.be.an.instanceof(EOF)
        })

        it("will not perform inRepetition recovery while in backtracking mode", function () {
            let parser:any = new Parser([], {})
            parser.isBackTrackingStack.push(1)
            expect(parser.shouldInRepetitionRecoveryBeTried(MinusTok, 1)).to.equal(false)
        })

        it("can perform in-repetition recovery for MANY grammar rule", function () {
            // a.b+.c
            let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
                new PlusTok(), new DotTok(), new IdentTok("c")]
            let parser = new ManyRepetitionRecovery(input)
            expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
            expect(parser.errors.length).to.equal(1)
        })

        it("can perform in-repetition recovery for MANY_SEP grammar rule", function () {
            // a.b+.c
            let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
                new PlusTok(), new DotTok(), new IdentTok("c")]
            let parser = new ManySepRepetitionRecovery(input)
            expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
            expect(parser.errors.length).to.equal(1)
        })
    })

    describe("The BaseRecognizer", function () {

        it("can be initialized without supplying an input vector", function () {
            let parser = new Parser([], [])
            expect(parser.input).to.deep.equal([])
            expect(parser.input).to.be.an.instanceof(Array)
        })

        it("can only SAVE_ERROR for recognition exceptions", function () {
            let parser:any = new Parser([], [])
            expect(() => parser.SAVE_ERROR(new Error("I am some random Error"))).
                to.throw("trying to save an Error which is not a RecognitionException")
            expect(parser.input).to.be.an.instanceof(Array)
        })

        it("when it runs out of input EOF will be returned", function () {
            let parser:any = new Parser([new IntToken("1"), new PlusTok()], [])
            parser.CONSUME(IntToken)
            parser.CONSUME(PlusTok)
            expect(parser.NEXT_TOKEN()).to.be.an.instanceof(EOF)
            expect(parser.NEXT_TOKEN()).to.be.an.instanceof(EOF)
            expect(parser.SKIP_TOKEN()).to.be.an.instanceof(EOF)
            expect(parser.SKIP_TOKEN()).to.be.an.instanceof(EOF)
            // and we can go on and on and on... this avoid returning null/undefined
            // see: http://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions
        })

        it("invoking an OPTION will return true/false depending if it succeeded or not", function () {
            let parser:any = new Parser([new IntToken("1"), new PlusTok()], {})

            let successfulOption = parser.OPTION(function () { return this.NEXT_TOKEN() instanceof IntToken }, () => {
                parser.CONSUME1(IntToken)
            })
            expect(successfulOption).to.equal(true)

            let failedOption = parser.OPTION(function () {
                // this lookahead should fail because the first token has been consumed and
                // now the next one is a PlusTok
                return this.NEXT_TOKEN() instanceof IntToken
            }, () => { parser.CONSUME1(IntToken) })
            expect(failedOption).to.equal(false)
        })

        it("will return false if a RecognitionException is thrown during " +
            "backtracking and rethrow any other kind of Exception", function () {
            let parser:any = new Parser([], [])
            let backTrackingThrows = parser.BACKTRACK(() => {throw new Error("division by zero, boom")}, () => { return true })
            expect(() => backTrackingThrows()).to.throw("division by zero, boom")

            let throwExceptionFunc = () => { throw new exceptions.NotAllInputParsedException("sad sad panda", new PlusTok()) }
            let backTrackingFalse = parser.BACKTRACK(() => { throwExceptionFunc() }, () => { return true })
            expect(backTrackingFalse()).to.equal(false)
        })

    })

    describe("The BaseRecognizer", function () {

        it("can be initialized with a vector of Tokens", function () {
            let parser:any = new Parser([], [PlusTok, MinusTok, IntToken])
            let tokensMap = (<any>parser).tokensMap
            expect(tokensMap.PlusTok).to.equal(PlusTok)
            expect(tokensMap.MinusTok).to.equal(MinusTok)
            expect(tokensMap.IntToken).to.equal(IntToken)
        })

        it("can be initialized with a Dictionary of Tokens", function () {
            let initTokenDictionary = {PlusTok: PlusTok, MinusTok: MinusTok, IntToken: IntToken}
            let parser:any = new Parser([], {
                PlusTok:  PlusTok,
                MinusTok: MinusTok,
                IntToken: IntToken
            })
            let tokensMap = (<any>parser).tokensMap
            // the implementation should clone the dictionary to avoid bugs caused by mutability
            expect(tokensMap).not.to.equal(initTokenDictionary)
            expect(tokensMap.PlusTok).to.equal(PlusTok)
            expect(tokensMap.MinusTok).to.equal(MinusTok)
            expect(tokensMap.IntToken).to.equal(IntToken)
        })

        it("cannot be initialized with other parameters", function () {
            expect(() => {
                return new Parser([], null)
            }).to.throw()

            expect(() => {
                return new Parser([], <any>666)
            }).to.throw()

            expect(() => {
                return new Parser([], <any>"woof woof")
            }).to.throw()
        })

    })

}
