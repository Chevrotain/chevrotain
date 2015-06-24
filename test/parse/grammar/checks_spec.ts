module chevrotain.validations.spec {
    import gast = chevrotain.gast
    import samples = test.samples

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
            expect(errors.length).to.equal(4)
        })
    })


    describe("identifyProductionForDuplicates function", function () {
        it("generates DSL code for a ProdRef", function () {
            var dslCode = identifyProductionForDuplicates(new gast.ProdRef("ActionDeclaration"))
            expect(dslCode).to.equal("SUBRULE_#_1_#_ActionDeclaration")
        })

        it("generates DSL code for a OPTION", function () {
            var dslCode = identifyProductionForDuplicates(new gast.OPTION([], 3))
            expect(dslCode).to.equal("OPTION_#_3_#_")
        })

        it("generates DSL code for a AT_LEAST_ONE", function () {
            var dslCode = identifyProductionForDuplicates(new gast.AT_LEAST_ONE([]))
            expect(dslCode).to.equal("AT_LEAST_ONE_#_1_#_")
        })

        it("generates DSL code for a MANY", function () {
            var dslCode = identifyProductionForDuplicates(new gast.MANY([], 5))
            expect(dslCode).to.equal("MANY_#_5_#_")
        })

        it("generates DSL code for a OR", function () {
            var dslCode = identifyProductionForDuplicates(new gast.OR([], 1))
            expect(dslCode).to.equal("OR_#_1_#_")
        })

        it("generates DSL code for a Terminal", function () {
            var dslCode = identifyProductionForDuplicates(new gast.Terminal(samples.IdentTok, 4))
            expect(dslCode).to.equal("CONSUME_#_4_#_IdentTok")
        })
    })


    describe("OccurrenceValidationCollector GASTVisitor class", function () {

        it("collects all the productions relevant to occurrence validation", function () {
            var qualifiedNameVisitor = new OccurrenceValidationCollector()
            samples.qualifiedName.accept(qualifiedNameVisitor)
            expect(qualifiedNameVisitor.allProductions.length).to.equal(4)

            // TODO: check set equality

            var actionDecVisitor = new OccurrenceValidationCollector()
            samples.actionDec.accept(actionDecVisitor)
            expect(actionDecVisitor.allProductions.length).to.equal(13)

            // TODO: check set equality
        })

    })


    export class PlusTok extends Token {
        constructor() { super("+", 0, 1, 1) }
    }

    export class MinusTok extends Token {
        constructor() { super("+", 0, 1, 1) }
    }

    class ErroneousOccurrenceNumUsageParser1 extends Parser {

        constructor(input:Token[] = []) {
            super(input, [PlusTok])
            Parser.performSelfAnalysis(this)
        }

        public duplicateRef = this.RULE("duplicateRef", () => {
            this.SUBRULE1(this.anotherRule)
            this.SUBRULE(this.anotherRule)
        })

        public anotherRule = this.RULE("anotherRule", () => {
            this.CONSUME(PlusTok)
        })
    }

    class ErroneousOccurrenceNumUsageParser2 extends Parser {

        constructor(input:Token[] = []) {
            super(input, [PlusTok])
            Parser.performSelfAnalysis(this)
        }

        public duplicateTerminal = this.RULE("duplicateTerminal", () => {
            this.CONSUME3(PlusTok)
            this.CONSUME3(PlusTok)
        })
    }

    class ErroneousOccurrenceNumUsageParser3 extends Parser {

        constructor(input:Token[] = []) {
            super(input, [PlusTok, MinusTok])
            Parser.performSelfAnalysis(this)
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

    var myToken = extendToken("myToken")
    var myOtherToken = extendToken("myOtherToken")

    class ValidOccurrenceNumUsageParser extends Parser {

        constructor(input:Token[] = []) {
            super(input, [myToken, myOtherToken])
            Parser.performSelfAnalysis(this)
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
                // expect(...).to.throw("partial string to match")
            } catch (e) {
                thrown = true
                expect(_.contains(e.message, "SUBRULE")).to.equal(true)
                expect(_.contains(e.message, "1")).to.equal(true)
                expect(_.contains(e.message, "duplicateRef")).to.equal(true)
                expect(_.contains(e.message, "anotherRule")).to.equal(true)
                expect(_.contains(e.message, "both have the same occurrence index 1")).to.equal(true)
            }
            expect(thrown).to.equal(true)
        })

        it("will throw errors on duplicate Subrules references in the same top level rule", function () {
            var thrown = false
            try {
                //noinspection JSUnusedLocalSymbols
                var parser = new ErroneousOccurrenceNumUsageParser2()
                // todo: need to update to jsamine > 2.0.0 on node.js to get support for
                // expect(...).to.throw("partial string to match")
            } catch (e) {
                thrown = true
                expect(_.contains(e.message, "CONSUME")).to.equal(true)
                expect(_.contains(e.message, "3")).to.equal(true)
                expect(_.contains(e.message, "PlusTok")).to.equal(true)
                expect(_.contains(e.message, "duplicateTerminal")).to.equal(true)
            }
            expect(thrown).to.equal(true)
        })

        it("will throw errors on duplicate MANY productions in the same top level rule", function () {
            var thrown = false
            try {
                //noinspection JSUnusedLocalSymbols
                var parser = new ErroneousOccurrenceNumUsageParser3()
                // todo: need to update to jsamine > 2.0.0 on node.js to get support for
                // expect(...).to.throw("partial string to match")
            } catch (e) {
                thrown = true
                expect(_.contains(e.message, "MANY")).to.equal(true)
                expect(_.contains(e.message, "1")).to.equal(true)
                expect(_.contains(e.message, "duplicateMany")).to.equal(true)
                expect(_.contains(e.message, "both have the same occurrence index 1")).to.equal(true)

            }
            expect(thrown).to.equal(true)
        })

        it("won't detect issues in a Parser using Tokens created by extendToken(...) utility (anonymous)", function () {
            //noinspection JSUnusedLocalSymbols
            var parser = new ValidOccurrenceNumUsageParser()
        })

        it("will throw validation errors each time the parser is instantiated although they are calculated only once", function () {
            var thrown = 0
            for (var x = 1 ; x <= 5 ; x++) {
                try {
                    //noinspection JSUnusedLocalSymbols
                    var parser = new ErroneousOccurrenceNumUsageParser3()
                    // todo: need to update to jsamine > 2.0.0 on node.js to get support for
                    // expect(...).to.throw("partial string to match")
                } catch (e) {
                    thrown++
                }
            }

            expect(thrown).to.equal(5)
        })
    })
}
