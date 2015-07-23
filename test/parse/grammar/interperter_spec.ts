
module chevrotain.interpreter.spec {

    import t = specs.samples
    import samples = specs.samples
    import p = chevrotain.path
    import matchers = specs.matchers

    describe("The Grammar Interpeter module", function () {
        "use strict"

        describe("The NextAfterTokenWalker", function () {

            it("can compute the next possible token types From ActionDec in scope of ActionDec #1", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec"],
                    occurrenceStack:   [1],
                    lastTok:           t.ActionTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.IdentTok)
            })

            it("can compute the next possible token types From ActionDec in scope of ActionDec #2", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec"],
                    occurrenceStack:   [1],
                    lastTok:           t.IdentTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.LParenTok)
            })

            it("can compute the next possible token types From ActionDec in scope of ActionDec #3", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec"],
                    occurrenceStack:   [1],
                    lastTok:           t.LParenTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(2)
                matchers.setEquality(possibleNextTokTypes, [t.IdentTok, t.RParenTok])
            })

            it("can compute the next possible token types From ActionDec in scope of ActionDec #4", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec"],
                    occurrenceStack:   [1],
                    lastTok:           t.CommaTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.IdentTok)
            })

            it("can compute the next possible token types From ActionDec in scope of ActionDec #5", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec"],
                    occurrenceStack:   [1],
                    lastTok:           t.RParenTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(2)
                matchers.setEquality(possibleNextTokTypes, [t.SemicolonTok, t.ColonTok])
            })

            it("can compute the next possible token types From ActionDec in scope of ActionDec #6", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec"],
                    occurrenceStack:   [1],
                    lastTok:           t.ColonTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.IdentTok)
            })

            it("can compute the next possible token types From ActionDec in scope of ActionDec #7", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec"],
                    occurrenceStack:   [1],
                    lastTok:           t.SemicolonTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(0)
            })

            it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #1", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec"
                    ],
                    occurrenceStack:   [1, 1],
                    lastTok:           t.IdentTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.ColonTok)
            })

            it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #2", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec"
                    ],
                    occurrenceStack:   [1, 1],
                    lastTok:           t.ColonTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.IdentTok)
            })

            it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #3", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec"
                    ],
                    occurrenceStack:   [1, 1],
                    lastTok:           t.LSquareTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.RSquareTok)
            })

            it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #4", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec"
                    ],
                    occurrenceStack:   [1, 1],
                    lastTok:           t.RSquareTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(2)
                matchers.setEquality(possibleNextTokTypes, [t.CommaTok, t.RParenTok])
            })

            it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #1", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec"
                    ],
                    occurrenceStack:   [1, 2],
                    lastTok:           t.IdentTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.ColonTok)
            })

            it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #2", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec"
                    ],
                    occurrenceStack:   [1, 2],
                    lastTok:           t.ColonTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.IdentTok)
            })

            it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #3", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec"
                    ],
                    occurrenceStack:   [1, 2],
                    lastTok:           t.LSquareTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.RSquareTok)
            })

            it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #4", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec"
                    ],
                    occurrenceStack:   [1, 2],
                    lastTok:           t.RSquareTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(2)
                matchers.setEquality(possibleNextTokTypes, [t.CommaTok, t.RParenTok])
            })

            it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #1", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec",
                        "qualifiedName"
                    ],
                    occurrenceStack:   [1, 1, 1],
                    lastTok:           t.IdentTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(4)
                matchers.setEquality(possibleNextTokTypes, [t.DotTok, t.LSquareTok, t.CommaTok, t.RParenTok])
            })

            it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #2", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec",
                        "qualifiedName"
                    ],
                    occurrenceStack:   [1, 1, 1],
                    lastTok:           t.DotTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.IdentTok)
            })

            it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["actionDec",
                        "paramSpec",
                        "qualifiedName"
                    ],
                    occurrenceStack:   [1, 1, 1],
                    lastTok:           t.IdentTok,
                    lastTokOccurrence: 2
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.actionDec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(4)
                matchers.setEquality(possibleNextTokTypes, [t.DotTok, t.LSquareTok, t.CommaTok, t.RParenTok])
            })

            it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["paramSpec",
                        "qualifiedName"
                    ],
                    occurrenceStack:   [1, 1],
                    lastTok:           t.IdentTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.paramSpec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(2)
                matchers.setEquality(possibleNextTokTypes, [t.DotTok, t.LSquareTok])
            })

            it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["paramSpec",
                        "qualifiedName"
                    ],
                    occurrenceStack:   [1, 1],
                    lastTok:           t.DotTok,
                    lastTokOccurrence: 1
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.paramSpec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(t.IdentTok)
            })

            it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["paramSpec",
                        "qualifiedName"
                    ],
                    occurrenceStack:   [1, 1],
                    lastTok:           t.IdentTok,
                    lastTokOccurrence: 2
                }

                var possibleNextTokTypes = new NextAfterTokenWalker(samples.paramSpec, caPath).startWalking()
                expect(possibleNextTokTypes.length).to.equal(2)
                matchers.setEquality(possibleNextTokTypes, [t.DotTok, t.LSquareTok])
            })

            it("will fail if we try to compute the next token starting from a rule that does not match the path", function () {
                var caPath:p.ITokenGrammarPath = {
                    ruleStack:         ["I_WILL_FAIL_THE_WALKER",
                        "qualifiedName"
                    ],
                    occurrenceStack:   [1, 1],
                    lastTok:           t.IdentTok,
                    lastTokOccurrence: 2
                }

                var walker = new NextAfterTokenWalker(samples.paramSpec, caPath)
                expect(() => walker.startWalking()).to.throw("The path does not start with the walker's top Rule!")
            })
        })


        describe("The NextInsideOptionWalker", function () {
            it("can compute the next possible token types inside the OPTION in paramSpec", function () {
                var path:p.IRuleGrammarPath = {
                    ruleStack:       ["paramSpec"],
                    occurrenceStack: [1],
                    occurrence:      1
                }

                var possibleNextTokTypes = new NextInsideOptionWalker(samples.paramSpec, path).startWalking()
                matchers.setEquality(possibleNextTokTypes, [t.LSquareTok])
            })

            it("can compute the next possible token types inside the OPTION in paramSpec inside ActionDec", function () {
                var path:p.IRuleGrammarPath = {
                    ruleStack:       ["actionDec", "paramSpec"],
                    occurrenceStack: [1, 1],
                    occurrence:      1
                }

                var possibleNextTokTypes = new NextInsideOptionWalker(samples.actionDec, path).startWalking()
                matchers.setEquality(possibleNextTokTypes, [t.LSquareTok])
            })

            it("can compute the next possible token types inside the OPTION in paramSpec inside ActionDec", function () {
                var path:p.IRuleGrammarPath = {
                    ruleStack:       ["actionDec"],
                    occurrenceStack: [1],
                    occurrence:      2
                }

                var possibleNextTokTypes = new NextInsideOptionWalker(samples.actionDec, path).startWalking()
                matchers.setEquality(possibleNextTokTypes, [t.ColonTok])
            })
        })

        describe("The NextInsideManyWalker", function () {
            it("can compute the next possible token types inside the MANY in QualifiedName", function () {
                var path:p.IRuleGrammarPath = {
                    ruleStack:       ["qualifiedName"],
                    occurrenceStack: [1],
                    occurrence:      1
                }

                var possibleNextTokTypes = new NextInsideManyWalker(samples.qualifiedName, path).startWalking()
                matchers.setEquality(possibleNextTokTypes, [t.DotTok])
            })

            it("can compute the next possible token types inside the MANY in paramSpec inside ActionDec", function () {
                var path:p.IRuleGrammarPath = {
                    ruleStack:       ["actionDec"],
                    occurrenceStack: [1],
                    occurrence:      1
                }

                var possibleNextTokTypes = new NextInsideManyWalker(samples.actionDec, path).startWalking()
                matchers.setEquality(possibleNextTokTypes, [t.CommaTok])
            })

            it("can compute the next possible token types inside the MANY in paramSpec inside ParamSpec --> QualifiedName", function () {
                var path:p.IRuleGrammarPath = {
                    ruleStack:       ["paramSpec", "qualifiedName"],
                    occurrenceStack: [1, 1],
                    occurrence:      1
                }

                var possibleNextTokTypes = new NextInsideManyWalker(samples.paramSpec, path).startWalking()
                matchers.setEquality(possibleNextTokTypes, [t.DotTok])
            })

            it("can compute the next possible token types inside the MANY inside: manyActions --> actionDec ", function () {
                var path:p.IRuleGrammarPath = {
                    ruleStack:       ["manyActions", "actionDec"],
                    occurrenceStack: [1, 1],
                    occurrence:      1
                }

                var possibleNextTokTypes = new NextInsideManyWalker(samples.manyActions, path).startWalking()
                matchers.setEquality(possibleNextTokTypes, [t.CommaTok])
            })
        })
    })

    describe("The NextTerminalAfterManyWalker", function () {
        it("can compute the next possible token types after the MANY in QualifiedName", function () {
            var result = new NextTerminalAfterManyWalker(samples.qualifiedName, 1).startWalking()
            //noinspection BadExpressionStatementJS
            expect(result.occurrence).to.be.undefined
            //noinspection BadExpressionStatementJS
            expect(result.token).to.be.undefined
        })

        it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", function () {
            var result = new NextTerminalAfterManyWalker(samples.actionDec, 1).startWalking()
            expect(result.occurrence).to.equal(1)
            expect(result.token).to.equal(t.RParenTok)
        })
    })

    describe("The NextTerminalAfterAtLeastOneWalker", function () {
        it("can compute the next possible token types after an AT_LEAST_ONE production", function () {
            var result = new NextTerminalAfterAtLeastOneWalker(samples.atLeastOneRule, 1).startWalking()
            expect(result.occurrence).to.equal(2)
            expect(result.token).to.equal(t.DotTok)

            var result2 = new NextTerminalAfterAtLeastOneWalker(samples.atLeastOneRule, 2).startWalking()
            expect(result2.occurrence).to.equal(1)
            expect(result2.token).to.equal(t.DotTok)

            var result3 = new NextTerminalAfterAtLeastOneWalker(samples.atLeastOneRule, 3).startWalking()
            expect(result3.occurrence).to.equal(1)
            expect(result3.token).to.equal(t.CommaTok)
        })
    })

    describe("The NextInsideOrWalker", function () {

        it("can compute the First Tokens for all alternatives of an OR", function () {
            var result = new NextInsideOrWalker(samples.cardinality, 1).startWalking()
            expect(result.length).to.equal(2)
            matchers.setEquality(<any>result[0], [t.UnsignedIntegerLiteralTok])
            matchers.setEquality(<any>result[1], [t.AsteriskTok])
        })

        it("can compute the First Tokens for all alternatives of an OR (complex)", function () {
            var result1 = new NextInsideOrWalker(samples.lotsOfOrs, 1).startWalking()
            expect(result1.length).to.equal(2)
            matchers.setEquality(<any>result1[0], [t.CommaTok, t.KeyTok])
            matchers.setEquality(<any>result1[1], [t.EntityTok])
        })
    })
}
