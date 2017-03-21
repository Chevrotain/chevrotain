import {ITokenGrammarPath} from "../../../src/parse/grammar/path_public"
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
    callArguments,
    actionDecSep,
    atLeastOneRule,
    qualifiedNameSep,
    atLeastOneSepRule
} from "./samples"
import {
    NextAfterTokenWalker,
    NextTerminalAfterAtLeastOneWalker,
    NextTerminalAfterManyWalker,
    NextTerminalAfterManySepWalker,
    NextTerminalAfterAtLeastOneSepWalker,
    possiblePathsFrom,
    nextPossibleTokensAfter
} from "../../../src/parse/grammar/interpreter"
import {setEquality, createRegularToken} from "../../utils/matchers"
import {gast} from "../../../src/parse/grammar/gast_public"
import {Token, IToken} from "../../../src/scan/tokens_public"
import {map} from "../../../src/utils/utils"
import {TokenConstructor} from "../../../src/scan/lexer_public"
import {augmentTokenClasses, tokenStructuredMatcher} from "../../../src/scan/tokens"

let RepetitionMandatory = gast.RepetitionMandatory
let Terminal = gast.Terminal
let Repetition = gast.Repetition
let Rule = gast.Rule

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
})

describe("The NextTerminalAfterManyWalker", () => {
    it("can compute the next possible token types after the MANY in QualifiedName", () => {

        let rule = new Rule("TwoRepetitionRule", [
            new Repetition([
                new Terminal(IdentTok, 1)
            ], 2),
            new Terminal(IdentTok, 2),
            new Repetition([
                new Terminal(DotTok),
                new Terminal(IdentTok, 3)
            ])
        ])

        let result = new NextTerminalAfterManyWalker(rule, 1).startWalking()
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

    it("can compute the next possible token types after an AT_LEAST_ONE production - EMPTY", () => {

        let atLeastOneRule = new Rule("atLeastOneRule", [
            new RepetitionMandatory([
                new Terminal(DotTok, 1)
            ]),
        ])

        let result = new NextTerminalAfterAtLeastOneWalker(atLeastOneRule, 1).startWalking()
        expect(result.occurrence).to.be.undefined
        expect(result.token).to.be.undefined
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

describe("The chevrotain grammar interpreter capabilities", () => {

    function extractPartialPaths(newResultFormat) {
        return map(newResultFormat, (currItem) => currItem.partialPath)
    }

    class Alpha extends Token {}

    class Beta extends Token {}

    class Gamma extends Token {}

    class Comma extends Token {}

    augmentTokenClasses([Alpha, Beta, Gamma, Comma])

    context("can calculate the next possible paths in a", () => {

        it("Sequence", () => {
            let seq = [
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta),
                new gast.Terminal(Gamma)
            ]

            expect(extractPartialPaths(possiblePathsFrom(seq, 1))).to.deep.equal([[Alpha]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 2))).to.deep.equal([[Alpha, Beta]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 3))).to.deep.equal([[Alpha, Beta, Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 4))).to.deep.equal([[Alpha, Beta, Gamma]])
        })

        it("Optional", () => {
            let seq = [
                new gast.Terminal(Alpha),
                new gast.Option([
                    new gast.Terminal(Beta)
                ]),
                new gast.Terminal(Gamma)
            ]

            expect(extractPartialPaths(possiblePathsFrom(seq, 1))).to.deep.equal([[Alpha]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 2))).to.deep.equal([[Alpha, Beta], [Alpha, Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 3))).to.deep.equal([[Alpha, Beta, Gamma], [Alpha, Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 4))).to.deep.equal([[Alpha, Beta, Gamma], [Alpha, Gamma]])
        })

        it("Alternation", () => {
            let alts = [new gast.Alternation([
                new gast.Flat([
                    new gast.Terminal(Alpha)
                ]),
                new gast.Flat([
                    new gast.Terminal(Beta),
                    new gast.Terminal(Beta)
                ]),
                new gast.Flat([
                    new gast.Terminal(Beta),
                    new gast.Terminal(Alpha),
                    new gast.Terminal(Gamma)
                ])
            ])]

            expect(extractPartialPaths(possiblePathsFrom(alts, 1))).to.deep.equal([[Alpha], [Beta], [Beta]])
            expect(extractPartialPaths(possiblePathsFrom(alts, 2))).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha]])
            expect(extractPartialPaths(possiblePathsFrom(alts, 3))).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha, Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(alts, 4))).to.deep.equal([[Alpha], [Beta, Beta], [Beta, Alpha, Gamma]])
        })

        it("Repetition", () => {
            let rep = [new gast.Repetition([
                new gast.Terminal(Alpha),
                new gast.Terminal(Alpha)
            ]),
                new gast.Terminal(Gamma)
            ]

            expect(extractPartialPaths(possiblePathsFrom(rep, 1))).to.deep.equal([[Alpha], [Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(rep, 2))).to.deep.equal([[Alpha, Alpha], [Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(rep, 3))).to.deep.equal([[Alpha, Alpha, Gamma], [Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(rep, 4))).to.deep.equal([[Alpha, Alpha, Gamma], [Gamma]])
        })

        it("Mandatory Repetition", () => {
            let repMand = [new gast.RepetitionMandatory([
                new gast.Terminal(Alpha),
                new gast.Terminal(Alpha)
            ]),
                new gast.Terminal(Gamma)
            ]

            expect(extractPartialPaths(possiblePathsFrom(repMand, 1))).to.deep.equal([[Alpha]])
            expect(extractPartialPaths(possiblePathsFrom(repMand, 2))).to.deep.equal([[Alpha, Alpha]])
            expect(extractPartialPaths(possiblePathsFrom(repMand, 3))).to.deep.equal([[Alpha, Alpha, Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(repMand, 4))).to.deep.equal([[Alpha, Alpha, Gamma]])
        })

        it("Repetition with Separator", () => {
            // same as Mandatory Repetition because currently possiblePaths only cares about
            // the first repetition.
            let rep = [new gast.RepetitionWithSeparator([
                new gast.Terminal(Alpha),
                new gast.Terminal(Alpha)
            ], Comma),
                new gast.Terminal(Gamma)
            ]

            expect(extractPartialPaths(possiblePathsFrom(rep, 1))).to.deep.equal([[Alpha], [Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(rep, 2))).to.deep.equal([[Alpha, Alpha], [Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(rep, 3))).to.deep.equal([[Alpha, Alpha, Gamma], [Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(rep, 4))).to.deep.equal([[Alpha, Alpha, Gamma], [Gamma]])
        })

        it("Mandatory Repetition with Separator", () => {
            // same as Mandatory Repetition because currently possiblePaths only cares about
            // the first repetition.
            let repMandSep = [new gast.RepetitionMandatoryWithSeparator([
                new gast.Terminal(Alpha),
                new gast.Terminal(Alpha)
            ], Comma),
                new gast.Terminal(Gamma)
            ]

            expect(extractPartialPaths(possiblePathsFrom(repMandSep, 1))).to.deep.equal([[Alpha]])
            expect(extractPartialPaths(possiblePathsFrom(repMandSep, 2))).to.deep.equal([[Alpha, Alpha]])
            expect(extractPartialPaths(possiblePathsFrom(repMandSep, 3))).to.deep.equal([[Alpha, Alpha, Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(repMandSep, 4))).to.deep.equal([[Alpha, Alpha, Gamma]])
        })

        it("NonTerminal", () => {
            let someSubRule = new gast.Rule("blah", [
                new gast.Terminal(Beta)
            ])

            let seq = [
                new gast.Terminal(Alpha),
                new gast.NonTerminal("blah", someSubRule),
                new gast.Terminal(Gamma)
            ]

            expect(extractPartialPaths(possiblePathsFrom(seq, 1))).to.deep.equal([[Alpha]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 2))).to.deep.equal([[Alpha, Beta]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 3))).to.deep.equal([[Alpha, Beta, Gamma]])
            expect(extractPartialPaths(possiblePathsFrom(seq, 4))).to.deep.equal([[Alpha, Beta, Gamma]])
        })
    })

    context("can calculate the next possible single tokens for: ", () => {

        function INPUT(tokTypes:TokenConstructor[]):IToken[] {
            return map(tokTypes, (currTokType) => createRegularToken(currTokType))
        }

        function pluckTokenTypes(arr:any[]):TokenConstructor[] {
            return map(arr, (currItem) => currItem.nextTokenType)
        }

        it("Sequence positive", () => {
            let seq = [
                new gast.Flat([
                    new gast.Terminal(Alpha),
                    new gast.Terminal(Beta),
                    new gast.Terminal(Gamma)
                ])
            ]

            setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([]), tokenStructuredMatcher, 5)), [Alpha])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha]), tokenStructuredMatcher, 5)), [Beta])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Gamma])
        })

        it("Sequence negative", () => {
            let seq = [
                new gast.Flat([
                    new gast.Terminal(Alpha),
                    new gast.Terminal(Beta),
                    new gast.Terminal(Gamma)
                ])
            ]

            // negative
            expect(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(seq, INPUT([Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(seq, INPUT([Beta]), tokenStructuredMatcher, 5)).to.be.empty
        })

        it("Optional positive", () => {
            let seq = [
                new gast.Terminal(Alpha),
                new gast.Option([
                    new gast.Terminal(Beta)
                ]),
                new gast.Terminal(Gamma)
            ]

            // setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([]), tokenStructuredMatcher, 5)), [Alpha])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha]), tokenStructuredMatcher, 5)), [Beta, Gamma])
            // setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Gamma])
        })

        it("Optional Negative", () => {
            let seq = [
                new gast.Terminal(Alpha),
                new gast.Option([
                    new gast.Terminal(Beta)
                ]),
                new gast.Terminal(Gamma)
            ]

            expect(nextPossibleTokensAfter(seq, INPUT([Beta]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(seq, INPUT([Alpha, Alpha]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
        })

        it("Alternation positive", () => {
            let alts = [
                new gast.Alternation([
                    new gast.Flat([
                        new gast.Terminal(Alpha)
                    ]),
                    new gast.Flat([
                        new gast.Terminal(Beta),
                        new gast.Terminal(Beta)
                    ]),
                    new gast.Flat([
                        new gast.Terminal(Beta),
                        new gast.Terminal(Alpha),
                        new gast.Terminal(Gamma)
                    ]),
                    new gast.Flat([
                        new gast.Terminal(Gamma)
                    ])
                ])]

            setEquality(pluckTokenTypes(nextPossibleTokensAfter(alts, INPUT([]), tokenStructuredMatcher, 5)), [Alpha, Beta, Beta, Gamma])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(alts, INPUT([Beta]), tokenStructuredMatcher, 5)), [Beta, Alpha])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(alts, INPUT([Beta, Alpha]), tokenStructuredMatcher, 5)), [Gamma])
        })

        it("Alternation Negative", () => {
            let alts = [new gast.Alternation([
                new gast.Flat([
                    new gast.Terminal(Alpha)
                ]),
                new gast.Flat([
                    new gast.Terminal(Beta),
                    new gast.Terminal(Beta)
                ]),
                new gast.Flat([
                    new gast.Terminal(Beta),
                    new gast.Terminal(Alpha),
                    new gast.Terminal(Gamma)
                ])
            ])]

            expect(nextPossibleTokensAfter(alts, INPUT([Alpha]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(alts, INPUT([Gamma, Alpha]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(alts, INPUT([Beta, Beta]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(alts, INPUT([Gamma]), tokenStructuredMatcher, 5)).to.be.empty
        })

        it("Repetition - positive", () => {
            let rep = [new gast.Repetition([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta)
            ]),
                new gast.Terminal(Gamma)
            ]

            setEquality(pluckTokenTypes(nextPossibleTokensAfter(rep, INPUT([]), tokenStructuredMatcher, 5)), [Alpha, Gamma])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(rep, INPUT([Alpha]), tokenStructuredMatcher, 5)), [Beta])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(rep, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Alpha, Gamma])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(rep, INPUT([Alpha, Beta, Alpha]), tokenStructuredMatcher, 5)), [Beta])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(rep, INPUT([Alpha, Beta, Alpha, Beta]), tokenStructuredMatcher, 5)),
                [Alpha, Gamma])
        })

        it("Repetition - negative", () => {
            let rep = [new gast.Repetition([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta)
            ]),
                new gast.Terminal(Gamma)
            ]

            expect(nextPossibleTokensAfter(rep, INPUT([Beta]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(rep, INPUT([Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(rep, INPUT([Alpha, Beta, Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(rep, INPUT([Alpha, Beta, Alpha, Beta, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
        })

        it("Mandatory Repetition - positive", () => {
            let repMand = [new gast.RepetitionMandatory([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta)
            ]),
                new gast.Terminal(Gamma)
            ]

            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repMand, INPUT([]), tokenStructuredMatcher, 5)), [Alpha])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repMand, INPUT([Alpha]), tokenStructuredMatcher, 5)), [Beta])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Alpha, Gamma])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Alpha]), tokenStructuredMatcher, 5)), [Beta])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Alpha, Beta]), tokenStructuredMatcher, 5)),
                [Alpha, Gamma])
        })

        it("Mandatory Repetition - negative", () => {
            let repMand = [new gast.RepetitionMandatory([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta)
            ]),
                new gast.Terminal(Gamma)
            ]

            expect(nextPossibleTokensAfter(repMand, INPUT([Beta]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Alpha, Beta, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
        })

        it("Repetition with Separator - positive", () => {
            let repSep = [new gast.RepetitionWithSeparator([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta)
            ], Comma),
                new gast.Terminal(Gamma)
            ]

            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([]), tokenStructuredMatcher, 5)), [Alpha, Gamma])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([Alpha]), tokenStructuredMatcher, 5)), [Beta])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Comma, Gamma])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta, Comma]), tokenStructuredMatcher, 5)), [Alpha])
            setEquality(
                pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta, Comma, Alpha, Beta]), tokenStructuredMatcher, 5)),
                [Comma, Gamma])
        })

        it("Repetition with Separator - negative", () => {
            let repMand = [new gast.RepetitionWithSeparator([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta)
            ], Comma),
                new gast.Terminal(Gamma)
            ]

            expect(nextPossibleTokensAfter(repMand, INPUT([Comma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Comma, Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Comma, Alpha, Beta, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
        })

        it("Repetition with Separator Mandatory - positive", () => {
            let repSep = [new gast.RepetitionMandatoryWithSeparator([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta)
            ], Comma),
                new gast.Terminal(Gamma)
            ]

            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([]), tokenStructuredMatcher, 5)), [Alpha])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([Alpha]), tokenStructuredMatcher, 5)), [Beta])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Comma, Gamma])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(repSep, INPUT([Alpha, Beta, Comma]), tokenStructuredMatcher, 5)), [Alpha])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(
                repSep,
                INPUT([Alpha, Beta, Comma, Alpha, Beta]),
                tokenStructuredMatcher, 5)), [Comma, Gamma])
        })

        it("Repetition with Separator Mandatory - negative", () => {
            let repMand = [new gast.RepetitionMandatoryWithSeparator([
                new gast.Terminal(Alpha),
                new gast.Terminal(Beta)
            ], Comma),
                new gast.Terminal(Gamma)
            ]

            expect(nextPossibleTokensAfter(repMand, INPUT([Comma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Comma, Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(repMand, INPUT([Alpha, Beta, Comma, Alpha, Beta, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
        })

        it("NonTerminal - positive", () => {
            let someSubRule = new gast.Rule("blah", [
                new gast.Terminal(Beta)
            ])

            let seq = [
                new gast.Terminal(Alpha),
                new gast.NonTerminal("blah", someSubRule),
                new gast.Terminal(Gamma)
            ]

            setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([]), tokenStructuredMatcher, 5)), [Alpha])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha]), tokenStructuredMatcher, 5)), [Beta])
            setEquality(pluckTokenTypes(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta]), tokenStructuredMatcher, 5)), [Gamma])
        })

        it("NonTerminal - negative", () => {
            let someSubRule = new gast.Rule("blah", [
                new gast.Terminal(Beta)
            ])

            let seq = [
                new gast.Terminal(Alpha),
                new gast.NonTerminal("blah", someSubRule),
                new gast.Terminal(Gamma)
            ]

            expect(nextPossibleTokensAfter(seq, INPUT([Beta]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(seq, INPUT([Alpha, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
            expect(nextPossibleTokensAfter(seq, INPUT([Alpha, Beta, Gamma]), tokenStructuredMatcher, 5)).to.be.empty
        })
    })

})
