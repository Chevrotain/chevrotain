module chevrotain.validations.spec {
    import gast = chevrotain.gast
    import tok = chevrotain.tokens
    import samples = test.samples

    describe("Grammar Validations module", function () {

        describe("validateGrammar", function () {

            it("validates every one of the TOP_RULEs in the input", function () {
                var qualifiedNameErr1 = new gast.TOP_LEVEL("qualifiedNameErr1", [
                    new gast.Terminal(samples.IdentTok, 1),
                    new gast.MANY([
                        new gast.Terminal(samples.DotTok),
                        new gast.Terminal(samples.IdentTok, 1)//this is the error
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
                var dslCode = identifyProductionForDuplicates(new gast.ProdRef("this.ActionDeclaration"))
                expect(dslCode).toBe("SUBRULE1(this.ActionDeclaration)")
            })

            it("generates DSL code for a OPTION", function () {
                var dslCode = identifyProductionForDuplicates(new gast.OPTION([], 1))
                expect(dslCode).toBe("OPTION1(...)")
            })

            it("generates DSL code for a AT_LEAST_ONE", function () {
                var dslCode = identifyProductionForDuplicates(new gast.AT_LEAST_ONE([], 1))
                expect(dslCode).toBe("AT_LEAST_ONE1(...)")
            })

            it("generates DSL code for a MANY", function () {
                var dslCode = identifyProductionForDuplicates(new gast.MANY([], 1))
                expect(dslCode).toBe("MANY1(...)")
            })

            it("generates DSL code for a OR", function () {
                var dslCode = identifyProductionForDuplicates(new gast.OR([], 1))
                expect(dslCode).toBe("OR1(...)")
            })

            it("generates DSL code for a Terminal", function () {
                var dslCode = identifyProductionForDuplicates(new gast.Terminal(samples.IdentTok, 1))
                expect(dslCode).toBe("CONSUME1(IdentTok)")
            })
        })

        describe("The error generator function", function () {
            it("generates the correct error for OPTION with the same occurrence number", function () {
                var options : [gast.OPTION] = [
                    new gast.OPTION([], 1),
                    new gast.OPTION([], 1),
                    new gast.OPTION([], 1)
                ]
                var error = productionOccurrenceErrorGenerator(options, null)
                expect(error).toBeDefined()
                expect(getProductionDslName(error.refs[0])).toBe("OPTION")
                expect(error.refs.length).toBe(3)
            })

            it("generates the correct error for AT_LEAST_ONE with the same occurrence number", function () {
                var atLeastOne : [gast.AT_LEAST_ONE] = [
                    new gast.AT_LEAST_ONE([], 2),
                    new gast.AT_LEAST_ONE([], 2)
                ]
                var error = productionOccurrenceErrorGenerator(atLeastOne, null)
                expect(error).toBeDefined()
                expect(getProductionDslName(error.refs[0])).toBe("AT_LEAST_ONE")
                expect(error.refs.length).toBe(2)
            })

            it("generates the correct error for terminals with the same token and occurrence number", function () {
                var consumeToks : [gast.Terminal] = [
                    new gast.Terminal(samples.IdentTok, 1),
                    new gast.Terminal(samples.IdentTok, 1),
                    new gast.Terminal(samples.IdentTok, 1)
                ]
                var error = productionOccurrenceErrorGenerator(consumeToks, null)
                expect(error).toBeDefined()
                expect(getProductionDslName(error.refs[0])).toBe("CONSUME")
                expect(error.refs.length).toBe(3)
            })

            it("generates the correct error for ProdRef with the same referenced rule and occurrence number", function () {
                var subRules : [gast.ProdRef] = [
                    new gast.ProdRef("this.GroupBy"),
                    new gast.ProdRef("this.GroupBy"),
                    new gast.ProdRef("this.GroupBy")
                ]
                var error = productionOccurrenceErrorGenerator(subRules, null)
                expect(error).toBeDefined()
                expect(getProductionDslName(error.refs[0])).toBe("SUBRULE")
                expect(error.refs.length).toBe(3)
            })

        })

        describe("OccurrenceValidationCollector", function () {

            it("collects all the productions relevant to occurrence validation", function () {
                var qualifiedNameVisitor = new OccurrenceValidationCollector()
                samples.qualifiedName.accept(qualifiedNameVisitor)
                expect(qualifiedNameVisitor.allProductions.length).toBe(4)

                var actionDecVisitor = new OccurrenceValidationCollector()
                samples.actionDec.accept(actionDecVisitor)
                expect(actionDecVisitor.allProductions.length).toBe(13)
            })

        })


        describe("The GrammarError class", function () {

            it("generates the correct error message", function () {
                var grammarError = new GrammarError(
                    [new gast.Terminal(samples.ActionTok),
                        new gast.Terminal(samples.ActionTok)],
                    new gast.TOP_LEVEL("batata", []))

                expect(grammarError.toString()).toBe("Occurrence Number Error: CONSUME with occurence number 1 " +
                                                        "appears 2 times in batata with the same occurrence number")
                expect(grammarError.message).toBe("CONSUME with occurence number 1 appears 2 times in batata with " +
                                                        "the same occurrence number")
            })

        })
    })

}
