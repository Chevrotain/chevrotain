import {ITokenGrammarPath, IRuleGrammarPath} from "../../../src/parse/grammar/path"
import {
    ActionTok,
    actionDec,
    IdentTok,
    LParenTok,
    RParenTok,
    ColonTok,
    SemicolonTok,
    LSquareTok,
    RSquareTok,
    DotTok,
    CommaTok,
    paramSpec,
    qualifiedName,
    callArguments,
    actionDecSep,
    atLeastOneRule,
    EntityTok,
    UnsignedIntegerLiteralTok,
    AsteriskTok,
    cardinality,
    lotsOfOrs,
    KeyTok,
    qualifiedNameSep,
    atLeastOneSepRule,
    manyActions
} from "./samples"
import {
    NextAfterTokenWalker,
    NextInsideOptionWalker,
    NextInsideManyWalker,
    NextInsideManySepWalker,
    NextInsideOrWalker,
    NextTerminalAfterAtLeastOneWalker,
    NextTerminalAfterManyWalker,
    NextTerminalAfterManySepWalker,
    NextInsideAtLeastOneWalker,
    NextInsideAtLeastOneSepWalker,
    NextTerminalAfterAtLeastOneSepWalker
} from "../../../src/parse/grammar/interpreter"
import {setEquality} from "../../utils/matchers"

