module chevrotain.validations.spec {
    import gast = chevrotain.gast
    import tok = chevrotain.tokens
    import samples = test.samples

    import recog = chevrotain.recognizer

    describe("validateGrammar", function () {

        it("validates every one of the TOP_RULEs in the input", function () {
            var qualifiedNameErr1 = new gast.TOP_LEVEL("qualifiedNameErr1", [
                new gast.Terminal(samples.IdentTok, 1),
                new gast.MANY([
                    new gast.Terminal(samples.DotTok),
                    new gast.Terminal(samples.IdentTok, 1) // duplicate Terminal IdentTok with occurrence index 1
                ])
            ])

            var qualifiedNameErr2 = new gast.TOP_LEVEL("qualifiedNameErr2", [
                new gast.Terminal(samples.IdentTok, 1),
                new gast.MANY([
                    new gast.Terminal(samples.DotTok),
                    new gast.Terminal(samples.IdentTok, 2)
                ]),
                new gast.MANY([
                    new gast.Terminal(samples.DotTok),
                    new gast.Terminal(samples.IdentTok, 2)
                ])
            ])
            var errors = validateGrammar([qualifiedNameErr1, qualifiedNameErr2])
            expect(errors.length).toBe(4)
        })
    })


    describe("identifyProductionForDuplicates function", function () {
        it("generates DSL code for a ProdRef", function () {
            var dslCode = identifyProductionForDuplicates(new gast.ProdRef("ActionDeclaration"))
            expect(dslCode).toBe("SUBRULE_#_1_#_ActionDeclaration")
        })

        it("generates DSL code for a OPTION", function () {
            var dslCode = identifyProductionForDuplicates(new gast.OPTION([], 3))
            expect(dslCode).toBe("OPTION_#_3_#_")
        })

        it("generates DSL code for a AT_LEAST_ONE", function () {
            var dslCode = identifyProductionForDuplicates(new gast.AT_LEAST_ONE([]))
            expect(dslCode).toBe("AT_LEAST_ONE_#_1_#_")
        })

        it("generates DSL code for a MANY", function () {
            var dslCode = identifyProductionForDuplicates(new gast.MANY([], 5))
            expect(dslCode).toBe("MANY_#_5_#_")
        })

        it("generates DSL code for a OR", function () {
            var dslCode = identifyProductionForDuplicates(new gast.OR([], 1))
            expect(dslCode).toBe("OR_#_1_#_")
        })

        it("generates DSL code for a Terminal", function () {
            var dslCode = identifyProductionForDuplicates(new gast.Terminal(samples.IdentTok, 4))
            expect(dslCode).toBe("CONSUME_#_4_#_IdentTok")
        })
    })


    describe("OccurrenceValidationCollector GASTVisitor class", function () {

        it("collects all the productions relevant to occurrence validation", function () {
            var qualifiedNameVisitor = new OccurrenceValidationCollector()
            samples.qualifiedName.accept(qualifiedNameVisitor)
            expect(qualifiedNameVisitor.allProductions.length).toBe(4)

            // TODO: check set equality

            var actionDecVisitor = new OccurrenceValidationCollector()
            samples.actionDec.accept(actionDecVisitor)
            expect(actionDecVisitor.allProductions.length).toBe(13)

            // TODO: check set equality
        })

    })


    export class PlusTok extends tok.Token {
        constructor() { super("+", 0, 1, 1) }
    }

    export class MinusTok extends tok.Token {
        constructor() { super("+", 0, 1, 1) }
    }

    class ErroneousOccurrenceNumUsageParser1 extends recog.Parser {

        constructor(input:tok.Token[] = []) {
            super(input, [PlusTok])
            recog.Parser.performSelfAnalysis(this)
        }

        public duplicateRef = this.RULE("duplicateRef", () => {
            this.SUBRULE1(this.anotherRule)
            this.SUBRULE(this.anotherRule)
        })

        public anotherRule = this.RULE("anotherRule", () => {
            this.CONSUME(PlusTok)
        })
    }

