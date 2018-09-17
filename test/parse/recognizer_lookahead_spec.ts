import { createToken } from "../../src/scan/tokens_public"
import { Parser } from "../../src/parse/parser_public"
import { tokenStructuredMatcher } from "../../src/scan/tokens"
import { createRegularToken } from "../utils/matchers"
import { IToken } from "../../api"
import { isES2015MapSupported } from "../../src/utils/utils"

function defineLookaheadSpecs(
    contextName,
    createToken,
    createTokenInstance,
    tokenMatcher
) {
    context("lookahead " + contextName, () => {
        let OneTok = createToken({ name: "OneTok" })
        let TwoTok = createToken({ name: "TwoTok" })
        let ThreeTok = createToken({ name: "ThreeTok" })
        let FourTok = createToken({ name: "FourTok" })
        let FiveTok = createToken({ name: "FiveTok" })
        let SixTok = createToken({ name: "SixTok" })
        let SevenTok = createToken({ name: "SevenTok" })
        let EightTok = createToken({ name: "EightTok" })
        let NineTok = createToken({ name: "NineTok" })
        let Comma = createToken({ name: "Comma" })

        const ALL_TOKENS = [
            OneTok,
            TwoTok,
            ThreeTok,
            FourTok,
            FiveTok,
            SixTok,
            SevenTok,
            EightTok,
            NineTok,
            Comma
        ]

        describe("The implicit lookahead calculation functionality of the Recognizer For OPTION", () => {
            class OptionsImplicitLookAheadParser extends Parser {
                public getLookAheadCacheSize(): number {
                    if (isES2015MapSupported()) {
                        // @ts-ignore
                        return this.lookAheadFuncsCache.size
                    } else {
                        // @ts-ignore
                        return Object.keys(this.lookAheadFuncsCache).length
                    }
                }

                constructor(input: IToken[] = []) {
                    super(input, ALL_TOKENS)
                    this.performSelfAnalysis()
                }

                public manyOptionsRule = this.RULE(
                    "manyOptionsRule",
                    this.parseManyOptionsRule
                )

                private parseManyOptionsRule(): string {
                    let total = ""

                    this.OPTION8(() => {
                        this.CONSUME1(OneTok)
                        total += "1"
                    })

                    this.OPTION9(() => {
                        this.CONSUME1(TwoTok)
                        total += "2"
                    })

                    this.OPTION3(() => {
                        this.CONSUME1(ThreeTok)
                        total += "3"
                    })

                    this.OPTION4(() => {
                        this.CONSUME1(FourTok)
                        total += "4"
                    })

                    this.OPTION5(() => {
                        this.CONSUME1(FiveTok)
                        total += "5"
                    })

                    return total
                }
            }

            it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", () => {
                let parser = new OptionsImplicitLookAheadParser([])
                expect(parser.getLookAheadCacheSize()).to.equal(0)
            })

            it("can automatically compute lookahead for OPTION1", () => {
                let input = [createTokenInstance(OneTok)]
                let parser = new OptionsImplicitLookAheadParser(input)
                expect(parser.manyOptionsRule()).to.equal("1")
            })

            it("can automatically compute lookahead for OPTION2", () => {
                let input = [createTokenInstance(TwoTok)]
                let parser = new OptionsImplicitLookAheadParser(input)
                expect(parser.manyOptionsRule()).to.equal("2")
            })

            it("can automatically compute lookahead for OPTION3", () => {
                let input = [createTokenInstance(ThreeTok)]
                let parser = new OptionsImplicitLookAheadParser(input)
                expect(parser.manyOptionsRule()).to.equal("3")
            })

            it("can automatically compute lookahead for OPTION4", () => {
                let input = [createTokenInstance(FourTok)]
                let parser = new OptionsImplicitLookAheadParser(input)
                expect(parser.manyOptionsRule()).to.equal("4")
            })

            it("can automatically compute lookahead for OPTION5", () => {
                let input = [createTokenInstance(FiveTok)]
                let parser = new OptionsImplicitLookAheadParser(input)
                expect(parser.manyOptionsRule()).to.equal("5")
            })
        })

        describe("The implicit lookahead calculation functionality of the Recognizer For MANY", () => {
            class ManyImplicitLookAheadParser extends Parser {
                public getLookAheadCacheSize(): number {
                    if (isES2015MapSupported()) {
                        // @ts-ignore
                        return this.lookAheadFuncsCache.size
                    } else {
                        // @ts-ignore
                        return Object.keys(this.lookAheadFuncsCache).length
                    }
                }

                constructor(input: IToken[] = []) {
                    super(input, ALL_TOKENS)
                    this.performSelfAnalysis()
                }

                public manyRule = this.RULE("manyRule", this.parseManyRule)

                private parseManyRule(): string {
                    let total = ""

                    this.MANY1(() => {
                        this.CONSUME1(OneTok)
                        total += "1"
                    })

                    this.MANY2(() => {
                        this.CONSUME1(TwoTok)
                        total += "2"
                    })

                    this.MANY3(() => {
                        this.CONSUME1(ThreeTok)
                        total += "3"
                    })

                    this.MANY4(() => {
                        this.CONSUME1(FourTok)
                        total += "4"
                    })

                    this.MANY5(() => {
                        this.CONSUME1(FiveTok)
                        total += "5"
                    })

                    this.MANY6(() => {
                        this.CONSUME1(SixTok)
                        total += "6"
                    })

                    this.MANY7(() => {
                        this.CONSUME1(SevenTok)
                        total += "7"
                    })

                    this.MANY8(() => {
                        this.CONSUME1(EightTok)
                        total += "8"
                    })

                    this.MANY9(() => {
                        this.CONSUME1(NineTok)
                        total += "9"
                    })

                    return total
                }
            }

            it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", () => {
                let parser = new ManyImplicitLookAheadParser()
                expect(parser.getLookAheadCacheSize()).to.equal(0)
            })

            it("can automatically compute lookahead for MANY1", () => {
                let input = [createTokenInstance(OneTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("1")
            })

            it("can automatically compute lookahead for MANY2", () => {
                let input = [createTokenInstance(TwoTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("2")
            })

            it("can automatically compute lookahead for MANY3", () => {
                let input = [createTokenInstance(ThreeTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("3")
            })

            it("can automatically compute lookahead for MANY4", () => {
                let input = [createTokenInstance(FourTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("4")
            })

            it("can automatically compute lookahead for MANY5", () => {
                let input = [createTokenInstance(FiveTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("5")
            })

            it("can automatically compute lookahead for MANY6", () => {
                let input = [createTokenInstance(SixTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("6")
            })

            it("can automatically compute lookahead for MANY7", () => {
                let input = [createTokenInstance(SevenTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("7")
            })

            it("can automatically compute lookahead for MANY8", () => {
                let input = [createTokenInstance(EightTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("8")
            })

            it("can automatically compute lookahead for MANY9", () => {
                let input = [createTokenInstance(NineTok)]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("9")
            })

            it("can accept lookahead function param for flow mixing several MANYs", () => {
                let input = [
                    createTokenInstance(OneTok),
                    createTokenInstance(OneTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(FiveTok)
                ]
                let parser = new ManyImplicitLookAheadParser(input)
                expect(parser.manyRule()).to.equal("113335")
            })
        })

        describe("The implicit lookahead calculation functionality of the Recognizer For MANY_SEP", () => {
            class ManySepImplicitLookAheadParser extends Parser {
                public getLookAheadCacheSize(): number {
                    if (isES2015MapSupported()) {
                        // @ts-ignore
                        return this.lookAheadFuncsCache.size
                    } else {
                        // @ts-ignore
                        return Object.keys(this.lookAheadFuncsCache).length
                    }
                }

                constructor(input: IToken[] = []) {
                    super(input, ALL_TOKENS)
                    this.performSelfAnalysis()
                }

                public manySepRule = this.RULE(
                    "manySepRule",
                    this.parseManyRule
                )

                private parseManyRule(): any {
                    let total = ""
                    let separators = []

                    separators = separators.concat(
                        this.MANY_SEP1({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(OneTok)
                                total += "1"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.MANY_SEP2({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(TwoTok)
                                total += "2"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.MANY_SEP3({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(ThreeTok)
                                total += "3"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.MANY_SEP4({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(FourTok)
                                total += "4"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.MANY_SEP5({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(FiveTok)
                                total += "5"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.MANY_SEP6({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(SixTok)
                                total += "6"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.MANY_SEP7({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(SevenTok)
                                total += "7"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.MANY_SEP8({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(EightTok)
                                total += "8"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.MANY_SEP9({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(NineTok)
                                total += "9"
                            }
                        }).separators
                    )

                    return {
                        total: total,
                        separators: separators
                    }
                }
            }

            it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", () => {
                let parser = new ManySepImplicitLookAheadParser()
                expect(parser.getLookAheadCacheSize()).to.equal(0)
            })

            it("can automatically compute lookahead for MANY_SEP1", () => {
                let input = [createTokenInstance(OneTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("1")
            })

            it("can automatically compute lookahead for MANY_SEP2", () => {
                let input = [createTokenInstance(TwoTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("2")
            })

            it("can automatically compute lookahead for MANY_SEP3", () => {
                let input = [createTokenInstance(ThreeTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("3")
            })

            it("can automatically compute lookahead for MANY_SEP4", () => {
                let input = [createTokenInstance(FourTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("4")
            })

            it("can automatically compute lookahead for MANY_SEP5", () => {
                let input = [createTokenInstance(FiveTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("5")
            })

            it("can automatically compute lookahead for MANY_SEP6", () => {
                let input = [createTokenInstance(SixTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("6")
            })

            it("can automatically compute lookahead for MANY_SEP7", () => {
                let input = [createTokenInstance(SevenTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("7")
            })

            it("can automatically compute lookahead for MANY_SEP8", () => {
                let input = [createTokenInstance(EightTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("8")
            })

            it("can automatically compute lookahead for MANY_SEP9", () => {
                let input = [createTokenInstance(NineTok)]
                let parser = new ManySepImplicitLookAheadParser(input)
                expect(parser.manySepRule().total).to.equal("9")
            })

            it("can accept lookahead function param for flow mixing several MANY_SEPs", () => {
                let input = [
                    createTokenInstance(OneTok),
                    createTokenInstance(Comma),
                    createTokenInstance(OneTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(Comma),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(Comma),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(FiveTok)
                ]
                let parser = new ManySepImplicitLookAheadParser(input)
                let result = parser.manySepRule()
                expect(result.total).to.equal("113335")
                expect(result.separators).to.have.length(3)
                expect(result.separators).to.deep.equal([
                    createTokenInstance(Comma),
                    createTokenInstance(Comma),
                    createTokenInstance(Comma)
                ])
            })
        })

        describe("The implicit lookahead calculation functionality of the Recognizer For AT_LEAST_ONE", () => {
            class AtLeastOneImplicitLookAheadParser extends Parser {
                public getLookAheadCacheSize(): number {
                    if (isES2015MapSupported()) {
                        // @ts-ignore
                        return this.lookAheadFuncsCache.size
                    } else {
                        // @ts-ignore
                        return Object.keys(this.lookAheadFuncsCache).length
                    }
                }

                constructor(input: IToken[] = []) {
                    super(input, ALL_TOKENS)
                    this.performSelfAnalysis()
                }

                public atLeastOneRule = this.RULE(
                    "atLeastOneRule",
                    this.parseAtLeastOneRule,
                    {
                        recoveryValueFunc: () => {
                            return "-666"
                        }
                    }
                )

                private parseAtLeastOneRule(): string {
                    let total = ""

                    this.AT_LEAST_ONE1(() => {
                        this.CONSUME1(OneTok)
                        total += "1"
                    })

                    this.AT_LEAST_ONE2(() => {
                        this.CONSUME1(TwoTok)
                        total += "2"
                    })

                    this.AT_LEAST_ONE3(() => {
                        this.CONSUME1(ThreeTok)
                        total += "3"
                    })

                    this.AT_LEAST_ONE4(() => {
                        this.CONSUME1(FourTok)
                        total += "4"
                    })

                    this.AT_LEAST_ONE5(() => {
                        this.CONSUME1(FiveTok)
                        total += "5"
                    })

                    this.AT_LEAST_ONE6(() => {
                        this.CONSUME1(SixTok)
                        total += "6"
                    })

                    this.AT_LEAST_ONE7(() => {
                        this.CONSUME1(SevenTok)
                        total += "7"
                    })

                    this.AT_LEAST_ONE8(() => {
                        this.CONSUME1(EightTok)
                        total += "8"
                    })

                    this.AT_LEAST_ONE9(() => {
                        this.CONSUME1(NineTok)
                        total += "9"
                    })

                    return total
                }
            }

            it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", () => {
                let parser = new AtLeastOneImplicitLookAheadParser()
                expect(parser.getLookAheadCacheSize()).to.equal(0)
            })

            it("can accept lookahead function param for AT_LEAST_ONE", () => {
                let input = [
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(FourTok),
                    createTokenInstance(FourTok),
                    createTokenInstance(FiveTok),
                    createTokenInstance(SixTok),
                    createTokenInstance(SevenTok),
                    createTokenInstance(EightTok),
                    createTokenInstance(EightTok),
                    createTokenInstance(EightTok),
                    createTokenInstance(NineTok)
                ]
                let parser = new AtLeastOneImplicitLookAheadParser(input)
                expect(parser.atLeastOneRule()).to.equal("1223445678889")
            })

            it("will fail when zero occurrences of AT_LEAST_ONE in input", () => {
                let input = [
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok) /*createToken(ThreeTok),*/,
                    createTokenInstance(FourTok),
                    createTokenInstance(FiveTok)
                ]
                let parser = new AtLeastOneImplicitLookAheadParser(input)
                expect(parser.atLeastOneRule()).to.equal("-666")
            })
        })

        describe("The implicit lookahead calculation functionality of the Recognizer For AT_LEAST_ONE_SEP", () => {
            class AtLeastOneSepImplicitLookAheadParser extends Parser {
                public getLookAheadCacheSize(): number {
                    if (isES2015MapSupported()) {
                        // @ts-ignore
                        return this.lookAheadFuncsCache.size
                    } else {
                        // @ts-ignore
                        return Object.keys(this.lookAheadFuncsCache).length
                    }
                }

                constructor(input: IToken[] = []) {
                    super(input, ALL_TOKENS)
                    this.performSelfAnalysis()
                }

                public atLeastOneSepRule = this.RULE(
                    "atLeastOneSepRule",
                    this.parseAtLeastOneRule,
                    {
                        recoveryValueFunc: () => {
                            return {
                                total: "-666",
                                separators: []
                            }
                        }
                    }
                )

                private parseAtLeastOneRule(): any {
                    let total = ""
                    let separators = []

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP1({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(OneTok)
                                total += "1"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP2({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(TwoTok)
                                total += "2"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP3({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(ThreeTok)
                                total += "3"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP4({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(FourTok)
                                total += "4"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP5({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(FiveTok)
                                total += "5"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP6({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(SixTok)
                                total += "6"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP7({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(SevenTok)
                                total += "7"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP8({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(EightTok)
                                total += "8"
                            }
                        }).separators
                    )

                    separators = separators.concat(
                        this.AT_LEAST_ONE_SEP9({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(NineTok)
                                total += "9"
                            }
                        }).separators
                    )

                    return {
                        total: total,
                        separators: separators
                    }
                }
            }

            it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", () => {
                let parser = new AtLeastOneSepImplicitLookAheadParser()
                expect(parser.getLookAheadCacheSize()).to.equal(0)
            })

            it("can accept lookahead function param for AT_LEAST_ONE_SEP", () => {
                let input = [
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(Comma),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(FourTok),
                    createTokenInstance(Comma),
                    createTokenInstance(FourTok),
                    createTokenInstance(FiveTok),
                    createTokenInstance(SixTok),
                    createTokenInstance(SevenTok),
                    createTokenInstance(Comma),
                    createTokenInstance(SevenTok),
                    createTokenInstance(Comma),
                    createTokenInstance(SevenTok),
                    createTokenInstance(EightTok),
                    createTokenInstance(NineTok)
                ]
                let parser = new AtLeastOneSepImplicitLookAheadParser(input)
                let parseResult = parser.atLeastOneSepRule()
                expect(parseResult.total).to.equal("1223445677789")
                expect(parseResult.separators).to.deep.equal([
                    createTokenInstance(Comma),
                    createTokenInstance(Comma),
                    createTokenInstance(Comma),
                    createTokenInstance(Comma)
                ])
            })

            it("will fail when zero occurrences of AT_LEAST_ONE_SEP in input", () => {
                let input = [
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    /*createToken(ThreeTok),*/ createTokenInstance(FourTok),
                    createTokenInstance(FiveTok)
                ]
                let parser = new AtLeastOneSepImplicitLookAheadParser(input)
                expect(parser.atLeastOneSepRule().total).to.equal("-666")
            })
        })

        describe("The implicit lookahead calculation functionality of the Recognizer For OR", () => {
            class OrImplicitLookAheadParser extends Parser {
                public getLookAheadCacheSize(): number {
                    if (isES2015MapSupported()) {
                        // @ts-ignore
                        return this.lookAheadFuncsCache.size
                    } else {
                        // @ts-ignore
                        return Object.keys(this.lookAheadFuncsCache).length
                    }
                }

                constructor(input: IToken[] = []) {
                    super(input, ALL_TOKENS)
                    this.performSelfAnalysis()
                }

                public orRule = this.RULE("orRule", this.parseOrRule, {
                    recoveryValueFunc: () => "-666"
                })

                private parseOrRule(): string {
                    let total = ""

                    this.OR8([
                        {
                            ALT: () => {
                                this.CONSUME1(OneTok)
                                total += "A1"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME1(TwoTok)
                                total += "A2"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME1(ThreeTok)
                                total += "A3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME1(FourTok)
                                total += "A4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME1(FiveTok)
                                total += "A5"
                            }
                        }
                    ])

                    this.OR2([
                        {
                            ALT: () => {
                                this.CONSUME2(OneTok)
                                total += "B1"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(FourTok)
                                total += "B4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(ThreeTok)
                                total += "B3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(TwoTok)
                                total += "B2"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(FiveTok)
                                total += "B5"
                            }
                        }
                    ])

                    this.OR3([
                        {
                            ALT: () => {
                                this.CONSUME3(TwoTok)
                                total += "C2"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME3(FourTok)
                                total += "C4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME3(ThreeTok)
                                total += "C3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME3(FiveTok)
                                total += "C5"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME3(OneTok)
                                total += "C1"
                            }
                        }
                    ])

                    this.OR4([
                        {
                            ALT: () => {
                                this.CONSUME4(OneTok)
                                total += "D1"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME4(ThreeTok)
                                total += "D3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME4(FourTok)
                                total += "D4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME4(TwoTok)
                                total += "D2"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME4(FiveTok)
                                total += "D5"
                            }
                        }
                    ])

                    this.OR5([
                        {
                            ALT: () => {
                                this.CONSUME5(TwoTok)
                                total += "E2"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME5(OneTok)
                                total += "E1"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME5(FourTok)
                                total += "E4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME5(ThreeTok)
                                total += "E3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME5(FiveTok)
                                total += "E5"
                            }
                        }
                    ])

                    return total
                }
            }

            it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", () => {
                let parser = new OrImplicitLookAheadParser()
                expect(parser.getLookAheadCacheSize()).to.equal(0)
            })

            it("can compute the lookahead automatically for OR", () => {
                let input = [
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(FourTok),
                    createTokenInstance(FiveTok)
                ]
                let parser = new OrImplicitLookAheadParser(input)
                expect(parser.orRule()).to.equal("A1B2C3D4E5")
            })

            it("will fail when none of the alternatives match", () => {
                let input = [createTokenInstance(SixTok)]
                let parser = new OrImplicitLookAheadParser(input)
                expect(parser.orRule()).to.equal("-666")
            })
        })

        describe("OR production ambiguity detection when using implicit lookahead calculation", () => {
            it("will throw an error when two alternatives have the same single token (lookahead 1) prefix", () => {
                class OrAmbiguityLookAheadParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, ALL_TOKENS)
                        this.performSelfAnalysis()
                    }

                    public ambiguityRule = this.RULE(
                        "ambiguityRule",
                        this.parseAmbiguityRule
                    )

                    private parseAmbiguityRule(): void {
                        this.OR1([
                            {
                                ALT: () => {
                                    this.CONSUME1(OneTok)
                                }
                            },
                            // <-- this alternative starts with the same token as the previous one, ambiguity!
                            {
                                ALT: () => {
                                    this.CONSUME2(OneTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME2(TwoTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME2(ThreeTok)
                                }
                            }
                        ])
                    }
                }

                expect(() => new OrAmbiguityLookAheadParser()).to.throw(
                    "Ambiguous alternatives"
                )
                expect(() => new OrAmbiguityLookAheadParser()).to.throw(
                    "OneTok"
                )
            })

            it("will throw an error when two alternatives have the same multi token (lookahead > 1) prefix", () => {
                class OrAmbiguityMultiTokenLookAheadParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, ALL_TOKENS)
                        this.performSelfAnalysis()
                    }

                    public ambiguityRule = this.RULE(
                        "ambiguityRule",
                        this.parseAmbiguityRule
                    )

                    private parseAmbiguityRule(): void {
                        this.OR1([
                            {
                                ALT: () => {
                                    this.CONSUME1(OneTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(TwoTok)
                                    this.CONSUME1(ThreeTok)
                                    this.CONSUME1(FourTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME2(TwoTok)
                                    this.CONSUME2(ThreeTok)
                                    this.CONSUME2(FourTok)
                                }
                            }
                        ])
                    }
                }
                expect(
                    () => new OrAmbiguityMultiTokenLookAheadParser()
                ).to.throw("Ambiguous alternatives")
                expect(
                    () => new OrAmbiguityMultiTokenLookAheadParser()
                ).to.throw("TwoTok, ThreeTok, FourTok")
            })
        })

        describe("The implicit lookahead calculation functionality of the Recognizer For OR (with IGNORE_AMBIGUITIES)", () => {
            class OrImplicitLookAheadParserIgnoreAmbiguities extends Parser {
                public getLookAheadCacheSize(): number {
                    if (isES2015MapSupported()) {
                        // @ts-ignore
                        return this.lookAheadFuncsCache.size
                    } else {
                        // @ts-ignore
                        return Object.keys(this.lookAheadFuncsCache).length
                    }
                }

                constructor(input: IToken[] = []) {
                    super(input, ALL_TOKENS, {
                        ignoredIssues: {
                            orRule: {
                                OR: true,
                                OR2: true,
                                OR3: true,
                                OR4: true,
                                OR5: true
                            }
                        }
                    })
                    this.performSelfAnalysis()
                }

                public orRule = this.RULE("orRule", this.parseOrRule, {
                    recoveryValueFunc: () => "-666"
                })

                private parseOrRule(): string {
                    let total = ""

                    this.OR([
                        {
                            ALT: () => {
                                this.CONSUME1(OneTok)
                                total += "A1"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(OneTok)
                                total += "OOPS!"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME1(ThreeTok)
                                total += "A3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME1(FourTok)
                                total += "A4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME1(FiveTok)
                                total += "A5"
                            }
                        }
                    ])

                    this.OR2([
                        {
                            ALT: () => {
                                this.CONSUME2(FourTok)
                                total += "B4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(ThreeTok)
                                total += "B3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(TwoTok)
                                total += "B2"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME3(TwoTok)
                                total += "OOPS!"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(FiveTok)
                                total += "B5"
                            }
                        }
                    ])

                    this.OR3([
                        {
                            ALT: () => {
                                this.CONSUME3(FourTok)
                                total += "C4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME3(ThreeTok)
                                total += "C3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME4(ThreeTok)
                                total += "OOPS!"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME3(FiveTok)
                                total += "C5"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME3(OneTok)
                                total += "C1"
                            }
                        }
                    ])

                    this.OR4([
                        {
                            ALT: () => {
                                this.CONSUME4(OneTok)
                                total += "D1"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME4(FourTok)
                                total += "D4"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME5(FourTok)
                                total += "OOPS!"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME4(TwoTok)
                                total += "D2"
                            }
                        }
                    ])

                    this.OR5([
                        {
                            ALT: () => {
                                this.CONSUME5(TwoTok)
                                total += "E2"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME5(OneTok)
                                total += "E1"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME4(FiveTok)
                                total += "E5"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME5(ThreeTok)
                                total += "E3"
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME5(FiveTok)
                                total += "OOPS!"
                            }
                        }
                    ])

                    return total
                }
            }

            it("will cache the generatedLookAhead functions BEFORE (check cache is clean)", () => {
                let parser = new OrImplicitLookAheadParserIgnoreAmbiguities()
                expect(parser.getLookAheadCacheSize()).to.equal(0)
            })

            it("can compute the lookahead automatically for OR", () => {
                let input = [
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(FourTok),
                    createTokenInstance(FiveTok)
                ]
                let parser = new OrImplicitLookAheadParserIgnoreAmbiguities(
                    input
                )
                expect(parser.orRule()).to.equal("A1B2C3D4E5")
            })

            it("will fail when none of the alternatives match", () => {
                let input = [createTokenInstance(SixTok)]
                let parser = new OrImplicitLookAheadParserIgnoreAmbiguities(
                    input
                )
                expect(parser.orRule()).to.equal("-666")
            })
        })

        describe("The support for MultiToken (K>1) implicit lookahead capabilities in DSL Production:", () => {
            it("OPTION", () => {
                class MultiTokenLookAheadForOptionParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, ALL_TOKENS)
                        this.performSelfAnalysis()
                    }

                    public rule = this.RULE("rule", () => {
                        let result = "OPTION Not Taken"
                        this.OPTION2(() => {
                            this.CONSUME1(OneTok)
                            this.CONSUME1(TwoTok)
                            this.CONSUME1(ThreeTok)
                            result = "OPTION Taken"
                        })
                        this.CONSUME2(OneTok)
                        this.CONSUME2(TwoTok)
                        return result
                    })
                }

                let parser = new MultiTokenLookAheadForOptionParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok)
                ])
                expect(parser.rule()).to.equal("OPTION Not Taken")

                let parser2 = new MultiTokenLookAheadForOptionParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok)
                ])
                expect(parser2.rule()).to.equal("OPTION Taken")
            })

            it("MANY", () => {
                class MultiTokenLookAheadForManyParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, ALL_TOKENS)
                        this.performSelfAnalysis()
                    }

                    public rule = this.RULE("orRule", () => {
                        let numOfIterations = 0
                        this.MANY(() => {
                            this.CONSUME1(OneTok)
                            this.CONSUME1(TwoTok)
                            this.CONSUME1(ThreeTok)
                            numOfIterations++
                        })
                        this.CONSUME2(OneTok)
                        this.CONSUME2(TwoTok)
                        return numOfIterations
                    })
                }

                let parser = new MultiTokenLookAheadForManyParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok)
                ])
                expect(parser.rule()).to.equal(0)

                let oneIterationParser = new MultiTokenLookAheadForManyParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok)
                ])
                expect(oneIterationParser.rule()).to.equal(1)

                let twoIterationsParser = new MultiTokenLookAheadForManyParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok),
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok)
                ])

                expect(twoIterationsParser.rule()).to.equal(2)
            })

            it("MANY_SEP", () => {
                class MultiTokenLookAheadForManySepParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, ALL_TOKENS)
                        this.performSelfAnalysis()
                    }

                    public rule = this.RULE("orRule", () => {
                        let numOfIterations = 0
                        this.MANY_SEP({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(OneTok)
                                this.CONSUME1(TwoTok)
                                this.CONSUME1(ThreeTok)
                                numOfIterations++
                            }
                        })
                        this.CONSUME2(OneTok)
                        this.CONSUME2(TwoTok)
                        return numOfIterations
                    })
                }

                let parser = new MultiTokenLookAheadForManySepParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok)
                ])
                expect(parser.rule()).to.equal(0)

                let oneIterationParser = new MultiTokenLookAheadForManySepParser(
                    [
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok)
                    ]
                )
                expect(oneIterationParser.rule()).to.equal(1)

                let twoIterationsParser = new MultiTokenLookAheadForManySepParser(
                    [
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(Comma),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok)
                    ]
                )
                expect(twoIterationsParser.rule()).to.equal(2)
            })

            it("OR", () => {
                class MultiTokenLookAheadForOrParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, ALL_TOKENS)
                        this.performSelfAnalysis()
                    }

                    public orRule = this.RULE("orRule", () => {
                        return this.OR([
                            {
                                ALT: () => {
                                    this.CONSUME1(OneTok)
                                    this.CONSUME2(OneTok)
                                    return "alt1 Taken"
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME3(OneTok)
                                    this.CONSUME1(TwoTok)
                                    this.CONSUME1(ThreeTok)
                                    return "alt2 Taken"
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME4(OneTok)
                                    this.CONSUME2(TwoTok)
                                    return "alt3 Taken"
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME1(FourTok)
                                    return "alt4 Taken"
                                }
                            }
                        ])
                    })
                }

                let alt1Parser = new MultiTokenLookAheadForOrParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(OneTok)
                ])
                expect(alt1Parser.orRule()).to.equal("alt1 Taken")

                let alt2Parser = new MultiTokenLookAheadForOrParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok),
                    createTokenInstance(ThreeTok)
                ])
                expect(alt2Parser.orRule()).to.equal("alt2 Taken")

                let alt3Parser = new MultiTokenLookAheadForOrParser([
                    createTokenInstance(OneTok),
                    createTokenInstance(TwoTok)
                ])
                expect(alt3Parser.orRule()).to.equal("alt3 Taken")

                let alt4Parser = new MultiTokenLookAheadForOrParser([
                    createTokenInstance(FourTok)
                ])
                expect(alt4Parser.orRule()).to.equal("alt4 Taken")
            })

            it("AT_LEAST_ONE", () => {
                class MultiTokenLookAheadForAtLeastOneParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, ALL_TOKENS)
                        this.performSelfAnalysis()
                    }

                    public rule = this.RULE("orRule", () => {
                        let numOfIterations = 0
                        this.AT_LEAST_ONE(() => {
                            this.CONSUME1(OneTok)
                            this.CONSUME1(TwoTok)
                            this.CONSUME1(ThreeTok)
                            numOfIterations++
                        })
                        this.CONSUME2(OneTok)
                        this.CONSUME2(TwoTok)
                        return numOfIterations
                    })
                }

                let oneIterationParser = new MultiTokenLookAheadForAtLeastOneParser(
                    [
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok)
                    ]
                )
                expect(oneIterationParser.rule()).to.equal(1)

                let twoIterationsParser = new MultiTokenLookAheadForAtLeastOneParser(
                    [
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok)
                    ]
                )

                expect(twoIterationsParser.rule()).to.equal(2)

                let threeIterationsParser = new MultiTokenLookAheadForAtLeastOneParser(
                    [
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok)
                    ]
                )

                expect(threeIterationsParser.rule()).to.equal(3)
            })

            it("AT_LEAST_ONE_SEP", () => {
                class MultiTokenLookAheadForAtLeastOneSepParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(input, ALL_TOKENS)
                        this.performSelfAnalysis()
                    }

                    public rule = this.RULE("orRule", () => {
                        let numOfIterations = 0
                        this.AT_LEAST_ONE_SEP({
                            SEP: Comma,
                            DEF: () => {
                                this.CONSUME1(OneTok)
                                this.CONSUME1(TwoTok)
                                this.CONSUME1(ThreeTok)
                                numOfIterations++
                            }
                        })
                        this.CONSUME2(OneTok)
                        this.CONSUME2(TwoTok)
                        return numOfIterations
                    })
                }

                let oneIterationParser = new MultiTokenLookAheadForAtLeastOneSepParser(
                    [
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok)
                    ]
                )
                expect(oneIterationParser.rule()).to.equal(1)

                let twoIterationsParser = new MultiTokenLookAheadForAtLeastOneSepParser(
                    [
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(Comma),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok)
                    ]
                )
                expect(twoIterationsParser.rule()).to.equal(2)

                let threeIterationsParser = new MultiTokenLookAheadForAtLeastOneSepParser(
                    [
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(Comma),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(Comma),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok),
                        createTokenInstance(ThreeTok),
                        createTokenInstance(OneTok),
                        createTokenInstance(TwoTok)
                    ]
                )
                expect(threeIterationsParser.rule()).to.equal(3)
            })
        })
    })
}

defineLookaheadSpecs(
    "Regular Tokens Mode",
    createToken,
    createRegularToken,
    tokenStructuredMatcher
)