describe("The Grammar Interpeter namespace", () => {
    "use strict"

    describe("The NextAfterTokenWalker", () => {

        it("can compute the next possible token types From ActionDec in scope of ActionDec #1", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec"],
                occurrenceStack:   [1],
                lastTok:           ActionTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #2", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec"],
                occurrenceStack:   [1],
                lastTok:           IdentTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(LParenTok)
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #3", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec"],
                occurrenceStack:   [1],
                lastTok:           LParenTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [IdentTok, RParenTok])
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #4", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec"],
                occurrenceStack:   [1],
                lastTok:           CommaTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #5", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec"],
                occurrenceStack:   [1],
                lastTok:           RParenTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [SemicolonTok, ColonTok])
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #6", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec"],
                occurrenceStack:   [1],
                lastTok:           ColonTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #7", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec"],
                occurrenceStack:   [1],
                lastTok:           SemicolonTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(0)
        })

        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #1", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec"
                ],
                occurrenceStack:   [1, 1],
                lastTok:           IdentTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(ColonTok)
        })

        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #2", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec"
                ],
                occurrenceStack:   [1, 1],
                lastTok:           ColonTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #3", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec"
                ],
                occurrenceStack:   [1, 1],
                lastTok:           LSquareTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(RSquareTok)
        })

        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #4", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec"
                ],
                occurrenceStack:   [1, 1],
                lastTok:           RSquareTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [CommaTok, RParenTok])
        })

        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #1", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec"
                ],
                occurrenceStack:   [1, 2],
                lastTok:           IdentTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(ColonTok)
        })

        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #2", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec"
                ],
                occurrenceStack:   [1, 2],
                lastTok:           ColonTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #3", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec"
                ],
                occurrenceStack:   [1, 2],
                lastTok:           LSquareTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(RSquareTok)
        })

        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #4", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec"
                ],
                occurrenceStack:   [1, 2],
                lastTok:           RSquareTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [CommaTok, RParenTok])
        })

        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #1", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec",
                    "qualifiedName"
                ],
                occurrenceStack:   [1, 1, 1],
                lastTok:           IdentTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(4)
            setEquality(possibleNextTokTypes, [DotTok, LSquareTok, CommaTok, RParenTok])
        })

        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #2", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec",
                    "qualifiedName"
                ],
                occurrenceStack:   [1, 1, 1],
                lastTok:           DotTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["actionDec",
                    "paramSpec",
                    "qualifiedName"
                ],
                occurrenceStack:   [1, 1, 1],
                lastTok:           IdentTok,
                lastTokOccurrence: 2
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(actionDec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(4)
            setEquality(possibleNextTokTypes, [DotTok, LSquareTok, CommaTok, RParenTok])
        })

        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["paramSpec",
                    "qualifiedName"
                ],
                occurrenceStack:   [1, 1],
                lastTok:           IdentTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(paramSpec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [DotTok, LSquareTok])
        })

        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["paramSpec",
                    "qualifiedName"
                ],
                occurrenceStack:   [1, 1],
                lastTok:           DotTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(paramSpec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From a fqn inside an actionParamSpec" +
            " inside an paramSpec INSIDE ActionDec #3", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["paramSpec",
                    "qualifiedName"
                ],
                occurrenceStack:   [1, 1],
                lastTok:           IdentTok,
                lastTokOccurrence: 2
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(paramSpec, caPath).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [DotTok, LSquareTok])
        })

        it("will fail if we try to compute the next token starting from a rule that does not match the path", () => {
            let caPath:ITokenGrammarPath = {
                ruleStack:         ["I_WILL_FAIL_THE_WALKER",
                    "qualifiedName"
                ],
                occurrenceStack:   [1, 1],
                lastTok:           IdentTok,
                lastTokOccurrence: 2
            }

            let walker = new NextAfterTokenWalker(paramSpec, caPath)
            expect(() => walker.startWalking()).to.throw("The path does not start with the walker's top Rule!")
        })
    })


    describe("The NextInsideOptionWalker", () => {
        it("can compute the next possible token types inside the OPTION in paramSpec", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["paramSpec"],
                occurrenceStack: [1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideOptionWalker(paramSpec, path).startWalking()
            setEquality(possibleNextTokTypes, [LSquareTok])
        })

        it("can compute the next possible token types inside the OPTION in paramSpec inside ActionDec", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideOptionWalker(actionDec, path).startWalking()
            setEquality(possibleNextTokTypes, [LSquareTok])
        })

        it("can compute the next possible token types inside the OPTION in paramSpec inside ActionDec", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["actionDec"],
                occurrenceStack: [1],
                occurrence:      2
            }

            let possibleNextTokTypes = new NextInsideOptionWalker(actionDec, path).startWalking()
            setEquality(possibleNextTokTypes, [ColonTok])
        })
    })

    describe("The NextInsideManyWalker", () => {
        it("can compute the next possible token types inside the MANY in QualifiedName", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["qualifiedName"],
                occurrenceStack: [1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideManyWalker(qualifiedName, path).startWalking()
            setEquality(possibleNextTokTypes, [DotTok])
        })

        it("can compute the next possible token types inside the MANY in paramSpec inside ActionDec", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["actionDec"],
                occurrenceStack: [1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideManyWalker(actionDec, path).startWalking()
            setEquality(possibleNextTokTypes, [CommaTok])
        })

        it("can compute the next possible token types inside the MANY in paramSpec inside ParamSpec --> QualifiedName", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["paramSpec", "qualifiedName"],
                occurrenceStack: [1, 1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideManyWalker(paramSpec, path).startWalking()
            setEquality(possibleNextTokTypes, [DotTok])
        })

        it("can compute the next possible token types inside the MANY inside: manyActions --> actionDec ", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["manyActions", "actionDec"],
                occurrenceStack: [1, 1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideManyWalker(manyActions, path).startWalking()
            setEquality(possibleNextTokTypes, [CommaTok])
        })
    })

    describe("The NextInsideManySepWalker", () => {
        it("can compute the next possible token types inside the MANY_SEP in callArguments", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["callArguments"],
                occurrenceStack: [1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideManySepWalker(callArguments, path).startWalking()
            setEquality(possibleNextTokTypes, [IdentTok])
        })

        it("can compute the next possible token types inside the MANY_SEP in actionDecSep", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["actionDecSep"],
                occurrenceStack: [1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideManySepWalker(actionDecSep, path).startWalking()
            setEquality(possibleNextTokTypes, [IdentTok])
        })
    })

    describe("The NextInsideAtLeastOneWalker", () => {
        it("can compute the next possible token types inside the AT_LEAST_ONE in callArguments", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["atLeastOneRule"],
                occurrenceStack: [1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideAtLeastOneWalker(atLeastOneRule, path).startWalking()
            setEquality(possibleNextTokTypes, [EntityTok])
        })

        it("can compute the next possible token types inside the AT_LEAST_ONE in actionDecSep", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["atLeastOneRule"],
                occurrenceStack: [1],
                occurrence:      2
            }

            let possibleNextTokTypes = new NextInsideAtLeastOneWalker(atLeastOneRule, path).startWalking()
            setEquality(possibleNextTokTypes, [EntityTok])
        })

        it("can compute the next possible token types inside the AT_LEAST_ONE in actionDecSep", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["atLeastOneRule"],
                occurrenceStack: [1],
                occurrence:      3
            }

            let possibleNextTokTypes = new NextInsideAtLeastOneWalker(atLeastOneRule, path).startWalking()
            setEquality(possibleNextTokTypes, [EntityTok])
        })
    })

    describe("The NextInsideAtLeastOneSepWalker", () => {
        it("can compute the next possible token types inside the AT_LEAST_ONE_SEP in atLeastOneSepRule", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["atLeastOneSepRule"],
                occurrenceStack: [1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideAtLeastOneSepWalker(atLeastOneSepRule, path).startWalking()
            setEquality(possibleNextTokTypes, [EntityTok])
        })

        it("can compute the next possible token types inside the AT_LEAST_ONE_SEP in atLeastOneSepRule 2", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["atLeastOneSepRule"],
                occurrenceStack: [1],
                occurrence:      2
            }

            let possibleNextTokTypes = new NextInsideAtLeastOneSepWalker(atLeastOneSepRule, path).startWalking()
            setEquality(possibleNextTokTypes, [EntityTok])
        })

        it("can compute the next possible token types inside the AT_LEAST_ONE_SEP in atLeastOneSepRule 3", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["atLeastOneSepRule"],
                occurrenceStack: [1],
                occurrence:      3
            }

            let possibleNextTokTypes = new NextInsideAtLeastOneSepWalker(atLeastOneSepRule, path).startWalking()
            setEquality(possibleNextTokTypes, [EntityTok])
        })

        it("can compute the next possible token types inside the AT_LEAST_ONE_SEP in qualifiedNameSep", () => {
            let path:IRuleGrammarPath = {
                ruleStack:       ["qualifiedNameSep"],
                occurrenceStack: [1],
                occurrence:      1
            }

            let possibleNextTokTypes = new NextInsideAtLeastOneSepWalker(qualifiedNameSep, path).startWalking()
            setEquality(possibleNextTokTypes, [IdentTok])
        })
    })
})

