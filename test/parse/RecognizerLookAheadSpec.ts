/// <reference path="../../src/scan/Tokens.ts" />
/// <reference path="../../src/parse/Recognizer.ts" />
/// <reference path="../utils/Matchers.ts" />
/// <reference path="../../libs/lodash.d.ts" />
/// <reference path="../../libs/jasmine.d.ts" />

module chevrotain.recognizer.lookahead.spec {

    import tok = chevrotain.tokens
    import recog = chevrotain.recognizer

    export class OneTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "One")}
    }

    export class TwoTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "Two")}
    }

    export class ThreeTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "Three")}
    }

    export class FourTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "Four")}
    }

    export class FiveTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "Five")}
    }

    class OptionsImplicitLookAheadParser extends BaseErrorRecoveryRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseErrorRecoveryRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseErrorRecoveryRecognizer.performSelfAnalysis(this)
        }

        public manyOptionsRule = this.RULE("manyOptionsRule", this.parseManyOptionsRule, () => { return "-666" })

        private parseManyOptionsRule():string {
            var total = ""

            this.OPTION1(() => {
                this.CONSUME1(OneTok)
                total += "1"
            })

            this.OPTION2(() => {
                this.CONSUME1(TwoTok)
                total += "2"
            })

            this.OPTION3(() => {
                this.CONSUME1(ThreeTok)
                total += "3"
            })

            this.OPTION4(() => {
                this.CONSUME1(FourTok)
                total += "4"
            })

            this.OPTION5(() => {
                this.CONSUME1(FiveTok)
                total += "5"
            })

            return total
        }
    }

    class OptionsExplicitLookAheadParser extends BaseErrorRecoveryRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseErrorRecoveryRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseErrorRecoveryRecognizer.performSelfAnalysis(this)
        }

        public manyOptionsRule = this.RULE("manyOptionsRule", this.parseManyOptionsRule, () => { return "-666" })

        private parseManyOptionsRule():string {
            var total = ""

            this.OPTION1(isOneTok, () => {
                this.CONSUME1(OneTok)
                total += "1"
            })

            this.OPTION2(isTwoTok, () => {
                this.CONSUME1(TwoTok)
                total += "2"
            })

            this.OPTION3(isThreeTok, () => {
                this.CONSUME1(ThreeTok)
                total += "3"
            })

            this.OPTION4(isFourTok, () => {
                this.CONSUME1(FourTok)
                total += "4"
            })

            this.OPTION5(isFiveTok, () => {
                this.CONSUME1(FiveTok)
                total += "5"
            })

            return total
        }
    }

    function isOneTok():boolean {
        return this.NEXT_TOKEN() instanceof OneTok
    }

    function isTwoTok():boolean {
        return this.NEXT_TOKEN() instanceof TwoTok
    }

    function isThreeTok():boolean {
        return this.NEXT_TOKEN() instanceof ThreeTok
    }

    function isFourTok():boolean {
        return this.NEXT_TOKEN() instanceof FourTok
    }

    function isFiveTok():boolean {
        return this.NEXT_TOKEN() instanceof FiveTok
    }

    describe("The implicit lookahead calculation functionality of the Recognizer For OPTION", function () {

        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new OptionsImplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })

        it("can automatically compute lookahead for OPTION1", function () {
            var input = [new OneTok(1, 1)]
            var parser = new OptionsImplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("1")
        })

        it("can automatically compute lookahead for OPTION2", function () {
            var input = [new TwoTok(1, 1)]
            var parser = new OptionsImplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("2")
        })

        it("can automatically compute lookahead for OPTION3", function () {
            var input = [new ThreeTok(1, 1)]
            var parser = new OptionsImplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("3")
        })

        it("can automatically compute lookahead for OPTION4", function () {
            var input = [new FourTok(1, 1)]
            var parser = new OptionsImplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("4")
        })

        it("can automatically compute lookahead for OPTION5", function () {
            var input = [new FiveTok(1, 1)]
            var parser = new OptionsImplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("5")
        })

        it("will cache the generatedLookAhead functions AFTER (check cache is filled)", function () {
            var parser = new OptionsImplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(5)
        })
    })


    describe("The Explicit lookahead functionality of the Recognizer for OPTION", function () {

        it("can automatically compute lookahead for OPTION1", function () {
            var input = [new OneTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("1")
        })

        it("can automatically compute lookahead for OPTION2", function () {
            var input = [new TwoTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("2")
        })

        it("can automatically compute lookahead for OPTION3", function () {
            var input = [new ThreeTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("3")
        })

        it("can automatically compute lookahead for OPTION4", function () {
            var input = [new FourTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("4")
        })

        it("can automatically compute lookahead for OPTION5", function () {
            var input = [new FiveTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("5")
        })

        it("Will not cache any ImplicitLookahead functions", function () {
            var parser = new OptionsExplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })
    })

}
