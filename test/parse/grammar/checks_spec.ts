module chevrotain.checks.spec {
    import gast = chevrotain.gast
    import samples = specs.samples

    describe("the grammar validations", function () {

        it("validates every one of the TOP_RULEs in the input", function () {

            let expectedErrorsNoMsg = [{
                "type":       ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                "ruleName":   "qualifiedNameErr1",
                "dslName":    "CONSUME",
                "occurrence": 1,
                "parameter":  "IdentTok"
            }, {
                "type":       ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                "ruleName":   "qualifiedNameErr2",
                "dslName":    "MANY",
                "occurrence": 1
            }, {
                "type":       ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                "ruleName":   "qualifiedNameErr2",
                "dslName":    "CONSUME",
                "occurrence": 1,
                "parameter":  "DotTok"
            }, {
                "type":       ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                "ruleName":   "qualifiedNameErr2",
                "dslName":    "CONSUME",
                "occurrence": 2,
                "parameter":  "IdentTok"
            }]


            let qualifiedNameErr1 = new gast.Rule("qualifiedNameErr1", [
                new gast.Terminal(samples.IdentTok, 1),
                new gast.Repetition([
                    new gast.Terminal(samples.DotTok),
                    new gast.Terminal(samples.IdentTok, 1) // duplicate Terminal IdentTok with occurrence index 1
                ])
            ])

            let qualifiedNameErr2 = new gast.Rule("qualifiedNameErr2", [
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
            let actualErrors = validateGrammar([qualifiedNameErr1, qualifiedNameErr2])
            expect(actualErrors.length).to.equal(4)

            let actualErrorsNoMsg = _.map(actualErrors, err => _.omit(err, "message"))
            expect(actualErrorsNoMsg).to.deep.include.members(expectedErrorsNoMsg)
            expect(expectedErrorsNoMsg).to.deep.include.members(actualErrorsNoMsg)
        })

        it("does not allow duplicate grammar rule names", function () {
            let noErrors = validateRuleName("A", ["B", "C"], "className")
            //noinspection BadExpressionStatementJS
            expect(noErrors).to.be.empty

            let duplicateErr = validateRuleName("A", ["A", "B", "C"], "className")
            //noinspection BadExpressionStatementJS
            expect(duplicateErr).to.have.length(1)
            expect(duplicateErr[0]).to.have.property("message")
            expect(duplicateErr[0]).to.have.property("type", ParserDefinitionErrorType.DUPLICATE_RULE_NAME)
            expect(duplicateErr[0]).to.have.property("ruleName", "A")
        })

        it("only allows a subset of ECMAScript identifiers as rule names", function () {
            let res1 = validateRuleName("1baa", [], "className")
            expect(res1).to.have.lengthOf(1)
            expect(res1[0]).to.have.property("message")
            expect(res1[0]).to.have.property("type", ParserDefinitionErrorType.INVALID_RULE_NAME)
            expect(res1[0]).to.have.property("ruleName", "1baa")

            let res2 = validateRuleName("שלום", [], "className")
            expect(res2).to.have.lengthOf(1)
            expect(res2[0]).to.have.property("message")
            expect(res2[0]).to.have.property("type", ParserDefinitionErrorType.INVALID_RULE_NAME)
            expect(res2[0]).to.have.property("ruleName", "שלום")

            let res3 = validateRuleName("$bamba", [], "className")
            expect(res3).to.have.lengthOf(1)
            expect(res3[0]).to.have.property("message")
            expect(res3[0]).to.have.property("type", ParserDefinitionErrorType.INVALID_RULE_NAME)
            expect(res3[0]).to.have.property("ruleName", "$bamba")
        })
    })


    describe("identifyProductionForDuplicates function", function () {
        it("generates DSL code for a ProdRef", function () {
            let dslCode = identifyProductionForDuplicates(new gast.NonTerminal("ActionDeclaration"))
            expect(dslCode).to.equal("SUBRULE_#_1_#_ActionDeclaration")
        })

        it("generates DSL code for a OPTION", function () {
            let dslCode = identifyProductionForDuplicates(new gast.Option([], 3))
            expect(dslCode).to.equal("OPTION_#_3_#_")
        })

        it("generates DSL code for a AT_LEAST_ONE", function () {
            let dslCode = identifyProductionForDuplicates(new gast.RepetitionMandatory([]))
            expect(dslCode).to.equal("AT_LEAST_ONE_#_1_#_")
        })

        it("generates DSL code for a MANY", function () {
            let dslCode = identifyProductionForDuplicates(new gast.Repetition([], 5))
            expect(dslCode).to.equal("MANY_#_5_#_")
        })

        it("generates DSL code for a OR", function () {
            let dslCode = identifyProductionForDuplicates(new gast.Alternation([], 1))
            expect(dslCode).to.equal("OR_#_1_#_")
        })

        it("generates DSL code for a Terminal", function () {
            let dslCode = identifyProductionForDuplicates(new gast.Terminal(samples.IdentTok, 4))
            expect(dslCode).to.equal("CONSUME_#_4_#_IdentTok")
        })
    })


    describe("OccurrenceValidationCollector GASTVisitor class", function () {

        it("collects all the productions relevant to occurrence validation", function () {
            let qualifiedNameVisitor = new OccurrenceValidationCollector()
            samples.qualifiedName.accept(qualifiedNameVisitor)
            expect(qualifiedNameVisitor.allProductions.length).to.equal(4)

            // TODO: check set equality

            let actionDecVisitor = new OccurrenceValidationCollector()
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

    let myToken = extendToken("myToken")
    let myOtherToken = extendToken("myOtherToken")

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
            let parser = new ValidOccurrenceNumUsageParser()
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

    class InvalidRefParser2 extends Parser {

        constructor(input:Token[] = []) {
            super(input, [myToken, myOtherToken])
            Parser.performSelfAnalysis(this)
        }

        public one = this.RULE("one", () => {
            this.SUBRULE2((<any>this).oopsTypo)
        })
    }

    describe("The reference resolver validation full flow", function () {

        it("will throw an error when trying to init a parser with unresolved rule references", function () {
            expect(() => new InvalidRefParser()).to.throw("oopsTypo")
            expect(() => new InvalidRefParser()).to.throw("Parser Definition Errors detected")
            expect(() => new InvalidRefParser()).to.throw("reference to rule which is not defined")
        })

        it("won't throw an error when trying to init a parser with definition errors but with a flag active to defer handling" +
            "of definition errors", function () {
            Parser.DEFER_DEFINITION_ERRORS_HANDLING = true
            expect(() => new InvalidRefParser2()).to.not.throw()
            expect(() => new InvalidRefParser2()).to.not.throw()
            expect(() => new InvalidRefParser2()).to.not.throw()
            Parser.DEFER_DEFINITION_ERRORS_HANDLING = false
        })
    })


    class DuplicateRulesParser extends Parser {

        constructor(input:Token[] = []) {
            super(input, [myToken, myOtherToken])
            Parser.performSelfAnalysis(this)
        }

        public one = this.RULE("oops_duplicate", () => {})
        public two = this.RULE("oops_duplicate", () => {})
    }

    class InvalidRuleNameParser extends Parser {

        constructor(input:Token[] = []) {
            super(input, [myToken, myOtherToken])
            Parser.performSelfAnalysis(this)
        }

        public one = this.RULE("שלום", () => {})
    }

    describe("The rule names  validation full flow", function () {

        it("will throw an error when trying to init a parser with duplicate ruleNames", function () {
            expect(() => new DuplicateRulesParser()).to.throw("is already defined in the grammar")
            expect(() => new DuplicateRulesParser()).to.throw("DuplicateRulesParser")
            expect(() => new DuplicateRulesParser()).to.throw("oops_duplicate")
        })

        it("will throw an error when trying to init a parser with an invalid rule names", function () {
            expect(() => new InvalidRuleNameParser()).to.throw("it must match the pattern")
            expect(() => new InvalidRuleNameParser()).to.throw("Invalid Grammar rule name")
            expect(() => new InvalidRuleNameParser()).to.throw("שלום")
        })

        it("won't throw an errors when trying to init a parser with definition errors but with a flag active to defer handling" +
            "of definition errors (ruleName validation", function () {
            Parser.DEFER_DEFINITION_ERRORS_HANDLING = true
            expect(() => new InvalidRuleNameParser()).to.not.throw()
            expect(() => new InvalidRuleNameParser()).to.not.throw()
            expect(() => new DuplicateRulesParser()).to.not.throw()
            expect(() => new DuplicateRulesParser()).to.not.throw()
            Parser.DEFER_DEFINITION_ERRORS_HANDLING = false
        })
    })
}