describe("The NextTerminalAfterManyWalker", () => {
    it("can compute the next possible token types after the MANY in QualifiedName", () => {
        let result = new NextTerminalAfterManyWalker(qualifiedName, 1).startWalking()
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined
    })

    it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", () => {
        let result = new NextTerminalAfterManyWalker(actionDec, 1).startWalking()
        expect(result.occurrence).to.equal(1)
        expect(result.token).to.equal(RParenTok)
    })
})

describe("The NextTerminalAfterManySepWalker", () => {
    it("can compute the next possible token types after the MANY_SEP in QualifiedName", () => {
        let result = new NextTerminalAfterManySepWalker(callArguments, 1).startWalking()
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined
    })

    it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", () => {
        let result = new NextTerminalAfterManySepWalker(actionDecSep, 1).startWalking()
        expect(result.occurrence).to.equal(1)
        expect(result.token).to.equal(RParenTok)
    })
})

describe("The NextTerminalAfterAtLeastOneWalker", () => {
    it("can compute the next possible token types after an AT_LEAST_ONE production", () => {
        let result = new NextTerminalAfterAtLeastOneWalker(atLeastOneRule, 1).startWalking()
        expect(result.occurrence).to.equal(2)
        expect(result.token).to.equal(DotTok)

        let result2 = new NextTerminalAfterAtLeastOneWalker(atLeastOneRule, 2).startWalking()
        expect(result2.occurrence).to.equal(1)
        expect(result2.token).to.equal(DotTok)

        let result3 = new NextTerminalAfterAtLeastOneWalker(atLeastOneRule, 3).startWalking()
        expect(result3.occurrence).to.equal(1)
        expect(result3.token).to.equal(CommaTok)
    })
})

describe("The NextTerminalAfterAtLeastOneSepWalker", () => {
    it("can compute the next possible token types after an AT_LEAST_ONE_SEP production", () => {
        let result = new NextTerminalAfterAtLeastOneSepWalker(atLeastOneSepRule, 1).startWalking()
        expect(result.occurrence).to.equal(2)
        expect(result.token).to.equal(DotTok)

        let result2 = new NextTerminalAfterAtLeastOneSepWalker(atLeastOneSepRule, 2).startWalking()
        expect(result2.occurrence).to.equal(1)
        expect(result2.token).to.equal(DotTok)

        let result3 = new NextTerminalAfterAtLeastOneSepWalker(atLeastOneSepRule, 3).startWalking()
        expect(result3.occurrence).to.equal(1)
        expect(result3.token).to.equal(CommaTok)
    })

    it("can compute the next possible token types after an AT_LEAST_ONE_SEP production EMPTY", () => {
        let result = new NextTerminalAfterAtLeastOneSepWalker(qualifiedNameSep, 1).startWalking()
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined
    })
})

describe("The NextInsideOrWalker", () => {

    it("can compute the First Tokens for all alternatives of an OR", () => {
        let result = new NextInsideOrWalker(cardinality, 1).startWalking()
        expect(result.length).to.equal(2)
        setEquality(<any>result[0], [UnsignedIntegerLiteralTok])
        setEquality(<any>result[1], [AsteriskTok])
    })

    it("can compute the First Tokens for all alternatives of an OR (complex)", () => {
        let result1 = new NextInsideOrWalker(lotsOfOrs, 1).startWalking()
        expect(result1.length).to.equal(2)
        setEquality(<any>result1[0], [CommaTok, KeyTok])
        setEquality(<any>result1[1], [EntityTok])
    })
})
