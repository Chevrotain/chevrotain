import { ITokenGrammarPath } from "../../../src/parse/grammar/path_public"
import {
    actionDec,
    actionDecSep,
    ActionTok,
    atLeastOneRule,
    atLeastOneSepRule,
    callArguments,
    ColonTok,
    CommaTok,
    DotTok,
    IdentTok,
    LParenTok,
    LSquareTok,
    paramSpec,
    qualifiedNameSep,
    RParenTok,
    RSquareTok,
    SemicolonTok
} from "./samples"
import {
    NextAfterTokenWalker,
    nextPossibleTokensAfter,
    NextTerminalAfterAtLeastOneSepWalker,
    NextTerminalAfterAtLeastOneWalker,
    NextTerminalAfterManySepWalker,
    NextTerminalAfterManyWalker,
    possiblePathsFrom
} from "../../../src/parse/grammar/interpreter"
import { createRegularToken, setEquality } from "../../utils/matchers"
import { createToken, IToken } from "../../../src/scan/tokens_public"
import { map } from "../../../src/utils/utils"
import { Lexer, TokenType } from "../../../src/scan/lexer_public"
import {
    augmentTokenTypes,
    tokenStructuredMatcher
} from "../../../src/scan/tokens"
import { Parser } from "../../../src/parse/parser_public"
import {
    Alternation,
    Flat,
    Repetition,
    RepetitionWithSeparator,
    Rule,
    Terminal,
    Option,
    RepetitionMandatory,
    NonTerminal,
    RepetitionMandatoryWithSeparator
} from "../../../src/parse/grammar/gast/gast_public"

