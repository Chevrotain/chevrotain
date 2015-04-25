/// <reference path="../../src/scan/tokens.ts" />
/// <reference path="../../src/parse/recognizer.ts" />
/// <reference path="../utils/matchers.ts" />
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

    export class SixTok extends tok.Token {
        constructor(startLine:number, startColumn:number) {super(startLine, startColumn, "Six")}
    }

    class OptionsImplicitLookAheadParser extends BaseIntrospectionRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseIntrospectionRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
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

    class OptionsExplicitLookAheadParser extends BaseIntrospectionRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseIntrospectionRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
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

        it("can accept lookahead function param for OPTION1", function () {
            var input = [new OneTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("1")
        })

        it("can accept lookahead function param for OPTION2", function () {
            var input = [new TwoTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("2")
        })

        it("can accept lookahead function param for OPTION3", function () {
            var input = [new ThreeTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("3")
        })

        it("can accept lookahead function param for OPTION4", function () {
            var input = [new FourTok(1, 1)]
            var parser = new OptionsExplicitLookAheadParser(input)
            expect(parser.manyOptionsRule(1)).toBe("4")
        })

        it("can accept lookahead function param for OPTION5", function () {
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


    class ManyImplicitLookAheadParser extends BaseIntrospectionRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseIntrospectionRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public manyRule = this.RULE("manyRule", this.parseManyRule, () => { return "-666" })

        private parseManyRule():string {
            var total = ""

            this.MANY1(() => {
                this.CONSUME1(OneTok)
                total += "1"
            })

            this.MANY2(() => {
                this.CONSUME1(TwoTok)
                total += "2"
            })

            this.MANY3(() => {
                this.CONSUME1(ThreeTok)
                total += "3"
            })

            this.MANY4(() => {
                this.CONSUME1(FourTok)
                total += "4"
            })

            this.MANY5(() => {
                this.CONSUME1(FiveTok)
                total += "5"
            })

            return total
        }
    }

    class ManyExplicitLookAheadParser extends BaseIntrospectionRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseIntrospectionRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public manyRule = this.RULE("manyRule", this.parseManyRule, () => { return "-666" })

        private parseManyRule():string {
            var total = ""

            this.MANY1(isOneTok, () => {
                this.CONSUME1(OneTok)
                total += "1"
            })

            this.MANY2(isTwoTok, () => {
                this.CONSUME1(TwoTok)
                total += "2"
            })

            this.MANY3(isThreeTok, () => {
                this.CONSUME1(ThreeTok)
                total += "3"
            })

            this.MANY4(isFourTok, () => {
                this.CONSUME1(FourTok)
                total += "4"
            })

            this.MANY5(isFiveTok, () => {
                this.CONSUME1(FiveTok)
                total += "5"
            })

            return total
        }
    }

    describe("The implicit lookahead calculation functionality of the Recognizer For MANY", function () {

        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new ManyImplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })

        it("can automatically compute lookahead for MANY1", function () {
            var input = [new OneTok(1, 1)]
            var parser = new ManyImplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("1")
        })

        it("can automatically compute lookahead for MANY2", function () {
            var input = [new TwoTok(1, 1)]
            var parser = new ManyImplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("2")
        })

        it("can automatically compute lookahead for MANY3", function () {
            var input = [new ThreeTok(1, 1)]
            var parser = new ManyImplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("3")
        })

        it("can automatically compute lookahead for MANY4", function () {
            var input = [new FourTok(1, 1)]
            var parser = new ManyImplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("4")
        })

        it("can automatically compute lookahead for MANY5", function () {
            var input = [new FiveTok(1, 1)]
            var parser = new ManyImplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("5")
        })

        it("can accept lookahead function param for flow mixing several MANYs", function () {
            var input = [new OneTok(1, 1), new OneTok(1, 1), new ThreeTok(1, 1), new ThreeTok(1, 1), new ThreeTok(1, 1), new FiveTok(1, 1)]
            var parser = new ManyImplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("113335")
        })

        it("will cache the generatedLookAhead functions AFTER (check cache is filled)", function () {
            var parser = new ManyImplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(5)
        })
    })


    describe("The Explicit lookahead functionality of the Recognizer for MANY", function () {

        it("can accept lookahead function param for MANY1", function () {
            var input = [new OneTok(1, 1)]
            var parser = new ManyExplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("1")
        })

        it("can accept lookahead function param for MANY2", function () {
            var input = [new TwoTok(1, 1)]
            var parser = new ManyExplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("2")
        })

        it("can accept lookahead function param for MANY3", function () {
            var input = [new ThreeTok(1, 1)]
            var parser = new ManyExplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("3")
        })

        it("can accept lookahead function param for MANY4", function () {
            var input = [new FourTok(1, 1)]
            var parser = new ManyExplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("4")
        })

        it("can accept lookahead function param for MANY5", function () {
            var input = [new FiveTok(1, 1)]
            var parser = new ManyExplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("5")
        })

        it("can accept lookahead function param for flow mixing several MANYs", function () {
            var input = [new OneTok(1, 1), new OneTok(1, 1), new ThreeTok(1, 1), new ThreeTok(1, 1), new ThreeTok(1, 1), new FiveTok(1, 1)]
            var parser = new ManyExplicitLookAheadParser(input)
            expect(parser.manyRule(1)).toBe("113335")
        })

        it("Will not cache any ImplicitLookahead functions when provided with explicit versions", function () {
            var parser = new ManyExplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })
    })


    class AtLeastOneImplicitLookAheadParser extends BaseIntrospectionRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseIntrospectionRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public atLeastOneRule = this.RULE("atLeastOneRule", this.parseAtLeastOneRule, () => { return "-666" })

        private parseAtLeastOneRule():string {
            var total = ""

            this.AT_LEAST_ONE1(() => {
                this.CONSUME1(OneTok)
                total += "1"
            }, "Ones")

            this.AT_LEAST_ONE2(() => {
                this.CONSUME1(TwoTok)
                total += "2"
            }, "Twos")

            this.AT_LEAST_ONE3(() => {
                this.CONSUME1(ThreeTok)
                total += "3"
            }, "Threes")

            this.AT_LEAST_ONE4(() => {
                this.CONSUME1(FourTok)
                total += "4"
            }, "Fours")

            this.AT_LEAST_ONE5(() => {
                this.CONSUME1(FiveTok)
                total += "5"
            }, "Fives")

            return total
        }
    }

    class AtLeastOneExplicitLookAheadParser extends BaseIntrospectionRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseIntrospectionRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public atLeastOneRule = this.RULE("atLeastOneRule", this.parseAtLeastOneRule, () => { return "-666" })

        private parseAtLeastOneRule():string {
            var total = ""

            this.AT_LEAST_ONE1(isOneTok, () => {
                this.CONSUME1(OneTok)
                total += "1"
            }, "Ones")

            this.AT_LEAST_ONE2(isTwoTok, () => {
                this.CONSUME1(TwoTok)
                total += "2"
            }, "Twos")

            this.AT_LEAST_ONE3(isThreeTok, () => {
                this.CONSUME1(ThreeTok)
                total += "3"
            }, "Threes")

            this.AT_LEAST_ONE4(isFourTok, () => {
                this.CONSUME1(FourTok)
                total += "4"
            }, "Fours")

            this.AT_LEAST_ONE5(isFiveTok, () => {
                this.CONSUME1(FiveTok)
                total += "5"
            }, "Fives")

            return total
        }
    }

    describe("The implicit lookahead calculation functionality of the Recognizer For AT_LEAST_ONE", function () {

        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new AtLeastOneImplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })

        it("can accept lookahead function param for AT_LEAST_ONE1-5", function () {
            var input = [new OneTok(1, 1), new TwoTok(1, 1), new TwoTok(1, 1), new ThreeTok(1, 1),
                new FourTok(1, 1), new FourTok(1, 1), new FiveTok(1, 1)]
            var parser = new AtLeastOneImplicitLookAheadParser(input)
            expect(parser.atLeastOneRule(1)).toBe("1223445")
        })

        it("will fail when zero occurrences of AT_LEAST_ONE in input", function () {
            var input = [new OneTok(1, 1), new TwoTok(1, 1), /*new ThreeTok(1, 1),*/ new FourTok(1, 1), new FiveTok(1, 1)]
            var parser = new AtLeastOneImplicitLookAheadParser(input)
            expect(parser.atLeastOneRule(1)).toBe("-666")
        })

        it("will cache the generatedLookAhead functions AFTER (check cache is filled)", function () {
            var parser = new AtLeastOneImplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(5)
        })
    })

    describe("The Explicit lookahead functionality of the Recognizer for AT_LEAST_ONE", function () {

        it("can accept lookahead function param for AT_LEAST_ONE1-5", function () {
            var input = [new OneTok(1, 1), new TwoTok(1, 1), new TwoTok(1, 1), new ThreeTok(1, 1),
                new FourTok(1, 1), new FourTok(1, 1), new FiveTok(1, 1)]
            var parser = new AtLeastOneExplicitLookAheadParser(input)
            expect(parser.atLeastOneRule(1)).toBe("1223445")
        })

        it("will fail when zero occurrences of AT_LEAST_ONE in input", function () {
            var input = [new OneTok(1, 1), new TwoTok(1, 1), /*new ThreeTok(1, 1),*/ new FourTok(1, 1), new FiveTok(1, 1)]
            var parser = new AtLeastOneExplicitLookAheadParser(input)
            expect(parser.atLeastOneRule(1)).toBe("-666")
        })

        it("Will not cache any ImplicitLookahead functions when provided with explicit versions", function () {
            var parser = new AtLeastOneExplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })
    })


    class OrImplicitLookAheadParser extends BaseIntrospectionRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseIntrospectionRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public orRule = this.RULE("orRule", this.parseOrRule, () => { return "-666" })

        private parseOrRule():string {
            var total = ""

            // @formatter:off
            this.OR1([
                {ALT: () => {
                    this.CONSUME1(OneTok)
                    total += "A1"
                }},
                {ALT: () => {
                    this.CONSUME1(TwoTok)
                    total += "A2"
                }},
                {ALT: () => {
                    this.CONSUME1(ThreeTok)
                    total += "A3"
                }},
                {ALT: () => {
                    this.CONSUME1(FourTok)
                    total += "A4"
                }},
                {ALT: () => {
                    this.CONSUME1(FiveTok)
                    total += "A5"
                }},
            ], "digits")

            this.OR2([
                {ALT: () => {
                    this.CONSUME2(OneTok)
                    total += "B1"
                }},
                {ALT: () => {
                    this.CONSUME2(FourTok)
                    total += "B4"
                }},
                {ALT: () => {
                    this.CONSUME2(ThreeTok)
                    total += "B3"
                }},
                 {ALT: () => {
                    this.CONSUME2(TwoTok)
                    total += "B2"
                }},
                {ALT: () => {
                    this.CONSUME2(FiveTok)
                    total += "B5"
                }},
            ], "digits")

            this.OR3([
                {ALT: () => {
                    this.CONSUME3(TwoTok)
                    total += "C2"
                }},
                {ALT: () => {
                    this.CONSUME3(FourTok)
                    total += "C4"
                }},
                {ALT: () => {
                    this.CONSUME3(ThreeTok)
                    total += "C3"
                }},
                {ALT: () => {
                    this.CONSUME3(FiveTok)
                    total += "C5"
                }},
                 {ALT: () => {
                    this.CONSUME3(OneTok)
                    total += "C1"
                }}
            ], "digits")

            this.OR4([
                {ALT: () => {
                    this.CONSUME4(OneTok)
                    total += "D1"
                }},
                {ALT: () => {
                    this.CONSUME4(ThreeTok)
                    total += "D3"
                }},
                {ALT: () => {
                    this.CONSUME4(FourTok)
                    total += "D4"
                }},
                {ALT: () => {
                    this.CONSUME4(TwoTok)
                    total += "D2"
                }},
                {ALT: () => {
                    this.CONSUME4(FiveTok)
                    total += "D5"
                }}
            ], "digits")

            this.OR5([
                {ALT: () => {
                    this.CONSUME5(TwoTok)
                    total += "E2"
                }},
                 {ALT: () => {
                    this.CONSUME5(OneTok)
                    total += "E1"
                }},
                {ALT: () => {
                    this.CONSUME5(FourTok)
                    total += "E4"
                }},
                 {ALT: () => {
                    this.CONSUME5(ThreeTok)
                    total += "E3"
                }},
                {ALT: () => {
                    this.CONSUME5(FiveTok)
                    total += "E5"
                }},
            ], "digits")

            // @formatter:on
            return total
        }
    }

    describe("The implicit lookahead calculation functionality of the Recognizer For OR", function () {

        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new OrImplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })

        it("can compute the lookahead automatically for OR1-5", function () {
            var input = [new OneTok(1, 1), new TwoTok(1, 1), new ThreeTok(1, 1), new FourTok(1, 1), new FiveTok(1, 1)]
            var parser = new OrImplicitLookAheadParser(input)
            expect(parser.orRule(1)).toBe("A1B2C3D4E5")
        })

        it("will fail when none of the alternatives match", function () {
            var input = [new SixTok(1, 1)]
            var parser = new OrImplicitLookAheadParser(input)
            expect(parser.orRule(1)).toBe("-666")
        })

        it("will cache the generatedLookAhead functions AFTER (check cache is filled)", function () {
            var parser = new OrImplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(5)
        })
    })

    class OrExplicitLookAheadParser extends BaseIntrospectionRecognizer {

        public getLookAheadCache():lang.HashTable<Function> {
            return recog.BaseIntrospectionRecognizer.getLookaheadFuncsForClass(this)
        }

        constructor(input:tok.Token[] = []) {
            super(input, <any>chevrotain.recognizer.lookahead.spec)
            recog.BaseIntrospectionRecognizer.performSelfAnalysis(this)
        }

        public orRule = this.RULE("orRule", this.parseOrRule, () => { return "-666" })

        private parseOrRule():string {
            var total = ""

            // @formatter:off
            this.OR1([
                {WHEN: isOneTok, THEN_DO: () => {
                    this.CONSUME1(OneTok)
                    total += "1"
                }},
                {WHEN: isTwoTok, THEN_DO: () => {
                    this.CONSUME1(TwoTok)
                    total += "2"
                }},
                {WHEN: isThreeTok, THEN_DO: () => {
                    this.CONSUME1(ThreeTok)
                    total += "3"
                }},
                {WHEN: isFourTok, THEN_DO: () => {
                    this.CONSUME1(FourTok)
                    total += "4"
                }},
                {WHEN: isFiveTok, THEN_DO: () => {
                    this.CONSUME1(FiveTok)
                    total += "5"
                }},
            ], "digits")

            // @formatter:on
            return total
        }
    }

    describe("The Explicit lookahead functionality of the Recognizer for OR", function () {

        it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", function () {
            var parser = new OrExplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })

        it("can accept the lookahead param explicitly for OR", function () {
            var input = [new TwoTok(1, 1)]
            var parser = new OrExplicitLookAheadParser(input)
            expect(parser.orRule(1)).toBe("2")
        })

        it("will fail when none of the alternatives match", function () {
            var input = [new SixTok(1, 1)]
            var parser = new OrExplicitLookAheadParser(input)
            expect(parser.orRule(1)).toBe("-666")
        })

        it("will NOT cache the generatedLookAhead functions in explicit mode", function () {
            var parser = new OrExplicitLookAheadParser()
            var lookaheadCache = parser.getLookAheadCache()
            expect(lookaheadCache.keys().length).toBe(0)
        })
    })

}