    class ErroneousOccurrenceNumUsageParser2 extends recog.Parser {

        constructor(input:tok.Token[] = []) {
            super(input, [PlusTok])
            recog.Parser.performSelfAnalysis(this)
        }

        public duplicateTerminal = this.RULE("duplicateTerminal", () => {
            this.CONSUME3(PlusTok)
            this.CONSUME3(PlusTok)
        })
    }

    class ErroneousOccurrenceNumUsageParser3 extends recog.Parser {

        constructor(input:tok.Token[] = []) {
            super(input, [PlusTok, MinusTok])
            recog.Parser.performSelfAnalysis(this)
        }

        public duplicateMany = this.RULE("duplicateMany", () => {
            this.MANY(() => {
                this.CONSUME1(MinusTok)
                this.MANY(() => {
                    this.CONSUME1(PlusTok)
                })
            })
        })
    }

    var myToken = tok.extendToken("myToken")
    var myOtherToken = tok.extendToken("myOtherToken")

    class ValidOccurrenceNumUsageParser extends recog.Parser {

        constructor(input:tok.Token[] = []) {
            super(input, [myToken, myOtherToken])
            recog.Parser.performSelfAnalysis(this)
        }

        public anonymousTokens = this.RULE("anonymousTokens", () => {
            this.CONSUME1(myToken)
            this.CONSUME1(myOtherToken)
        })
    }

    describe("The duplicate occurrence validations full flow", function () {

        it("will throw errors on duplicate Terminals consumption in the same top level rule", function () {
            var thrown = false
            try {
                //noinspection JSUnusedLocalSymbols
                var parser = new ErroneousOccurrenceNumUsageParser1()
                // todo: need to update to jsamine > 2.0.0 on node.js to get support for
                // expect(...).toThrow("partial string to match")
            } catch (e) {
                thrown = true
                expect(_.contains(e.message, "SUBRULE")).toBe(true)
                expect(_.contains(e.message, "1")).toBe(true)
                expect(_.contains(e.message, "duplicateRef")).toBe(true)
                expect(_.contains(e.message, "anotherRule")).toBe(true)
                expect(_.contains(e.message, "both have the same occurrence index 1")).toBe(true)
            }
            expect(thrown).toBe(true)
        })

        it("will throw errors on duplicate Subrules references in the same top level rule", function () {
            var thrown = false
            try {
                //noinspection JSUnusedLocalSymbols
                var parser = new ErroneousOccurrenceNumUsageParser2()
                // todo: need to update to jsamine > 2.0.0 on node.js to get support for
                // expect(...).toThrow("partial string to match")
            } catch (e) {
                thrown = true
                expect(_.contains(e.message, "CONSUME")).toBe(true)
                expect(_.contains(e.message, "3")).toBe(true)
                expect(_.contains(e.message, "PlusTok")).toBe(true)
                expect(_.contains(e.message, "duplicateTerminal")).toBe(true)
            }
            expect(thrown).toBe(true)
        })

        it("will throw errors on duplicate MANY productions in the same top level rule", function () {
            var thrown = false
            try {
                //noinspection JSUnusedLocalSymbols
                var parser = new ErroneousOccurrenceNumUsageParser3()
                // todo: need to update to jsamine > 2.0.0 on node.js to get support for
                // expect(...).toThrow("partial string to match")
            } catch (e) {
                thrown = true
                expect(_.contains(e.message, "MANY")).toBe(true)
                expect(_.contains(e.message, "1")).toBe(true)
                expect(_.contains(e.message, "duplicateMany")).toBe(true)
                expect(_.contains(e.message, "both have the same occurrence index 1")).toBe(true)

            }
            expect(thrown).toBe(true)
        })


        it("won't detect issues in a Parser using Tokens created by extendToken(...) utility (anonymous)", function () {
            //noinspection JSUnusedLocalSymbols
            var parser = new ValidOccurrenceNumUsageParser()
        })


    })
}
