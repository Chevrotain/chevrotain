import {END_OF_FILE, Parser} from "../../../src/parse/parser_public"
import {createToken, IToken, Token} from "../../../src/scan/tokens_public"
import {gast} from "../../../src/parse/grammar/gast_public"
import {
    buildAlternativesLookAheadFunc,
    buildLookaheadFuncForOptionalProd,
    buildLookaheadFuncForOr,
    buildSingleAlternativeLookaheadFunction,
    getProdType,
    lookAheadSequenceFromAlternatives,
    PROD_TYPE
} from "../../../src/parse/grammar/lookahead"
import {map} from "../../../src/utils/utils"
import {augmentTokenTypes, tokenStructuredMatcher} from "../../../src/scan/tokens"
import {createRegularToken} from "../../utils/matchers"
import {TokenType} from "../../../src/scan/lexer_public"
import Terminal = gast.Terminal
import RepetitionMandatoryWithSeparator = gast.RepetitionMandatoryWithSeparator
import Repetition = gast.Repetition
import Rule = gast.Rule
import NonTerminal = gast.NonTerminal
import Option = gast.Option
import RepetitionWithSeparator = gast.RepetitionWithSeparator
import Flat = gast.Flat
import Alternation = gast.Alternation
import RepetitionMandatory = gast.RepetitionMandatory

const IdentTok = createToken({ name: "IdentTok" })
const DotTok = createToken({ name: "DotTok" })
const DotDotTok = createToken({ name: "DotDotTok" })
const ColonTok = createToken({ name: "ColonTok" })
const LSquareTok = createToken({ name: "LSquareTok" })
const RSquareTok = createToken({ name: "RSquareTok" })
const ActionTok = createToken({ name: "ActionTok" })
const LParenTok = createToken({ name: "LParenTok" })
const RParenTok = createToken({ name: "RParenTok" })
const CommaTok = createToken({ name: "CommaTok" })
const SemicolonTok = createToken({ name: "SemicolonTok" })
const UnsignedIntegerLiteralTok = createToken({
    name: "UnsignedIntegerLiteralTok"
})
const DefaultTok = createToken({ name: "DefaultTok" })
const AsteriskTok = createToken({ name: "AsteriskTok" })
const EntityTok = createToken({ name: "EntityTok" })
const KeyTok = createToken({ name: "KeyTok" })

let atLeastOneRule = new Rule("atLeastOneRule", [
    new RepetitionMandatory([
        new RepetitionMandatory(
            [
                new RepetitionMandatory([new Terminal(EntityTok)], 3),
                new Terminal(CommaTok)
            ],
            2
        ),
        new Terminal(DotTok, 1)
    ]),
    new Terminal(DotTok, 2)
])

let atLeastOneSepRule = new Rule("atLeastOneSepRule", [
    new RepetitionMandatoryWithSeparator(
        [
            new RepetitionMandatoryWithSeparator(
                [
                    new RepetitionMandatoryWithSeparator(
                        [new Terminal(EntityTok)],
                        SemicolonTok,
                        3
                    ),
                    new Terminal(CommaTok)
                ],
                SemicolonTok,
                2
            ),
            new Terminal(DotTok, 1)
        ],
        SemicolonTok
    ),
    new Terminal(DotTok, 2)
])

let qualifiedName = new Rule("qualifiedName", [
    new Terminal(IdentTok),
    new Repetition([new Terminal(DotTok), new Terminal(IdentTok, 2)])
])

let qualifiedNameSep = new Rule("qualifiedNameSep", [
    new RepetitionMandatoryWithSeparator([new Terminal(IdentTok, 1)], DotTok)
])

let paramSpec = new Rule("paramSpec", [
    new Terminal(IdentTok),
    new Terminal(ColonTok),
    new NonTerminal("qualifiedName", qualifiedName),
    new Option([new Terminal(LSquareTok), new Terminal(RSquareTok)])
])

let actionDec = new Rule("actionDec", [
    new Terminal(ActionTok),
    new Terminal(IdentTok),
    new Terminal(LParenTok),
    new Option([
        new NonTerminal("paramSpec", paramSpec),
        new Repetition([
            new Terminal(CommaTok),
            new NonTerminal("paramSpec", paramSpec, 2)
        ])
    ]),
    new Terminal(RParenTok),
    new Option(
        [
            new Terminal(ColonTok),
            new NonTerminal("qualifiedName", qualifiedName)
        ],
        2
    ),
    new Terminal(SemicolonTok)
])