describe("The Grammar Interpeter namespace", () => {
    describe("The NextAfterTokenWalker", () => {
        it("can compute the next possible token types From ActionDec in scope of ActionDec #1", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: ActionTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #2", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: IdentTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(LParenTok)
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #3", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: LParenTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [IdentTok, RParenTok])
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #4", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: CommaTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #5", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: RParenTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [SemicolonTok, ColonTok])
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #6", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: ColonTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From ActionDec in scope of ActionDec #7", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec"],
                occurrenceStack: [1],
                lastTok: SemicolonTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(0)
        })

        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #1", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                lastTok: IdentTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(ColonTok)
        })

        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #2", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                lastTok: ColonTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #3", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                lastTok: LSquareTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(RSquareTok)
        })

        it("can compute the next possible token types From the first paramSpec INSIDE ActionDec #4", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 1],
                lastTok: RSquareTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [CommaTok, RParenTok])
        })

        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #1", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 2],
                lastTok: IdentTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(ColonTok)
        })

        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #2", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 2],
                lastTok: ColonTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(IdentTok)
        })

        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #3", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 2],
                lastTok: LSquareTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(1)
            expect(possibleNextTokTypes[0]).to.equal(RSquareTok)
        })

        it("can compute the next possible token types From the second paramSpec INSIDE ActionDec #4", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["actionDec", "paramSpec"],
                occurrenceStack: [1, 2],
                lastTok: RSquareTok,
                lastTokOccurrence: 1
            }

            let possibleNextTokTypes = new NextAfterTokenWalker(
                actionDec,
                caPath
            ).startWalking()
            expect(possibleNextTokTypes.length).to.equal(2)
            setEquality(possibleNextTokTypes, [CommaTok, RParenTok])
        })

        it(
            "can compute the next possible token types From a fqn inside an actionParamSpec" +
                " inside an paramSpec INSIDE ActionDec #1",
            () => {
                let caPath: ITokenGrammarPath = {
                    ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
                    occurrenceStack: [1, 1, 1],
                    lastTok: IdentTok,
                    lastTokOccurrence: 1
                }

                let possibleNextTokTypes = new NextAfterTokenWalker(
                    actionDec,
                    caPath
                ).startWalking()
                expect(possibleNextTokTypes.length).to.equal(4)
                setEquality(possibleNextTokTypes, [
                    DotTok,
                    LSquareTok,
                    CommaTok,
                    RParenTok
                ])
            }
        )

        it(
            "can compute the next possible token types From a fqn inside an actionParamSpec" +
                " inside an paramSpec INSIDE ActionDec #2",
            () => {
                let caPath: ITokenGrammarPath = {
                    ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
                    occurrenceStack: [1, 1, 1],
                    lastTok: DotTok,
                    lastTokOccurrence: 1
                }

                let possibleNextTokTypes = new NextAfterTokenWalker(
                    actionDec,
                    caPath
                ).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(IdentTok)
            }
        )

        it(
            "can compute the next possible token types From a fqn inside an actionParamSpec" +
                " inside an paramSpec INSIDE ActionDec #3",
            () => {
                let caPath: ITokenGrammarPath = {
                    ruleStack: ["actionDec", "paramSpec", "qualifiedName"],
                    occurrenceStack: [1, 1, 1],
                    lastTok: IdentTok,
                    lastTokOccurrence: 2
                }

                let possibleNextTokTypes = new NextAfterTokenWalker(
                    actionDec,
                    caPath
                ).startWalking()
                expect(possibleNextTokTypes.length).to.equal(4)
                setEquality(possibleNextTokTypes, [
                    DotTok,
                    LSquareTok,
                    CommaTok,
                    RParenTok
                ])
            }
        )

        it(
            "can compute the next possible token types From a fqn inside an actionParamSpec" +
                " inside an paramSpec INSIDE ActionDec #3",
            () => {
                let caPath: ITokenGrammarPath = {
                    ruleStack: ["paramSpec", "qualifiedName"],
                    occurrenceStack: [1, 1],
                    lastTok: IdentTok,
                    lastTokOccurrence: 1
                }

                let possibleNextTokTypes = new NextAfterTokenWalker(
                    paramSpec,
                    caPath
                ).startWalking()
                expect(possibleNextTokTypes.length).to.equal(2)
                setEquality(possibleNextTokTypes, [DotTok, LSquareTok])
            }
        )

        it(
            "can compute the next possible token types From a fqn inside an actionParamSpec" +
                " inside an paramSpec INSIDE ActionDec #3",
            () => {
                let caPath: ITokenGrammarPath = {
                    ruleStack: ["paramSpec", "qualifiedName"],
                    occurrenceStack: [1, 1],
                    lastTok: DotTok,
                    lastTokOccurrence: 1
                }

                let possibleNextTokTypes = new NextAfterTokenWalker(
                    paramSpec,
                    caPath
                ).startWalking()
                expect(possibleNextTokTypes.length).to.equal(1)
                expect(possibleNextTokTypes[0]).to.equal(IdentTok)
            }
        )

        it(
            "can compute the next possible token types From a fqn inside an actionParamSpec" +
                " inside an paramSpec INSIDE ActionDec #3",
            () => {
                let caPath: ITokenGrammarPath = {
                    ruleStack: ["paramSpec", "qualifiedName"],
                    occurrenceStack: [1, 1],
                    lastTok: IdentTok,
                    lastTokOccurrence: 2
                }

                let possibleNextTokTypes = new NextAfterTokenWalker(
                    paramSpec,
                    caPath
                ).startWalking()
                expect(possibleNextTokTypes.length).to.equal(2)
                setEquality(possibleNextTokTypes, [DotTok, LSquareTok])
            }
        )

        it("will fail if we try to compute the next token starting from a rule that does not match the path", () => {
            let caPath: ITokenGrammarPath = {
                ruleStack: ["I_WILL_FAIL_THE_WALKER", "qualifiedName"],
                occurrenceStack: [1, 1],
                lastTok: IdentTok,
                lastTokOccurrence: 2
            }

            let walker = new NextAfterTokenWalker(paramSpec, caPath)
            expect(() => walker.startWalking()).to.throw(
                "The path does not start with the walker's top Rule!"
            )
        })
    })
})

