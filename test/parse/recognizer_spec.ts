import { Token, EOF, createToken, IToken } from "../../src/scan/tokens_public"
import { IMultiModeLexerDefinition, Lexer } from "../../src/scan/lexer_public"
import { Parser, EMPTY_ALT } from "../../src/parse/parser_public"
import { HashTable } from "../../src/lang/lang_extensions"
import { getLookaheadFuncsForClass } from "../../src/parse/cache"
import { exceptions } from "../../src/parse/exceptions_public"
import { clearCache } from "../../src/parse/cache_public"
import {
    tokenStructuredMatcher,
    augmentTokenClasses
} from "../../src/scan/tokens"
import { createRegularToken, setEquality } from "../utils/matchers"
import MismatchedTokenException = exceptions.MismatchedTokenException
import NoViableAltException = exceptions.NoViableAltException
import EarlyExitException = exceptions.EarlyExitException

function defineRecognizerSpecs(
    contextName,
    createToken,
    createTokenInstance,
    tokenMatcher
) {
    context("Recognizer  " + contextName, () => {
        let PlusTok = createToken({ name: "PlusTok" })
        PlusTok.LABEL = "+"
        let MinusTok = createToken({ name: "MinusTok" })
        let IntTok = createToken({ name: "IntTok" })
        let DotTok = createToken({ name: "DotTok" })
        let IdentTok = createToken({ name: "IdentTok" })

        const ALL_TOKENS = [PlusTok, MinusTok, IntTok, IdentTok, DotTok]
        augmentTokenClasses(ALL_TOKENS)

        describe("The Parsing DSL", () => {
            it("provides a production SUBRULE1-5 that invokes another rule", () => {
                class SubRuleTestParser extends Parser {
                    private result = ""
                    private index = 1

                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS, {})
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public topRule = this.RULE("topRule", () => {
                        this.SUBRULE1(this.subRule)
                        this.SUBRULE2(this.subRule)
                        this.SUBRULE3(this.subRule)
                        this.SUBRULE4(this.subRule)
                        this.SUBRULE5(this.subRule)
                        return this.result
                    })

                    public subRule = this.RULE("subRule", () => {
                        this.CONSUME(PlusTok)
                        this.result += this.index++
                    })
                }

                let input = [
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok)
                ]
                let parser = new SubRuleTestParser(input)
                let result = parser.topRule()
                expect(result).to.equal("12345")
            })

            it("provides a production SUBRULE1-5 that can accept arguments from its caller", () => {
                class SubRuleArgsParser extends Parser {
                    private numbers = ""
                    private letters = ""

                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public topRule = this.RULE("topRule", () => {
                        this.SUBRULE(this.subRule, [6, "a"])
                        this.SUBRULE1(this.subRule2, [5, "b"])
                        this.SUBRULE2(this.subRule, [4, "c"])
                        this.SUBRULE3(this.subRule, [3, "d"])
                        this.SUBRULE4(this.subRule, [2, "e"])
                        this.SUBRULE5(this.subRule, [1, "f"])
                        return {
                            numbers: this.numbers,
                            letters: this.letters
                        }
                    })

                    public subRule = this.RULE(
                        "subRule",
                        (numFromCaller, charFromCaller) => {
                            this.CONSUME(PlusTok)
                            this.numbers += numFromCaller
                            this.letters += charFromCaller
                        }
                    )

                    public subRule2 = this.RULE(
                        "subRule2",
                        (numFromCaller, charFromCaller) => {
                            this.CONSUME(PlusTok)
                            this.numbers += numFromCaller
                            this.letters += charFromCaller
                        }
                    )
                }

                let input = [
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok),
                    createTokenInstance(PlusTok)
                ]
                let parser = new SubRuleArgsParser(input)
                let result = parser.topRule()
                expect(result.letters).to.equal("abcdef")
                expect(result.numbers).to.equal("654321")
            })

            describe("supports EMPTY(...) alternative convenience function", () => {
                class EmptyAltParser extends Parser {
                    public getLookAheadCache(): HashTable<Function> {
                        return getLookaheadFuncsForClass(this.className)
                    }

                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public orRule = this.RULE("orRule", this.parseOrRule)

                    private parseOrRule(): string {
                        return this.OR1([
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                    return "+"
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(MinusTok)
                                    return "-"
                                }
                            },
                            {
                                ALT: EMPTY_ALT("EMPTY_ALT")
                            }
                        ])
                    }
                }

                it("can match an non-empty alternative in an OR with an empty alternative", () => {
                    let input = [createTokenInstance(PlusTok)]
                    let parser = new EmptyAltParser(input)
                    expect(parser.orRule()).to.equal("+")
                })

                it("can match an empty alternative", () => {
                    let input = []
                    let parser = new EmptyAltParser(input)
                    expect(parser.orRule()).to.equal("EMPTY_ALT")
                })

                it("has a utility function for defining EMPTY ALTERNATIVES", () => {
                    let noArgsEmptyAlt = EMPTY_ALT()
                    expect(noArgsEmptyAlt()).to.be.undefined

                    let valueEmptyAlt = EMPTY_ALT(666)
                    expect(valueEmptyAlt()).to.equal(666)
                })
            })
        })

        describe("The Error Recovery functionality of the Chevrotain Parser", () => {
            class ManyRepetitionRecovery extends Parser {
                constructor(
                    input: Token[] = [],
                    isErrorRecoveryEnabled = true
                ) {
                    super(input, ALL_TOKENS, {
                        recoveryEnabled: isErrorRecoveryEnabled
                    })
                    ;(<any>Parser).performSelfAnalysis(this)
                }

                public qualifiedName = this.RULE(
                    "qualifiedName",
                    this.parseQualifiedName,
                    {
                        recoveryValueFunc: () => ["666"]
                    }
                )

                private parseQualifiedName(): string[] {
                    let idents = []

                    idents.push(this.CONSUME1(IdentTok).image)
                    this.MANY({
                        DEF: () => {
                            this.CONSUME1(DotTok)
                            idents.push(this.CONSUME2(IdentTok).image)
                        }
                    })

                    this.CONSUME1(EOF)

                    return idents
                }
            }

            class ManySepRepetitionRecovery extends Parser {
                constructor(
                    input: Token[] = [],
                    isErrorRecoveryEnabled = true
                ) {
                    super(input, ALL_TOKENS, {
                        recoveryEnabled: isErrorRecoveryEnabled
                    })
                    ;(<any>Parser).performSelfAnalysis(this)
                }

                public qualifiedName = this.RULE(
                    "qualifiedName",
                    this.parseQualifiedName,
                    {
                        recoveryValueFunc: () => ["333"]
                    }
                )

                private parseQualifiedName(): string[] {
                    let idents = []

                    idents.push(this.CONSUME1(IdentTok).image)
                    this.CONSUME1(DotTok)

                    this.MANY_SEP({
                        SEP: DotTok,
                        DEF: () => {
                            idents.push(this.CONSUME2(IdentTok).image)
                        }
                    })

                    this.CONSUME1(EOF)

                    return idents
                }
            }

            class ManySepSubRuleRepetitionRecovery extends Parser {
                constructor(input: Token[] = []) {
                    super(input, ALL_TOKENS, {
                        recoveryEnabled: true
                    })
                    ;(<any>Parser).performSelfAnalysis(this)
                }

                public qualifiedName = this.RULE(
                    "qualifiedName",
                    this.parseQualifiedName
                )
                public identifier = this.RULE(
                    "identifier",
                    this.parseIdentifier
                )
                public idents = []

                private parseQualifiedName(): string[] {
                    this.idents = []

                    this.MANY_SEP({
                        SEP: DotTok,
                        DEF: () => {
                            this.SUBRULE(this.identifier)
                        }
                    })

                    this.CONSUME1(EOF)

                    return this.idents
                }

                private parseIdentifier(): void {
                    this.idents.push(this.CONSUME1(IdentTok).image)
                }

                protected canTokenTypeBeInsertedInRecovery(tokClass: Function) {
                    // this parser is meant to test a scenario with re-sync recovery and MANY_SEP --> disable TokenInsertion
                    return false
                }
            }

            class AtLeastOneRepetitionRecovery extends Parser {
                constructor(
                    input: Token[] = [],
                    isErrorRecoveryEnabled = true
                ) {
                    super(input, ALL_TOKENS, {
                        recoveryEnabled: isErrorRecoveryEnabled
                    })
                    ;(<any>Parser).performSelfAnalysis(this)
                }

                public qualifiedName = this.RULE(
                    "qualifiedName",
                    this.parseQualifiedName,
                    {
                        recoveryValueFunc: () => ["777"]
                    }
                )

                private parseQualifiedName(): string[] {
                    let idents = []

                    idents.push(this.CONSUME1(IdentTok).image)
                    this.AT_LEAST_ONE({
                        DEF: () => {
                            this.CONSUME1(DotTok)
                            idents.push(this.CONSUME2(IdentTok).image)
                        },
                        ERR_MSG: "bamba"
                    })

                    this.CONSUME1(EOF)

                    return idents
                }
            }

            class AtLeastOneSepRepetitionRecovery extends Parser {
                constructor(
                    input: Token[] = [],
                    isErrorRecoveryEnabled = true
                ) {
                    super(input, ALL_TOKENS, {
                        recoveryEnabled: isErrorRecoveryEnabled
                    })
                    ;(<any>Parser).performSelfAnalysis(this)
                }

                public qualifiedName = this.RULE(
                    "qualifiedName",
                    this.parseQualifiedName,
                    {
                        recoveryValueFunc: () => ["999"]
                    }
                )

                private parseQualifiedName(): string[] {
                    let idents = []

                    this.AT_LEAST_ONE_SEP({
                        SEP: DotTok,
                        DEF: () => {
                            idents.push(this.CONSUME1(IdentTok).image)
                        }
                    })

                    this.CONSUME1(EOF)

                    return idents
                }
            }

            it("can CONSUME tokens with an index specifying the occurrence for the specific token in the current rule", () => {
                let parser: any = new Parser([], ALL_TOKENS, {
                    recoveryEnabled: true
                })
                parser.reset()
                let testInput = [
                    createTokenInstance(IntTok, "1"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(IntTok, "2"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(IntTok, "3")
                ]

                parser.input = testInput
                expect(parser.CONSUME4(IntTok)).to.equal(testInput[0])
                expect(parser.CONSUME2(PlusTok)).to.equal(testInput[1])
                expect(parser.CONSUME1(IntTok)).to.equal(testInput[2])
                expect(parser.CONSUME3(PlusTok)).to.equal(testInput[3])
                expect(parser.CONSUME1(IntTok)).to.equal(testInput[4])
                expect(tokenMatcher(parser.LA(1), EOF))
            })

            it("will not perform inRepetition recovery while in backtracking mode", () => {
                let parser: any = new Parser([], {})
                parser.isBackTrackingStack.push(1)
                expect(
                    parser.shouldInRepetitionRecoveryBeTried(MinusTok, 1)
                ).to.equal(false)
            })

            it("can perform in-repetition recovery for MANY grammar rule", () => {
                // a.b+.c
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ]
                let parser = new ManyRepetitionRecovery(input)
                expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
                expect(parser.errors.length).to.equal(1)
            })

            it("can disable in-repetition recovery for MANY grammar rule", () => {
                // a.b+.c
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ]
                let parser = new ManyRepetitionRecovery(input, false)
                expect(parser.qualifiedName()).to.deep.equal(["666"])
                expect(parser.errors.length).to.equal(1)
            })

            it("can perform in-repetition recovery for MANY_SEP grammar rule", () => {
                // a.b+.c
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ]
                let parser = new ManySepRepetitionRecovery(input)
                expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
                expect(parser.errors.length).to.equal(1)
            })

            it("can disable in-repetition recovery for MANY_SEP grammar rule", () => {
                // a.b+.c
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ]
                let parser = new ManySepRepetitionRecovery(input, false)
                expect(parser.qualifiedName()).to.deep.equal(["333"])
                expect(parser.errors.length).to.equal(1)
            })

            it("can perform in-repetition recovery for MANY_SEP grammar rule #2", () => {
                // a.b..c...d
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b")
                ]
                let parser = new ManySepSubRuleRepetitionRecovery(input)
                expect(parser.qualifiedName()).to.deep.equal(["a", "b"])
                expect(parser.errors.length).to.equal(2)
            })

            it("can perform in-repetition recovery for AT_LEAST_ONE grammar rule", () => {
                // a.b+.c
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ]
                let parser = new AtLeastOneRepetitionRecovery(input)
                expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
                expect(parser.errors.length).to.equal(1)
            })

            it("can disable in-repetition recovery for AT_LEAST_ONE grammar rule", () => {
                // a.b+.c
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ]
                let parser = new AtLeastOneRepetitionRecovery(input, false)
                expect(parser.qualifiedName()).to.deep.equal(["777"])
                expect(parser.errors.length).to.equal(1)
            })

            it("can perform in-repetition recovery for AT_LEAST_ONE_SEP grammar rule", () => {
                // a.b+.c
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ]
                let parser = new AtLeastOneSepRepetitionRecovery(input)
                expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
                expect(parser.errors.length).to.equal(1)
            })

            it("can disable in-repetition recovery for AT_LEAST_ONE_SEP grammar rule", () => {
                // a.b+.c
                let input = [
                    createTokenInstance(IdentTok, "a"),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "b"),
                    createTokenInstance(PlusTok),
                    createTokenInstance(DotTok),
                    createTokenInstance(IdentTok, "c")
                ]
                let parser = new AtLeastOneSepRepetitionRecovery(input, false)
                expect(parser.qualifiedName()).to.deep.equal(["999"])
                expect(parser.errors.length).to.equal(1)
            })

            it("can perform single Token insertion", () => {
                let A = createToken({ name: "A", pattern: /A/ })
                let B = createToken({ name: "B", pattern: /B/ })
                let C = createToken({ name: "C", pattern: /C/ })
                let allTokens = [A, B, C]

                let lexer = new Lexer(allTokens, {
                    positionTracking: "onlyOffset"
                })

                class SingleTokenInsertRegular extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, allTokens, {
                            recoveryEnabled: true
                        })
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public topRule = this.RULE("topRule", () => {
                        this.CONSUME(A)
                        let insertedToken = this.CONSUME(B)
                        this.CONSUME(C)

                        return insertedToken
                    })
                }

                let lexResult = lexer.tokenize("AC")
                let parser = new SingleTokenInsertRegular(lexResult.tokens)
                let insertedToken = parser.topRule()

                expect(insertedToken.isInsertedInRecovery).to.be.true
                expect(insertedToken.image).to.equal("")
                expect(insertedToken.startOffset).to.be.NaN
                expect(insertedToken.endOffset).to.be.NaN
                expect(insertedToken.startLine).to.be.NaN
                expect(insertedToken.endLine).to.be.NaN
                expect(insertedToken.startColumn).to.be.NaN
                expect(insertedToken.endColumn).to.be.NaN
            })
        })

        describe("The Parsing DSL methods are expressions", () => {
            it("OR will return the chosen alternative's grammar action's returned value", () => {
                class OrExpressionParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public or = this.RULE("or", () => {
                        return this.OR<number | string>([
                            {
                                ALT: () => {
                                    this.CONSUME1(MinusTok)
                                    return 666
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                    return "bamba"
                                }
                            }
                        ])
                    })
                }

                let parser = new OrExpressionParser([])

                parser.input = [createTokenInstance(MinusTok)]
                expect(parser.or()).to.equal(666)

                parser.input = [createTokenInstance(PlusTok)]
                expect(parser.or()).to.equal("bamba")
            })

            it("OPTION will return the grammar action value or undefined if the option was not taken", () => {
                class OptionExpressionParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public option = this.RULE("option", () => {
                        return this.OPTION(() => {
                            this.CONSUME(IdentTok)
                            return "bamba"
                        })
                    })
                }

                let parser = new OptionExpressionParser([])

                parser.input = [createTokenInstance(IdentTok)]
                expect(parser.option()).to.equal("bamba")

                parser.input = [createTokenInstance(IntTok)]
                expect(parser.option()).to.be.undefined
            })

            it("MANY will return an array of grammar action values", () => {
                let num = 0
                class ManyExpressionParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public many = this.RULE("many", () => {
                        return this.MANY(() => {
                            this.CONSUME(IntTok)
                            return num++
                        })
                    })
                }

                let parser = new ManyExpressionParser([])

                parser.input = [
                    createTokenInstance(IntTok),
                    createTokenInstance(IntTok),
                    createTokenInstance(IntTok)
                ]
                expect(parser.many()).to.deep.equal([0, 1, 2])

                parser.input = []
                expect(parser.many()).to.deep.equal([])
            })

            it("AT_LEAST_ONE will return an array of grammar action values", () => {
                class AtLeastOneExpressionParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public atLeastOne = this.RULE("atLeastOne", () => {
                        let num = 0
                        return this.AT_LEAST_ONE(() => {
                            this.CONSUME(IntTok)
                            num = num + 3
                            return num
                        })
                    })
                }

                let parser = new AtLeastOneExpressionParser([])

                parser.input = [
                    createTokenInstance(IntTok),
                    createTokenInstance(IntTok),
                    createTokenInstance(IntTok),
                    createTokenInstance(IntTok)
                ]
                expect(parser.atLeastOne()).to.deep.equal([3, 6, 9, 12])

                parser.input = [createTokenInstance(IntTok)]
                expect(parser.atLeastOne()).to.deep.equal([3])
            })

            it("MANY_SEP will return an array of grammar action values and an array of Separators", () => {
                class ManySepExpressionParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public manySep = this.RULE("manySep", () => {
                        let num = 0
                        return this.MANY_SEP({
                            SEP: PlusTok,
                            DEF: () => {
                                this.CONSUME(IntTok)
                                return num++
                            }
                        })
                    })
                }

                let parser = new ManySepExpressionParser([])

                let separator1 = createTokenInstance(PlusTok)
                let separator2 = createTokenInstance(PlusTok)
                parser.input = [
                    createTokenInstance(IntTok),
                    separator1,
                    createTokenInstance(IntTok),
                    separator2,
                    createTokenInstance(IntTok)
                ]
                expect(parser.manySep()).to.deep.equal({
                    values: [0, 1, 2],
                    separators: [separator1, separator2]
                })

                parser.input = []
                expect(parser.manySep()).to.deep.equal({
                    values: [],
                    separators: []
                })
            })

            it("AT_LEAST_ONE_SEP will return an array of grammar action values and an array of Separators", () => {
                class AtLeastOneSepExpressionParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)
                        ;(<any>Parser).performSelfAnalysis(this)
                    }

                    public atLeastOneSep = this.RULE("atLeastOneSep", () => {
                        let num = 0
                        return this.AT_LEAST_ONE_SEP({
                            SEP: PlusTok,
                            DEF: () => {
                                this.CONSUME(IntTok)
                                num = num + 3
                                return num
                            }
                        })
                    })
                }

                let parser = new AtLeastOneSepExpressionParser([])

                let separator1 = createTokenInstance(PlusTok)
                let separator2 = createTokenInstance(PlusTok)
                parser.input = [
                    createTokenInstance(IntTok),
                    separator1,
                    createTokenInstance(IntTok),
                    separator2,
                    createTokenInstance(IntTok)
                ]
                expect(parser.atLeastOneSep()).to.deep.equal({
                    values: [3, 6, 9],
                    separators: [separator1, separator2]
                })

                parser.input = [createTokenInstance(IntTok)]
                expect(parser.atLeastOneSep()).to.deep.equal({
                    values: [3],
                    separators: []
                })
            })
        })

        describe("The BaseRecognizer", () => {
            it("can be initialized without supplying an input vector", () => {
                let parser = new Parser([], [])
                expect(parser.input).to.deep.equal([])
                expect(parser.input).to.be.an.instanceof(Array)
            })

            it("can only SAVE_ERROR for recognition exceptions", () => {
                let parser: any = new Parser([], [])
                expect(() =>
                    parser.SAVE_ERROR(new Error("I am some random Error"))
                ).to.throw(
                    "Trying to save an Error which is not a RecognitionException"
                )
                expect(parser.input).to.be.an.instanceof(Array)
            })

            it("when it runs out of input EOF will be returned", () => {
                let parser: any = new Parser(
                    [
                        createTokenInstance(IntTok, "1"),
                        createTokenInstance(PlusTok)
                    ],
                    [IntTok, PlusTok]
                )
                parser.CONSUME(IntTok)
                parser.CONSUME(PlusTok)
                expect(tokenMatcher(parser.LA(1), EOF))
                expect(tokenMatcher(parser.LA(1), EOF))
                expect(tokenMatcher(parser.SKIP_TOKEN(), EOF))
                expect(tokenMatcher(parser.SKIP_TOKEN(), EOF))
                // and we can go on and on and on... this avoid returning null/undefined
                // see: http://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions
            })

            it("invoking an OPTION will return the inner grammar action's value or undefined", () => {
                class OptionsReturnValueParser extends Parser {
                    constructor(
                        input: Token[] = [createTokenInstance(IntTok, "666")]
                    ) {
                        super(input, ALL_TOKENS)
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public trueOptionRule = this.RULE("trueOptionRule", () => {
                        return this.OPTION({
                            GATE: () => true,
                            DEF: () => {
                                this.CONSUME(IntTok)
                                return true
                            }
                        })
                    })

                    public falseOptionRule = this.RULE(
                        "falseOptionRule",
                        () => {
                            return this.OPTION({
                                GATE: () => false,
                                DEF: () => {
                                    this.CONSUME(IntTok)
                                    return false
                                }
                            })
                        }
                    )
                }

                let successfulOption = new OptionsReturnValueParser().trueOptionRule()
                expect(successfulOption).to.equal(true)

                let failedOption = new OptionsReturnValueParser().falseOptionRule()
                expect(failedOption).to.equal(undefined)
            })

            it("will return false if a RecognitionException is thrown during backtracking and rethrow any other kind of Exception", () => {
                let parser: any = new Parser([], [])
                let backTrackingThrows = parser.BACKTRACK(
                    () => {
                        throw new Error("division by zero, boom")
                    },
                    () => {
                        return true
                    }
                )
                expect(() => backTrackingThrows.call(parser)).to.throw(
                    "division by zero, boom"
                )

                let throwsRecogError = () => {
                    throw new exceptions.NotAllInputParsedException(
                        "sad sad panda",
                        createTokenInstance(PlusTok)
                    )
                }
                let backTrackingFalse = parser.BACKTRACK(
                    throwsRecogError,
                    () => {
                        return true
                    }
                )
                expect(backTrackingFalse.call(parser)).to.equal(false)
            })
        })

        describe("The BaseRecognizer", () => {
            it("Will throw an error is performSelfAnalysis is called before all the rules have been defined", () => {
                class WrongOrderOfSelfAnalysisParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS)

                        this.RULE("goodRule", () => {
                            this.CONSUME(IntTok)
                        })
                        ;(Parser as any).performSelfAnalysis(this)

                        this.RULE("badRule", () => {
                            this.CONSUME(IntTok)
                        })
                    }
                }

                expect(() => new WrongOrderOfSelfAnalysisParser()).to.throw(
                    "Grammar rule <badRule> may not be defined after the 'performSelfAnalysis' method has been called"
                )
            })

            it("can be initialized with a vector of Tokens", () => {
                let parser: any = new Parser([], [PlusTok, MinusTok, IntTok])
                let tokensMap = (<any>parser).tokensMap
                expect(tokensMap.PlusTok).to.equal(PlusTok)
                expect(tokensMap.MinusTok).to.equal(MinusTok)
                expect(tokensMap.IntTok).to.equal(IntTok)
            })

            it("can be initialized with a Dictionary of Tokens", () => {
                let initTokenDictionary = {
                    PlusTok: PlusTok,
                    MinusTok: MinusTok,
                    IntToken: IntTok
                }
                let parser: any = new Parser([], {
                    PlusTok: PlusTok,
                    MinusTok: MinusTok,
                    IntToken: IntTok
                })
                let tokensMap = (<any>parser).tokensMap
                // the implementation should clone the dictionary to avoid bugs caused by mutability
                expect(tokensMap).not.to.equal(initTokenDictionary)
                expect(tokensMap.PlusTok).to.equal(PlusTok)
                expect(tokensMap.MinusTok).to.equal(MinusTok)
                expect(tokensMap.IntToken).to.equal(IntTok)
            })

            it("can be initialized with a IMultiModeLexerDefinition of Tokens", () => {
                let multiModeLexerDef: IMultiModeLexerDefinition = {
                    modes: {
                        bamba: [PlusTok],
                        bisli: [MinusTok, IntTok]
                    },
                    defaultMode: "bisli"
                }
                let parser: any = new Parser([], multiModeLexerDef)
                let tokensMap = (<any>parser).tokensMap
                // the implementation should clone the dictionary to avoid bugs caused by mutability
                expect(tokensMap).not.to.equal(multiModeLexerDef)
                expect(tokensMap.PlusTok).to.equal(PlusTok)
                expect(tokensMap.MinusTok).to.equal(MinusTok)
                expect(tokensMap.IntTok).to.equal(IntTok)
            })

            it("cannot be initialized with other parameters", () => {
                expect(() => {
                    return new Parser([], null)
                }).to.throw()

                expect(() => {
                    return new Parser([], <any>666)
                }).to.throw()

                expect(() => {
                    return new Parser([], <any>"woof woof")
                }).to.throw()
            })

            it("will not swallow none Recognizer errors when attempting 'in rule error recovery'", () => {
                class InRuleParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS, {
                            recoveryEnabled: true
                        })
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public someRule = this.RULE("someRule", () => {
                        this.CONSUME1(DotTok)
                    })
                }
                let parser: any = new InRuleParser([
                    createTokenInstance(IntTok, "1")
                ])
                parser.tryInRuleRecovery = () => {
                    throw Error("oops")
                }
                expect(() => parser.someRule()).to.throw("oops")
            })

            it("will not swallow none Recognizer errors during Token consumption", () => {
                class InRuleParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS, {
                            recoveryEnabled: true
                        })
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public someRule = this.RULE("someRule", () => {
                        this.CONSUME1(DotTok)
                    })
                }
                let parser: any = new InRuleParser([
                    createTokenInstance(IntTok, "1")
                ])
                ;(parser as any).consumeInternal = () => {
                    throw Error("oops")
                }
                expect(() => parser.someRule()).to.throw("oops")
            })

            it("will rethrow none Recognizer errors during Token consumption - recovery disabled + nested rule", () => {
                class InRuleParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, ALL_TOKENS, {
                            recoveryEnabled: true
                        })
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public someRule = this.RULE("someRule", () => {
                        expect(() =>
                            this.SUBRULE(this.someNestedRule)
                        ).to.throw("Expecting token of type --> DotTok <--")
                    })

                    public someNestedRule = this.RULE(
                        "someNestedRule",
                        () => {
                            this.CONSUME1(DotTok)
                            this.CONSUME1(IdentTok)
                        },
                        {
                            resyncEnabled: false
                        }
                    )
                }
                let parser: any = new InRuleParser([
                    createTokenInstance(IntTok, "1")
                ])
                parser.someRule()
            })

            it("Will use Token LABELS for mismatch error messages when available", () => {
                class LabelTokParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.CONSUME1(PlusTok)
                    })
                }

                let parser = new LabelTokParser([createTokenInstance(MinusTok)])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(
                    MismatchedTokenException
                )
                expect(parser.errors[0].message).to.include("+")
                expect(parser.errors[0].message).to.not.include("token of type")
            })

            it("Will not use Token LABELS for mismatch error messages when unavailable", () => {
                class NoLabelTokParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.CONSUME1(MinusTok)
                    })
                }

                let parser = new NoLabelTokParser([
                    createTokenInstance(PlusTok)
                ])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(
                    MismatchedTokenException
                )
                expect(parser.errors[0].message).to.include("MinusTok")
                expect(parser.errors[0].message).to.include("token of type")
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ])
            })

            it("Will use Token LABELS for noViableAlt error messages when unavailable", () => {
                class LabelAltParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.OR([
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(MinusTok)
                                }
                            }
                        ])
                    })
                }

                let parser = new LabelAltParser([])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(
                    NoViableAltException
                )
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ])
                expect(parser.errors[0].message).to.include("MinusTok")
                expect(parser.errors[0].message).to.include("+")
                expect(parser.errors[0].message).to.not.include("PlusTok")
            })

            it("Will use Token LABELS for noViableAlt error messages when unavailable - nestedRuleNames", () => {
                class LabelAltParserNested extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok], {
                            outputCst: true
                        })
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.OR({
                            NAME: "$bamba",
                            DEF: [
                                {
                                    ALT: () => {
                                        this.CONSUME1(PlusTok)
                                    }
                                },
                                {
                                    ALT: () => {
                                        this.CONSUME1(MinusTok)
                                    }
                                }
                            ]
                        })
                    })
                }

                let parser = new LabelAltParserNested([])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(
                    NoViableAltException
                )
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ])
                expect(parser.errors[0].message).to.include("MinusTok")
                expect(parser.errors[0].message).to.include("+")
                expect(parser.errors[0].message).to.not.include("PlusTok")
            })

            it("Supports custom error messages for OR", () => {
                class LabelAltParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.OR({
                            DEF: [
                                {
                                    ALT: () => {
                                        this.CONSUME1(PlusTok)
                                    }
                                },
                                {
                                    ALT: () => {
                                        this.CONSUME1(MinusTok)
                                    }
                                }
                            ],
                            ERR_MSG: "bisli"
                        })
                    })
                }

                let parser = new LabelAltParser([])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(
                    NoViableAltException
                )
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ])
                expect(parser.errors[0].message).to.include("bisli")
            })

            it("Will include the ruleStack in a recognition Exception", () => {
                class NestedRulesParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.OPTION({
                            DEF: () => {
                                this.SUBRULE1(this.rule2)
                            }
                        })
                    })

                    public rule2 = this.RULE("rule2", () => {
                        this.OPTION(() => {
                            this.SUBRULE5(this.rule3)
                        })
                    })

                    public rule3 = this.RULE("rule3", () => {
                        this.CONSUME1(MinusTok)
                        this.CONSUME1(PlusTok)
                    })
                }

                let parser = new NestedRulesParser([
                    createTokenInstance(MinusTok),
                    createTokenInstance(MinusTok)
                ])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(
                    MismatchedTokenException
                )
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule",
                    "rule2",
                    "rule3"
                ])
                expect(
                    parser.errors[0].context.ruleOccurrenceStack
                ).to.deep.equal([1, 1, 5])
            })

            it("Will build an error message for AT_LEAST_ONE automatically", () => {
                class ImplicitAtLeastOneErrParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.AT_LEAST_ONE(() => {
                            this.SUBRULE(this.rule2)
                        })
                    })

                    public rule2 = this.RULE("rule2", () => {
                        this.OR([
                            {
                                ALT: () => {
                                    this.CONSUME1(MinusTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                }
                            }
                        ])
                    })
                }

                let parser = new ImplicitAtLeastOneErrParser([
                    createTokenInstance(IntTok, "666"),
                    createTokenInstance(MinusTok),
                    createTokenInstance(MinusTok)
                ])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(EarlyExitException)
                expect(parser.errors[0].message).to.contain(
                    "expecting at least one iteration"
                )
                expect(parser.errors[0].message).to.contain("MinusTok")
                expect(parser.errors[0].message).to.contain("+")
                expect(parser.errors[0].message).to.contain("but found: '666'")
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ])
            })

            it("supports custom error messages for AT_LEAST_ONE", () => {
                class ExplicitAtLeastOneErrParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.AT_LEAST_ONE({
                            DEF: () => {
                                this.SUBRULE(this.rule2)
                            },
                            ERR_MSG: "bamba"
                        })
                    })

                    public rule2 = this.RULE("rule2", () => {
                        this.OR([
                            {
                                ALT: () => {
                                    this.CONSUME1(MinusTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                }
                            }
                        ])
                    })
                }

                let parser = new ExplicitAtLeastOneErrParser([
                    createTokenInstance(IntTok, "666"),
                    createTokenInstance(MinusTok),
                    createTokenInstance(MinusTok)
                ])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(EarlyExitException)
                expect(parser.errors[0].message).to.contain("bamba")
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ])
            })

            it("Will build an error message for AT_LEAST_ONE_SEP automatically", () => {
                class ImplicitAtLeastOneSepErrParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok, IdentTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.AT_LEAST_ONE_SEP({
                            SEP: IdentTok,
                            DEF: () => {
                                this.SUBRULE(this.rule2)
                            }
                        })
                    })

                    public rule2 = this.RULE("rule2", () => {
                        this.OR([
                            {
                                ALT: () => {
                                    this.CONSUME1(MinusTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                }
                            }
                        ])
                    })
                }

                let parser = new ImplicitAtLeastOneSepErrParser([
                    createTokenInstance(IntTok, "666"),
                    createTokenInstance(MinusTok),
                    createTokenInstance(MinusTok)
                ])
                parser.rule()
                expect(parser.errors[0]).to.be.an.instanceof(EarlyExitException)
                expect(parser.errors[0].message).to.contain(
                    "expecting at least one iteration"
                )
                expect(parser.errors[0].message).to.contain("MinusTok")
                expect(parser.errors[0].message).to.contain("+")
                expect(parser.errors[0].message).to.contain("but found: '666'")
                expect(parser.errors[0].context.ruleStack).to.deep.equal([
                    "rule"
                ])
                expect(
                    parser.errors[0].context.ruleOccurrenceStack
                ).to.deep.equal([1])
            })

            it("can serialize a Grammar's Structure", () => {
                class SomeParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok, IdentTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public rule = this.RULE("rule", () => {
                        this.AT_LEAST_ONE_SEP({
                            SEP: IdentTok,
                            DEF: () => {
                                this.SUBRULE(this.rule2)
                            }
                        })
                    })

                    public rule2 = this.RULE("rule2", () => {
                        this.OR([
                            {
                                ALT: () => {
                                    this.CONSUME1(MinusTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                }
                            }
                        ])
                    })
                }

                let parser = new SomeParser([])
                let serializedGrammar = parser.getSerializedGastProductions()
                // not bothering with more in-depth checks as those unit tests exist elsewhere
                expect(serializedGrammar).to.have.lengthOf(2)
                expect(serializedGrammar[0].type).to.equal("Rule")
                expect(serializedGrammar[1].type).to.equal("Rule")
            })

            it("can provide syntactic content assist suggestions", () => {
                class ContentAssistParser extends Parser {
                    constructor(input: Token[] = []) {
                        super(input, [PlusTok, MinusTok, IdentTok])
                        ;(Parser as any).performSelfAnalysis(this)
                    }

                    public topRule = this.RULE("topRule", () => {
                        this.MANY(() => {
                            this.SUBRULE4(this.rule2)
                        })
                    })

                    public rule2 = this.RULE("rule2", () => {
                        this.OR([
                            {
                                ALT: () => {
                                    this.CONSUME1(MinusTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME3(PlusTok)
                                }
                            }
                        ])
                    })
                }

                let parser = new ContentAssistParser([])
                setEquality(parser.computeContentAssist("topRule", []), [
                    {
                        nextTokenType: MinusTok,
                        nextTokenOccurrence: 1,
                        ruleStack: ["topRule", "rule2"],
                        occurrenceStack: [1, 4]
                    },
                    {
                        nextTokenType: PlusTok,
                        nextTokenOccurrence: 3,
                        ruleStack: ["topRule", "rule2"],
                        occurrenceStack: [1, 4]
                    }
                ])

                setEquality(
                    parser.computeContentAssist("topRule", [
                        createTokenInstance(MinusTok)
                    ]),
                    [
                        {
                            nextTokenType: MinusTok,
                            nextTokenOccurrence: 1,
                            ruleStack: ["topRule", "rule2"],
                            occurrenceStack: [1, 4]
                        },
                        {
                            nextTokenType: PlusTok,
                            nextTokenOccurrence: 3,
                            ruleStack: ["topRule", "rule2"],
                            occurrenceStack: [1, 4]
                        }
                    ]
                )

                expect(() =>
                    parser.computeContentAssist("invalid_rule_name", [])
                ).to.throw("does not exist in this grammar")
            })
        })

        after(() => {
            clearCache()
        })
    })
}

defineRecognizerSpecs(
    "Regular Tokens Mode",
    createToken,
    createRegularToken,
    tokenStructuredMatcher
)