let actionDecSep = new Rule("actionDecSep", [
    new Terminal(ActionTok),
    new Terminal(IdentTok),
    new Terminal(LParenTok),

    new RepetitionWithSeparator(
        [new NonTerminal("paramSpec", paramSpec, 2)],
        CommaTok
    ),

    new Terminal(RParenTok),
    new Option(
        [
            new Terminal(ColonTok),
            new NonTerminal("qualifiedName", qualifiedName)
        ],
        2
    ),
    new Terminal(SemicolonTok)
])

let manyActions = new Rule("manyActions", [
    new Repetition([new NonTerminal("actionDec", actionDec, 1)])
])

let cardinality = new Rule("cardinality", [
    new Terminal(LSquareTok),
    new Terminal(UnsignedIntegerLiteralTok),
    new Terminal(DotDotTok),
    new Alternation([
        new Flat([new Terminal(UnsignedIntegerLiteralTok, 2)]),
        new Flat([new Terminal(AsteriskTok)])
    ]),
    new Terminal(RSquareTok)
])

let assignedTypeSpec = new Rule("assignedTypeSpec", [
    new Terminal(ColonTok),
    new NonTerminal("assignedType"),

    new Option([new NonTerminal("enumClause")]),

    new Option([new Terminal(DefaultTok), new NonTerminal("expression")], 2)
])

let lotsOfOrs = new Rule("lotsOfOrs", [
    new Alternation([
        new Flat([
            new Alternation(
                [
                    new Flat([new Terminal(CommaTok, 1)]),
                    new Flat([new Terminal(KeyTok, 1)])
                ],
                2
            )
        ]),
        new Flat([new Terminal(EntityTok, 1)])
    ]),
    new Alternation([new Flat([new Terminal(DotTok, 1)])], 3)
])

let emptyAltOr = new Rule("emptyAltOr", [
    new Alternation([
        new Flat([new Terminal(KeyTok, 1)]),
        new Flat([new Terminal(EntityTok, 1)]),
        new Flat([]) // an empty alternative
    ])
])

let callArguments = new Rule("callArguments", [
    new RepetitionWithSeparator([new Terminal(IdentTok, 1)], CommaTok),
    new RepetitionWithSeparator([new Terminal(IdentTok, 2)], CommaTok, 2)
])

describe("getProdType", () => {
    it("handles `Option`", () => {
        expect(getProdType(new Option([]))).to.equal(PROD_TYPE.OPTION)
    })
    it("handles `Repetition`", () => {
        expect(getProdType(new Repetition([]))).to.equal(PROD_TYPE.REPETITION)
    })
    it("handles `RepetitionMandatory`", () => {
        expect(getProdType(new RepetitionMandatory([]))).to.equal(
            PROD_TYPE.REPETITION_MANDATORY
        )
    })
    it("handles `RepetitionWithSeparator`", () => {
        expect(getProdType(new RepetitionWithSeparator([], null))).to.equal(
            PROD_TYPE.REPETITION_WITH_SEPARATOR
        )
    })
    it("handles `RepetitionMandatoryWithSeparator`", () => {
        expect(
            getProdType(new RepetitionMandatoryWithSeparator([], null))
        ).to.equal(PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR)
    })
    it("handles `Alternation`", () => {
        expect(getProdType(new Alternation([]))).to.equal(PROD_TYPE.ALTERNATION)
    })
})