describe("The NextTerminalAfterManyWalker", () => {
    it("can compute the next possible token types after the MANY in QualifiedName", () => {
        let rule = new Rule({
            name: "TwoRepetitionRule",
            definition: [
                new Repetition({
                    definition: [
                        new Terminal({
                            terminalType: IdentTok,
                            idx: 1
                        })
                    ],
                    idx: 2
                }),
                new Terminal({
                    terminalType: IdentTok,
                    idx: 2
                }),
                new Repetition({
                    definition: [
                        new Terminal({ terminalType: DotTok }),
                        new Terminal({
                            terminalType: IdentTok,
                            idx: 3
                        })
                    ]
                })
            ]
        })

        let result = new NextTerminalAfterManyWalker(rule, 1).startWalking()
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined
    })

    it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", () => {
        let result = new NextTerminalAfterManyWalker(
            actionDec,
            1
        ).startWalking()
        expect(result.occurrence).to.equal(1)
        expect(result.token).to.equal(RParenTok)
    })
})

describe("The NextTerminalAfterManySepWalker", () => {
    it("can compute the next possible token types after the MANY_SEP in QualifiedName", () => {
        let result = new NextTerminalAfterManySepWalker(
            callArguments,
            1
        ).startWalking()
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined
    })

    it("can compute the next possible token types after the MANY in paramSpec inside ActionDec", () => {
        let result = new NextTerminalAfterManySepWalker(
            actionDecSep,
            1
        ).startWalking()
        expect(result.occurrence).to.equal(1)
        expect(result.token).to.equal(RParenTok)
    })
})

describe("The NextTerminalAfterAtLeastOneWalker", () => {
    it("can compute the next possible token types after an AT_LEAST_ONE production", () => {
        let result = new NextTerminalAfterAtLeastOneWalker(
            atLeastOneRule,
            1
        ).startWalking()
        expect(result.occurrence).to.equal(2)
        expect(result.token).to.equal(DotTok)

        let result2 = new NextTerminalAfterAtLeastOneWalker(
            atLeastOneRule,
            2
        ).startWalking()
        expect(result2.occurrence).to.equal(1)
        expect(result2.token).to.equal(DotTok)

        let result3 = new NextTerminalAfterAtLeastOneWalker(
            atLeastOneRule,
            3
        ).startWalking()
        expect(result3.occurrence).to.equal(1)
        expect(result3.token).to.equal(CommaTok)
    })

    it("can compute the next possible token types after an AT_LEAST_ONE production - EMPTY", () => {
        let atLeastOneRule = new Rule({
            name: "atLeastOneRule",
            definition: [
                new RepetitionMandatory({
                    definition: [
                        new Terminal({
                            terminalType: DotTok,
                            idx: 1
                        })
                    ]
                })
            ]
        })

        let result = new NextTerminalAfterAtLeastOneWalker(
            atLeastOneRule,
            1
        ).startWalking()
        expect(result.occurrence).to.be.undefined
        expect(result.token).to.be.undefined
    })
})

describe("The NextTerminalAfterAtLeastOneSepWalker", () => {
    it("can compute the next possible token types after an AT_LEAST_ONE_SEP production", () => {
        let result = new NextTerminalAfterAtLeastOneSepWalker(
            atLeastOneSepRule,
            1
        ).startWalking()
        expect(result.occurrence).to.equal(2)
        expect(result.token).to.equal(DotTok)

        let result2 = new NextTerminalAfterAtLeastOneSepWalker(
            atLeastOneSepRule,
            2
        ).startWalking()
        expect(result2.occurrence).to.equal(1)
        expect(result2.token).to.equal(DotTok)

        let result3 = new NextTerminalAfterAtLeastOneSepWalker(
            atLeastOneSepRule,
            3
        ).startWalking()
        expect(result3.occurrence).to.equal(1)
        expect(result3.token).to.equal(CommaTok)
    })

    it("can compute the next possible token types after an AT_LEAST_ONE_SEP production EMPTY", () => {
        let result = new NextTerminalAfterAtLeastOneSepWalker(
            qualifiedNameSep,
            1
        ).startWalking()
        //noinspection BadExpressionStatementJS
        expect(result.occurrence).to.be.undefined
        //noinspection BadExpressionStatementJS
        expect(result.token).to.be.undefined
    })
})

