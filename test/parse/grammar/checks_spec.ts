module chevrotain.checks.spec {
    import gast = chevrotain.gast
    import samples = test.samples

    describe("validateGrammar", function () {

        it("validates every one of the TOP_RULEs in the input", function () {

            var expectedErrorsNoMsg = [{
                "type":       1,
                "ruleName":   "qualifiedNameErr1",
                "dslName":    "CONSUME",
                "occurrence": 1,
                "parameter":  "IdentTok"
            }, {
                "type":       1,
                "ruleName":   "qualifiedNameErr2",
                "dslName":    "MANY",
                "occurrence": 1
            }, {
                "type":       1,
                "ruleName":   "qualifiedNameErr2",
                "dslName":    "CONSUME",
                "occurrence": 1,
                "parameter":  "DotTok"
            }, {
                "type":       1,
                "ruleName":   "qualifiedNameErr2",
                "dslName":    "CONSUME",
                "occurrence": 2,
                "parameter":  "IdentTok"
            }]


            var qualifiedNameErr1 = new gast.Rule("qualifiedNameErr1", [
                new gast.Terminal(samples.IdentTok, 1),
                new gast.Repetition([
                    new gast.Terminal(samples.DotTok),
                    new gast.Terminal(samples.IdentTok, 1) // duplicate Terminal IdentTok with occurrence index 1
                ])
            ])

            var qualifiedNameErr2 = new gast.Rule("qualifiedNameErr2", [
                new gast.Terminal(samples.IdentTok, 1),
                new gast.Repetition([
                    new gast.Terminal(samples.DotTok),
                    new gast.Terminal(samples.IdentTok, 2)
                ]),
                new gast.Repetition([
                    new gast.Terminal(samples.DotTok),
                    new gast.Terminal(samples.IdentTok, 2)
                ])
            ])
            var actualErrors = validateGrammar([qualifiedNameErr1, qualifiedNameErr2])
            expect(actualErrors.length).to.equal(4)

            var actualErrorsNoMsg = _.map(actualErrors, err => _.omit(err, "message"))
            expect(actualErrorsNoMsg).to.deep.include.members(expectedErrorsNoMsg)
            expect(expectedErrorsNoMsg).to.deep.include.members(actualErrorsNoMsg)
        })
    })


    describe("identifyProductionForDuplicates function", function () {
        it("generates DSL code for a ProdRef", function () {
            var dslCode = identifyProductionForDuplicates(new gast.NonTerminal("ActionDeclaration"))
            expect(dslCode).to.equal("SUBRULE_#_1_#_ActionDeclaration")
        })

        it("generates DSL code for a OPTION", function () {
            var dslCode = identifyProductionForDuplicates(new gast.Option([], 3))
            expect(dslCode).to.equal("OPTION_#_3_#_")
        })

        it("generates DSL code for a AT_LEAST_ONE", function () {
            var dslCode = identifyProductionForDuplicates(new gast.RepetitionMandatory([]))
            expect(dslCode).to.equal("AT_LEAST_ONE_#_1_#_")
        })

        it("generates DSL code for a MANY", function () {
            var dslCode = identifyProductionForDuplicates(new gast.Repetition([], 5))
            expect(dslCode).to.equal("MANY_#_5_#_")
        })

        it("generates DSL code for a OR", function () {
            var dslCode = identifyProductionForDuplicates(new gast.Alternation([], 1))
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
            expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw("SUBRULE")
            expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw("1")
            expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw("duplicateRef")
            expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw("anotherRule")
            expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw("both have the same occurrence index 1")
        })

        it("will throw errors on duplicate Subrules references in the same top level rule", function () {
            expect(() => new ErroneousOccurrenceNumUsageParser2()).to.throw("CONSUME")
            expect(() => new ErroneousOccurrenceNumUsageParser2()).to.throw("3")
            expect(() => new ErroneousOccurrenceNumUsageParser2()).to.throw("PlusTok")
            expect(() => new ErroneousOccurrenceNumUsageParser2()).to.throw("duplicateTerminal")
        })

        it("will throw errors on duplicate MANY productions in the same top level rule", function () {
            expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw("MANY")
            expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw("1")
            expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw("duplicateMany")
            expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw("both have the same occurrence index 1")
        })

        it("won't detect issues in a Parser using Tokens created by extendToken(...) utility (anonymous)", function () {
            //noinspection JSUnusedLocalSymbols
            var parser = new ValidOccurrenceNumUsageParser()
        })
    })


    class InvalidRefParser extends Parser {

        constructor(input:Token[] = []) {
            super(input, [myToken, myOtherToken])
            Parser.performSelfAnalysis(this)
        }

        public one = this.RULE("one", () => {
            this.SUBRULE2((<any>this).oopsTypo)
        })

    }

    describe("The reference resolver validation full flow", function () {

        it("will throw an error when trying to init a parser with unresolved rule references ", function () {
            expect(() => new InvalidRefParser()).to.throw("oopsTypo")
            expect(() => new InvalidRefParser()).to.throw("Parser Definition Errors detected")
            expect(() => new InvalidRefParser()).to.throw("reference to rule which is not defined")
        })
    })
}