context("lookahead specs", () => {
    class ColonParserMock extends Parser {
        constructor() {
            super([], [ColonTok])
        }

        protected LA(): IToken {
            return createRegularToken(ColonTok, ":")
        }
    }

    class IdentParserMock extends Parser {
        constructor() {
            super([], [IdentTok])
        }

        protected LA(): IToken {
            return createRegularToken(IdentTok, "bamba")
        }
    }

    class CommaParserMock extends Parser {
        constructor() {
            super([], [CommaTok])
        }

        protected LA(): IToken {
            return createRegularToken(CommaTok, ",")
        }
    }

    class EntityParserMock extends Parser {
        constructor() {
            super([], [EntityTok])
        }

        protected LA(): IToken {
            return createRegularToken(EntityTok, ",")
        }
    }

    class KeyParserMock extends Parser {
        constructor() {
            super([], [KeyTok])
        }

        protected LA(): IToken {
            return createRegularToken(KeyTok, ",")
        }
    }

    describe("The Grammar Lookahead namespace", () => {
        it("can compute the lookahead function for the first OPTION in ActionDec", () => {
            let colonMock = new ColonParserMock()
            let indentMock = new IdentParserMock()

            let laFunc = buildLookaheadFuncForOptionalProd(
                1,
                actionDec,
                1,
                false,
                PROD_TYPE.OPTION,
                buildSingleAlternativeLookaheadFunction
            )

            expect(laFunc.call(colonMock)).to.equal(false)
            expect(laFunc.call(indentMock)).to.equal(true)
        })

        it("can compute the lookahead function for the second OPTION in ActionDec", () => {
            let colonParserMock = new ColonParserMock()
            let identParserMock = new IdentParserMock()

            let laFunc = buildLookaheadFuncForOptionalProd(
                2,
                actionDec,
                1,
                false,
                PROD_TYPE.OPTION,
                buildSingleAlternativeLookaheadFunction
            )

            expect(laFunc.call(colonParserMock)).to.equal(true)
            expect(laFunc.call(identParserMock)).to.equal(false)
        })

        it("can compute the lookahead function for the first MANY in ActionDec", () => {
            let identParserMock = new IdentParserMock()
            let commaParserMock = new CommaParserMock()

            let laFunc = buildLookaheadFuncForOptionalProd(
                1,
                actionDec,
                1,
                false,
                PROD_TYPE.REPETITION,
                buildSingleAlternativeLookaheadFunction
            )

            expect(laFunc.call(commaParserMock)).to.equal(true)
            expect(laFunc.call(identParserMock)).to.equal(false)
        })

        it("can compute the lookahead function for lots of ORs sample", () => {
            let keyParserMock = new KeyParserMock()
            let entityParserMock = new EntityParserMock()
            let colonParserMock = new ColonParserMock()
            let commaParserMock = new CommaParserMock()

            let laFunc = buildLookaheadFuncForOr(
                1,
                lotsOfOrs,
                1,
                false,
                false,
                buildAlternativesLookAheadFunc
            )

            expect(laFunc.call(commaParserMock)).to.equal(0)
            expect(laFunc.call(keyParserMock)).to.equal(0)
            expect(laFunc.call(entityParserMock)).to.equal(1)
            expect(laFunc.call(colonParserMock)).to.equal(undefined)
        })

        it("can compute the lookahead function for EMPTY OR sample", () => {
            let commaParserMock = new CommaParserMock()
            let keyParserMock = new KeyParserMock()
            let entityParserMock = new EntityParserMock()

            let laFunc = buildLookaheadFuncForOr(
                1,
                emptyAltOr,
                1,
                false,
                false,
                buildAlternativesLookAheadFunc
            )

            expect(laFunc.call(keyParserMock)).to.equal(0)
            expect(laFunc.call(entityParserMock)).to.equal(1)
            // none matches so the last empty alternative should be taken (idx 2)
            expect(laFunc.call(commaParserMock)).to.equal(2)
        })
    })

    describe("The chevrotain grammar lookahead capabilities", () => {
        const Alpha = createToken({ name: "Alpha" })
        const ExtendsAlpha = createToken({
            name: "ExtendsAlpha",
            parent: Alpha
        })
        const ExtendsAlphaAlpha = createToken({
            name: "ExtendsAlphaAlpha",
            parent: ExtendsAlpha
        })
        const Beta = createToken({ name: "Beta" })
        const Charlie = createToken({ name: "Charlie" })
        const Delta = createToken({ name: "Delta" })
        const Gamma = createToken({ name: "Gamma" })

        augmentTokenTypes([
            Alpha,
            Beta,
            Delta,
            Gamma,
            Charlie,
            ExtendsAlphaAlpha
        ])

        context("computing lookahead sequences for", () => {
            it("two simple one token alternatives", () => {
                let alt1 = new gast.Alternation([
                    new gast.Flat([new gast.Terminal(Alpha)]),
                    new gast.Flat([new gast.Terminal(Beta)]),
                    new gast.Flat([new gast.Terminal(Beta)])
                ])
                let alt2 = new gast.Terminal(Gamma)

                let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
                expect(actual).to.deep.equal([[[Alpha], [Beta]], [[Gamma]]])
            })

            it("three simple one token alternatives", () => {
                let alt1 = new gast.Alternation([
                    new gast.Flat([new gast.Terminal(Alpha)]),
                    new gast.Flat([new gast.Terminal(Beta)]),
                    new gast.Flat([new gast.Terminal(Beta)])
                ])
                let alt2 = new gast.Terminal(Gamma)
                let alt3 = new gast.Flat([
                    new gast.Terminal(Delta),
                    new gast.Terminal(Charlie)
                ])

                let actual = lookAheadSequenceFromAlternatives(
                    [alt1, alt2, alt3],
                    5
                )
                expect(actual).to.deep.equal([
                    [[Alpha], [Beta]],
                    [[Gamma]],
                    [[Delta]]
                ])
            })

            it("two complex multi token alternatives", () => {
                let alt1 = new gast.Alternation([
                    new gast.Flat([
                        new gast.Terminal(Alpha),
                        new gast.Terminal(Beta)
                    ]),
                    new gast.Flat([new gast.Terminal(Beta)]),
                    new gast.Flat([
                        new gast.Terminal(Alpha),
                        new gast.Terminal(Gamma),
                        new gast.Terminal(Delta)
                    ])
                ])
                let alt2 = new gast.Alternation([
                    new gast.Flat([
                        new gast.Terminal(Alpha),
                        new gast.Terminal(Delta)
                    ]),
                    new gast.Flat([new gast.Terminal(Charlie)])
                ])

                let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
                expect(actual).to.deep.equal([
                    [[Beta], [Alpha, Beta], [Alpha, Gamma]],
                    [[Charlie], [Alpha, Delta]]
                ])
            })

            it("three complex multi token alternatives", () => {
                let alt1 = new gast.Alternation([
                    new gast.Flat([
                        new gast.Terminal(Alpha),
                        new gast.Terminal(Beta),
                        new gast.Terminal(Gamma)
                    ]),
                    new gast.Flat([new gast.Terminal(Beta)])
                ])
                let alt2 = new gast.Alternation([
                    new gast.Flat([
                        new gast.Terminal(Alpha),
                        new gast.Terminal(Delta)
                    ]),
                    new gast.Flat([new gast.Terminal(Charlie)]),
                    new gast.Flat([
                        new gast.Terminal(Gamma),
                        new gast.Terminal(Gamma)
                    ])
                ])
                let alt3 = new gast.Alternation([
                    new gast.Flat([
                        new gast.Terminal(Alpha),
                        new gast.Terminal(Beta),
                        new gast.Terminal(Delta)
                    ]),
                    new gast.Flat([
                        new gast.Terminal(Charlie),
                        new gast.Terminal(Beta)
                    ])
                ])

                let actual = lookAheadSequenceFromAlternatives(
                    [alt1, alt2, alt3],
                    5
                )
                expect(actual).to.deep.equal([
                    [[Beta], [Alpha, Beta, Gamma]],
                    [[Charlie], [Gamma], [Alpha, Delta]],
                    [[Charlie, Beta], [Alpha, Beta, Delta]]
                ])
            })

            it("two complex multi token alternatives with shared prefix", () => {
                let alt1 = new gast.Flat([
                    new gast.Terminal(Alpha),
                    new gast.Terminal(Beta),
                    new gast.Terminal(Charlie),
                    new gast.Terminal(Delta)
                ])

                let alt2 = new gast.Flat([
                    new gast.Terminal(Alpha),
                    new gast.Terminal(Beta),
                    new gast.Terminal(Charlie),
                    new gast.Terminal(Delta),
                    new gast.Terminal(Gamma),
                    new gast.Terminal(Alpha)
                ])

                let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
                expect(actual).to.deep.equal([
                    [[Alpha, Beta, Charlie, Delta]],
                    [[Alpha, Beta, Charlie, Delta, Gamma]]
                ])
            })

            it("simple ambiguous alternatives", () => {
                let alt1 = new gast.Flat([new gast.Terminal(Alpha)])
                let alt2 = new gast.Flat([new gast.Terminal(Alpha)])

                let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
                expect(actual).to.deep.equal([[[Alpha]], [[Alpha]]])
            })

            it("complex(multi-token) ambiguous alternatives", () => {
                let alt1 = new gast.Flat([
                    new gast.Terminal(Alpha),
                    new gast.Terminal(Beta),
                    new gast.Terminal(Charlie)
                ])

                let alt2 = new gast.Flat([
                    new gast.Terminal(Alpha),
                    new gast.Terminal(Beta),
                    new gast.Terminal(Charlie)
                ])

                let actual = lookAheadSequenceFromAlternatives([alt1, alt2], 5)
                expect(actual).to.deep.equal([
                    [[Alpha, Beta, Charlie]],
                    [[Alpha, Beta, Charlie]]
                ])
            })
        })

        context("computing lookahead functions for", () => {
            class MockParser {
                public input: IToken[]

                constructor(public inputConstructors: ITokenType[]) {
                    this.input = map(inputConstructors, currConst =>
                        createRegularToken(currConst)
                    )
                }

                LA(howMuch: number): IToken {
                    if (this.input.length <= howMuch - 1) {
                        return END_OF_FILE
                    } else {
                        return this.input[howMuch - 1]
                    }
                }
            }

            it("inheritance Alternative alternatives - positive", () => {
                let alternatives = [
                    [[ExtendsAlphaAlpha]], // 0
                    [[ExtendsAlpha]], // 1
                    [[Alpha]] // 2
                ]
                let laFunc = buildAlternativesLookAheadFunc(
                    alternatives,
                    false,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Alpha]))).to.equal(2)
                expect(laFunc.call(new MockParser([ExtendsAlpha]))).to.equal(1)
                expect(
                    laFunc.call(new MockParser([ExtendsAlphaAlpha]))
                ).to.equal(0)
            })

            it("simple alternatives - positive", () => {
                let alternatives = [
                    [[Alpha], [Beta]], // 0
                    [[Delta], [Gamma]], // 1
                    [[Charlie]] // 2
                ]
                let laFunc = buildAlternativesLookAheadFunc(
                    alternatives,
                    false,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Alpha]))).to.equal(0)
                expect(laFunc.call(new MockParser([Beta]))).to.equal(0)
                expect(laFunc.call(new MockParser([Delta]))).to.equal(1)
                expect(laFunc.call(new MockParser([Gamma]))).to.equal(1)
                expect(laFunc.call(new MockParser([Charlie]))).to.equal(2)
            })

            it("simple alternatives - negative", () => {
                let alternatives = [
                    [[Alpha], [Beta]], // 0
                    [[Delta], [Gamma]] // 1
                ]
                let laFunc = buildAlternativesLookAheadFunc(
                    alternatives,
                    false,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([]))).to.be.undefined
                expect(laFunc.call(new MockParser([Charlie]))).to.be.undefined
            })

            it("complex alternatives - positive", () => {
                let alternatives = [
                    [[Alpha, Beta, Gamma], [Alpha, Beta, Delta]], // 0
                    [[Alpha, Beta, Beta]], // 1
                    [[Alpha, Beta]] // 2 - Prefix of '1' alternative
                ]
                let laFunc = buildAlternativesLookAheadFunc(
                    alternatives,
                    false,
                    tokenStructuredMatcher,
                    false
                )

                expect(
                    laFunc.call(new MockParser([Alpha, Beta, Gamma]))
                ).to.equal(0)
                expect(
                    laFunc.call(new MockParser([Alpha, Beta, Gamma, Delta]))
                ).to.equal(0)
                expect(
                    laFunc.call(new MockParser([Alpha, Beta, Delta]))
                ).to.equal(0)
                expect(
                    laFunc.call(new MockParser([Alpha, Beta, Beta]))
                ).to.equal(1)
                expect(
                    laFunc.call(new MockParser([Alpha, Beta, Charlie]))
                ).to.equal(2)
            })

            it("complex alternatives - negative", () => {
                let alternatives = [
                    [[Alpha, Beta, Gamma], [Alpha, Beta, Delta]], // 0
                    [[Alpha, Beta, Beta]], // 1
                    [[Alpha, Beta], [Gamma]] // 2
                ]
                let laFunc = buildAlternativesLookAheadFunc(
                    alternatives,
                    false,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([]))).to.be.undefined
                expect(laFunc.call(new MockParser([Alpha, Gamma, Gamma]))).to.be
                    .undefined
                expect(laFunc.call(new MockParser([Charlie]))).to.be.undefined
                expect(laFunc.call(new MockParser([Beta, Alpha, Beta, Gamma])))
                    .to.be.undefined
            })

            it("complex alternatives with inheritance - positive", () => {
                let alternatives = [
                    [[ExtendsAlpha, Beta]], // 0
                    [[Alpha, Beta]] // 1
                ]

                let laFunc = buildAlternativesLookAheadFunc(
                    alternatives,
                    false,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Alpha, Beta]))).to.equal(1)
                expect(
                    laFunc.call(new MockParser([ExtendsAlphaAlpha, Beta]))
                ).to.equal(0)
                expect(
                    laFunc.call(new MockParser([ExtendsAlpha, Beta]))
                ).to.equal(0)
            })

            it("complex alternatives with inheritance - negative", () => {
                let alternatives = [
                    [[ExtendsAlpha, Beta]], // 0
                    [[Alpha, Gamma]] // 1
                ]

                let laFunc = buildAlternativesLookAheadFunc(
                    alternatives,
                    false,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Alpha, Beta]))).to.be
                    .undefined
                expect(laFunc.call(new MockParser([ExtendsAlphaAlpha, Delta])))
                    .to.be.undefined
            })

            it("Empty alternatives", () => {
                let alternatives = [
                    [[Alpha]], // 0
                    [[]] // 1
                ]
                let laFunc = buildAlternativesLookAheadFunc(
                    alternatives,
                    false,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Alpha]))).to.equal(0)
                expect(laFunc.call(new MockParser([]))).to.equal(1) // empty alternative always matches
                expect(laFunc.call(new MockParser([Delta]))).to.equal(1) // empty alternative always matches
            })

            it("simple optional - positive", () => {
                let alternative = [[Alpha], [Beta], [Charlie]]
                let laFunc = buildSingleAlternativeLookaheadFunction(
                    alternative,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Alpha]))).to.be.true
                expect(laFunc.call(new MockParser([Beta]))).to.be.true
                expect(laFunc.call(new MockParser([Charlie]))).to.be.true
            })

            it("simple optional - negative", () => {
                let alternative = [[Alpha], [Beta], [Charlie]]
                let laFunc = buildSingleAlternativeLookaheadFunction(
                    alternative,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Delta]))).to.be.false
                expect(laFunc.call(new MockParser([Gamma]))).to.be.false
            })

            it("complex optional - positive", () => {
                let alternative = [
                    [Alpha, Beta, Gamma],
                    [Beta],
                    [Charlie, Delta]
                ]
                let laFunc = buildSingleAlternativeLookaheadFunction(
                    alternative,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Alpha, Beta, Gamma]))).to.be
                    .true
                expect(laFunc.call(new MockParser([Beta]))).to.be.true
                expect(laFunc.call(new MockParser([Charlie, Delta]))).to.be.true
            })

            it("complex optional - Negative", () => {
                let alternative = [
                    [Alpha, Beta, Gamma],
                    [Beta],
                    [Charlie, Delta]
                ]
                let laFunc = buildSingleAlternativeLookaheadFunction(
                    alternative,
                    tokenStructuredMatcher,
                    false
                )

                expect(laFunc.call(new MockParser([Alpha, Charlie, Gamma]))).to
                    .be.false
                expect(laFunc.call(new MockParser([Charlie]))).to.be.false
                expect(laFunc.call(new MockParser([Charlie, Beta]))).to.be.false
            })

            it("complex optional with inheritance - positive", () => {
                let alternative = [[Alpha, ExtendsAlpha, ExtendsAlphaAlpha]]
                let laFunc = buildSingleAlternativeLookaheadFunction(
                    alternative,
                    tokenStructuredMatcher,
                    false
                )

                expect(
                    laFunc.call(
                        new MockParser([Alpha, ExtendsAlpha, ExtendsAlphaAlpha])
                    )
                ).to.be.true
                expect(
                    laFunc.call(
                        new MockParser([
                            ExtendsAlpha,
                            ExtendsAlpha,
                            ExtendsAlphaAlpha
                        ])
                    )
                ).to.be.true
                expect(
                    laFunc.call(
                        new MockParser([
                            ExtendsAlphaAlpha,
                            ExtendsAlpha,
                            ExtendsAlphaAlpha
                        ])
                    )
                ).to.be.true
                expect(
                    laFunc.call(
                        new MockParser([
                            ExtendsAlphaAlpha,
                            ExtendsAlphaAlpha,
                            ExtendsAlphaAlpha
                        ])
                    )
                ).to.be.true
            })

            it("complex optional with inheritance - negative", () => {
                let alternative = [[Alpha, ExtendsAlpha, ExtendsAlphaAlpha]]
                let laFunc = buildSingleAlternativeLookaheadFunction(
                    alternative,
                    tokenStructuredMatcher,
                    false
                )

                expect(
                    laFunc.call(
                        new MockParser([Gamma, ExtendsAlpha, ExtendsAlphaAlpha])
                    )
                ).to.be.false
                expect(
                    laFunc.call(
                        new MockParser([ExtendsAlpha, Alpha, ExtendsAlphaAlpha])
                    )
                ).to.be.false
                expect(
                    laFunc.call(
                        new MockParser([
                            ExtendsAlphaAlpha,
                            ExtendsAlpha,
                            ExtendsAlpha
                        ])
                    )
                ).to.be.false
            })
        })
    })
})