describe("The chevrotain grammar interpreter capabilities", () => {
    function extractPartialPaths(newResultFormat) {
        return map(newResultFormat, currItem => currItem.partialPath)
    }

    class Alpha {
        static PATTERN = /NA/
    }

    class Beta {
        static PATTERN = /NA/
    }

    class Gamma {
        static PATTERN = /NA/
    }

    class Comma {
        static PATTERN = /NA/
    }

    augmentTokenTypes([Alpha, Beta, Gamma, Comma])

    context("can calculate the next possible paths in a", () => {
        it("Sequence", () => {
            let seq = [
                new Terminal({ terminalType: Alpha }),
                new Terminal({ terminalType: Beta }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                extractPartialPaths(possiblePathsFrom(seq, 1))
            ).to.deep.equal([[Alpha]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 2))
            ).to.deep.equal([[Alpha, Beta]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 3))
            ).to.deep.equal([[Alpha, Beta, Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 4))
            ).to.deep.equal([[Alpha, Beta, Gamma]])
        })

        it("Optional", () => {
            let seq = [
                new Terminal({ terminalType: Alpha }),
                new Option({
                    definition: [new Terminal({ terminalType: Beta })]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                extractPartialPaths(possiblePathsFrom(seq, 1))
            ).to.deep.equal([[Alpha]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 2))
            ).to.deep.equal([[Alpha, Beta], [Alpha, Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 3))
            ).to.deep.equal([[Alpha, Beta, Gamma], [Alpha, Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 4))
            ).to.deep.equal([[Alpha, Beta, Gamma], [Alpha, Gamma]])
        })

        it("Alternation", () => {
            let alts = [
                new Alternation({
                    definition: [
                        new Flat({
                            definition: [new Terminal({ terminalType: Alpha })]
                        }),
                        new Flat({
                            definition: [
                                new Terminal({ terminalType: Beta }),
                                new Terminal({ terminalType: Beta })
                            ]
                        }),
                        new Flat({
                            definition: [
                                new Terminal({ terminalType: Beta }),
                                new Terminal({ terminalType: Alpha }),
                                new Terminal({ terminalType: Gamma })
                            ]
                        })
                    ]
                })
            ]

            expect(
                extractPartialPaths(possiblePathsFrom(alts, 1))
            ).to.deep.equal([[Alpha], [Beta], [Beta]])
            expect(
                extractPartialPaths(possiblePathsFrom(alts, 2))
            ).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha]])
            expect(
                extractPartialPaths(possiblePathsFrom(alts, 3))
            ).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha, Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(alts, 4))
            ).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha, Gamma]])
        })

        it("Repetition", () => {
            let rep = [
                new Repetition({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Alpha })
                    ]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                extractPartialPaths(possiblePathsFrom(rep, 1))
            ).to.deep.equal([[Alpha], [Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(rep, 2))
            ).to.deep.equal([[Alpha, Alpha], [Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(rep, 3))
            ).to.deep.equal([[Alpha, Alpha, Gamma], [Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(rep, 4))
            ).to.deep.equal([[Alpha, Alpha, Gamma], [Gamma]])
        })

        it("Mandatory Repetition", () => {
            let repMand = [
                new RepetitionMandatory({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Alpha })
                    ]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                extractPartialPaths(possiblePathsFrom(repMand, 1))
            ).to.deep.equal([[Alpha]])
            expect(
                extractPartialPaths(possiblePathsFrom(repMand, 2))
            ).to.deep.equal([[Alpha, Alpha]])
            expect(
                extractPartialPaths(possiblePathsFrom(repMand, 3))
            ).to.deep.equal([[Alpha, Alpha, Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(repMand, 4))
            ).to.deep.equal([[Alpha, Alpha, Gamma]])
        })

        it("Repetition with Separator", () => {
            // same as Mandatory Repetition because currently possiblePaths only cares about
            // the first repetition.
            let rep = [
                new RepetitionWithSeparator({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Alpha })
                    ],
                    separator: Comma
                }),
                new Terminal({ terminalType: Gamma })
            ]
            expect(
                extractPartialPaths(possiblePathsFrom(rep, 1))
            ).to.deep.equal([[Alpha], [Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(rep, 2))
            ).to.deep.equal([[Alpha, Alpha], [Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(rep, 3))
            ).to.deep.equal([
                [Alpha, Alpha, Comma],
                [Alpha, Alpha, Gamma],
                [Gamma]
            ])
            expect(
                extractPartialPaths(possiblePathsFrom(rep, 4))
            ).to.deep.equal([
                [Alpha, Alpha, Comma, Alpha],
                [Alpha, Alpha, Gamma],
                [Gamma]
            ])
        })

        it("Mandatory Repetition with Separator", () => {
            // same as Mandatory Repetition because currently possiblePaths only cares about
            // the first repetition.
            let repMandSep = [
                new RepetitionMandatoryWithSeparator({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Alpha })
                    ],
                    separator: Comma
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                extractPartialPaths(possiblePathsFrom(repMandSep, 1))
            ).to.deep.equal([[Alpha]])
            expect(
                extractPartialPaths(possiblePathsFrom(repMandSep, 2))
            ).to.deep.equal([[Alpha, Alpha]])
            expect(
                extractPartialPaths(possiblePathsFrom(repMandSep, 3))
            ).to.deep.equal([[Alpha, Alpha, Comma], [Alpha, Alpha, Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(repMandSep, 4))
            ).to.deep.equal([
                [Alpha, Alpha, Comma, Alpha],
                [Alpha, Alpha, Gamma]
            ])
        })

        it("NonTerminal", () => {
            let someSubRule = new Rule({
                name: "blah",
                definition: [new Terminal({ terminalType: Beta })]
            })

            let seq = [
                new Terminal({ terminalType: Alpha }),
                new NonTerminal({
                    nonTerminalName: "blah",
                    referencedRule: someSubRule
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                extractPartialPaths(possiblePathsFrom(seq, 1))
            ).to.deep.equal([[Alpha]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 2))
            ).to.deep.equal([[Alpha, Beta]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 3))
            ).to.deep.equal([[Alpha, Beta, Gamma]])
            expect(
                extractPartialPaths(possiblePathsFrom(seq, 4))
            ).to.deep.equal([[Alpha, Beta, Gamma]])
        })
    })

    context("can calculate the next possible single tokens for: ", () => {
        function INPUT(tokTypes: TokenType[]): IToken[] {
            return map(tokTypes, currTokType => createRegularToken(currTokType))
        }

        function pluckTokenTypes(arr: any[]): TokenType[] {
            return map(arr, currItem => currItem.nextTokenType)
        }

        it("Sequence positive", () => {
            let seq = [
                new Flat({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta }),
                        new Terminal({ terminalType: Gamma })
                    ]
                })
            ]

            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        seq,
                        INPUT([]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        seq,
                        INPUT([Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        seq,
                        INPUT([Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Gamma]
            )
        })

        it("Sequence negative", () => {
            let seq = [
                new Flat({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta }),
                        new Terminal({ terminalType: Gamma })
                    ]
                })
            ]

            // negative
            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Alpha, Beta, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Beta]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
        })

        it("Optional positive", () => {
            let seq = [
                new Terminal({ terminalType: Alpha }),
                new Option({
                    definition: [new Terminal({ terminalType: Beta })]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            // setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([]), tokenStructuredMatcher, 5)), [Alpha])
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        seq,
                        INPUT([Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta, Gamma]
            )
            // setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Gamma])
        })

        it("Optional Negative", () => {
            let seq = [
                new Terminal({ terminalType: Alpha }),
                new Option({
                    definition: [new Terminal({ terminalType: Beta })]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Beta]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Alpha, Alpha]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Alpha, Beta, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
        })

        it("Alternation positive", () => {
            let alts = [
                new Alternation({
                    definition: [
                        new Flat({
                            definition: [new Terminal({ terminalType: Alpha })]
                        }),
                        new Flat({
                            definition: [
                                new Terminal({ terminalType: Beta }),
                                new Terminal({ terminalType: Beta })
                            ]
                        }),
                        new Flat({
                            definition: [
                                new Terminal({ terminalType: Beta }),
                                new Terminal({ terminalType: Alpha }),
                                new Terminal({ terminalType: Gamma })
                            ]
                        }),
                        new Flat({
                            definition: [new Terminal({ terminalType: Gamma })]
                        })
                    ]
                })
            ]

            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        alts,
                        INPUT([]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha, Beta, Beta, Gamma]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        alts,
                        INPUT([Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta, Alpha]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        alts,
                        INPUT([Beta, Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Gamma]
            )
        })

        it("Alternation Negative", () => {
            let alts = [
                new Alternation({
                    definition: [
                        new Flat({
                            definition: [new Terminal({ terminalType: Alpha })]
                        }),
                        new Flat({
                            definition: [
                                new Terminal({ terminalType: Beta }),
                                new Terminal({ terminalType: Beta })
                            ]
                        }),
                        new Flat({
                            definition: [
                                new Terminal({ terminalType: Beta }),
                                new Terminal({ terminalType: Alpha }),
                                new Terminal({ terminalType: Gamma })
                            ]
                        })
                    ]
                })
            ]

            expect(
                nextPossibleTokensAfter(
                    alts,
                    INPUT([Alpha]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    alts,
                    INPUT([Gamma, Alpha]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    alts,
                    INPUT([Beta, Beta]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    alts,
                    INPUT([Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
        })

        it("Repetition - positive", () => {
            let rep = [
                new Repetition({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta })
                    ]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        rep,
                        INPUT([]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha, Gamma]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        rep,
                        INPUT([Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        rep,
                        INPUT([Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha, Gamma]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        rep,
                        INPUT([Alpha, Beta, Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        rep,
                        INPUT([Alpha, Beta, Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha, Gamma]
            )
        })

        it("Repetition - negative", () => {
            let rep = [
                new Repetition({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta })
                    ]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                nextPossibleTokensAfter(
                    rep,
                    INPUT([Beta]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    rep,
                    INPUT([Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    rep,
                    INPUT([Alpha, Beta, Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    rep,
                    INPUT([Alpha, Beta, Alpha, Beta, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
        })

        it("Mandatory Repetition - positive", () => {
            let repMand = [
                new RepetitionMandatory({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta })
                    ]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repMand,
                        INPUT([]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repMand,
                        INPUT([Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repMand,
                        INPUT([Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha, Gamma]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repMand,
                        INPUT([Alpha, Beta, Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repMand,
                        INPUT([Alpha, Beta, Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha, Gamma]
            )
        })

        it("Mandatory Repetition - negative", () => {
            let repMand = [
                new RepetitionMandatory({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta })
                    ]
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Beta]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Beta, Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Beta, Alpha, Beta, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
        })

        it("Repetition with Separator - positive", () => {
            let repSep = [
                new RepetitionWithSeparator({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta })
                    ],
                    separator: Comma
                }),
                new Terminal({ terminalType: Gamma })
            ]

            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha, Gamma]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Comma, Gamma]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([Alpha, Beta, Comma]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([Alpha, Beta, Comma, Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Comma, Gamma]
            )
        })

        it("Repetition with Separator - negative", () => {
            let repMand = [
                new RepetitionWithSeparator({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta })
                    ],
                    separator: Comma
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Comma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Beta, Comma, Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Beta, Comma, Alpha, Beta, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
        })

        it("Repetition with Separator Mandatory - positive", () => {
            let repSep = [
                new RepetitionMandatoryWithSeparator({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta })
                    ],
                    separator: Comma
                }),
                new Terminal({ terminalType: Gamma })
            ]

            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Comma, Gamma]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([Alpha, Beta, Comma]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        repSep,
                        INPUT([Alpha, Beta, Comma, Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Comma, Gamma]
            )
        })

        it("Repetition with Separator Mandatory - negative", () => {
            let repMand = [
                new RepetitionMandatoryWithSeparator({
                    definition: [
                        new Terminal({ terminalType: Alpha }),
                        new Terminal({ terminalType: Beta })
                    ],
                    separator: Comma
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Comma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Beta, Comma, Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    repMand,
                    INPUT([Alpha, Beta, Comma, Alpha, Beta, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
        })

        it("NonTerminal - positive", () => {
            let someSubRule = new Rule({
                name: "blah",
                definition: [new Terminal({ terminalType: Beta })]
            })

            let seq = [
                new Terminal({ terminalType: Alpha }),
                new NonTerminal({
                    nonTerminalName: "blah",
                    referencedRule: someSubRule
                }),
                new Terminal({ terminalType: Gamma })
            ]

            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        seq,
                        INPUT([]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Alpha]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        seq,
                        INPUT([Alpha]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Beta]
            )
            setEquality(
                pluckTokenTypes(
                    nextPossibleTokensAfter(
                        seq,
                        INPUT([Alpha, Beta]),
                        tokenStructuredMatcher,
                        5
                    )
                ),
                [Gamma]
            )
        })

        it("NonTerminal - negative", () => {
            let someSubRule = new Rule({
                name: "blah",
                definition: [new Terminal({ terminalType: Beta })]
            })

            let seq = [
                new Terminal({ terminalType: Alpha }),
                new NonTerminal({
                    nonTerminalName: "blah",
                    referencedRule: someSubRule
                }),
                new Terminal({ terminalType: Gamma })
            ]

            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Beta]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Alpha, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
            expect(
                nextPossibleTokensAfter(
                    seq,
                    INPUT([Alpha, Beta, Gamma]),
                    tokenStructuredMatcher,
                    5
                )
            ).to.be.empty
        })
    })
})

describe("issue 391 - WITH_SEP variants do not take SEP into account in lookahead", () => {
    it("Reproduce issue", () => {
        const LParen = createToken({
            name: "LParen",
            pattern: /\(/
        })
        const RParen = createToken({
            name: "RParen",
            pattern: /\)/
        })
        const Comma = createToken({ name: "Comma", pattern: /,/ })
        const FatArrow = createToken({
            name: "FatArrow",
            pattern: /=>/
        })
        const Identifier = createToken({
            name: "Identifier",
            pattern: /[a-zA-Z]+/
        })
        const WhiteSpace = createToken({
            name: "WhiteSpace",
            pattern: /\s+/,
            group: Lexer.SKIPPED,
            line_breaks: true
        })

        const allTokens = [
            WhiteSpace,
            LParen,
            RParen,
            Comma,
            FatArrow,
            Identifier
        ]
        const issue391Lexer = new Lexer(allTokens)

        class Issue391Parser extends Parser {
            constructor(input: IToken[] = []) {
                super(input, allTokens, {
                    maxLookahead: 4
                })
                ;(Parser as any).performSelfAnalysis(this)
            }

            topRule = this.RULE("topRule", () => {
                return this.OR9([
                    {
                        // Lambda Function
                        ALT: () => {
                            this.CONSUME1(LParen)
                            this.MANY_SEP({
                                SEP: Comma,
                                DEF: () => {
                                    this.CONSUME1(Identifier)
                                }
                            })
                            this.CONSUME1(RParen)
                            this.CONSUME1(FatArrow)
                        }
                    },
                    {
                        // Parenthesis Expression
                        ALT: () => {
                            this.CONSUME2(LParen)
                            this.CONSUME2(Identifier)
                            this.CONSUME2(RParen)
                        }
                    }
                ])
            })
        }

        expect(() => new Issue391Parser([])).to.not.throw(
            "Ambiguous alternatives: <1 ,2>"
        )
        const myParser = new Issue391Parser([])

        function testInput(input) {
            const tokens = issue391Lexer.tokenize(input).tokens
            myParser.input = tokens
            myParser.topRule()
            expect(myParser.errors).to.be.empty
        }

        testInput("(x, y) => ")
        testInput("() =>")
        testInput("(x) =>")
        testInput("(x)")
    })
})
