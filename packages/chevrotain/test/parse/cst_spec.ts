import { createToken } from "../../src/scan/tokens_public"
import { CstParser, Parser } from "../../src/parse/parser/traits/parser_traits"
import { tokenStructuredMatcher } from "../../src/scan/tokens"
import { createRegularToken } from "../utils/matchers"
import { map } from "../../src/utils/utils"
import { CstNode, IToken, TokenType } from "../../api"

function createTokenVector(tokTypes: TokenType[]): any[] {
    return map(tokTypes, curTokType => {
        return createRegularToken(curTokType)
    })
}

function defineTestSuit(recoveryMode) {
    context(`CST Recovery: ${recoveryMode}`, () => {
        let A = createToken({ name: "A" })
        let B = createToken({ name: "B" })
        let C = createToken({ name: "C" })
        let D = createToken({ name: "D" })
        let E = createToken({ name: "E" })

        const ALL_TOKENS = [A, B, C, D, E]

        it("Can output a CST for a flat structure", () => {
            class CstTerminalParser extends CstParser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, { recoveryEnabled: recoveryMode })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.CONSUME(A)
                    this.CONSUME(B)
                    this.SUBRULE(this.bamba)
                })

                public bamba = this.RULE("bamba", () => {
                    this.CONSUME(C)
                })
            }

            let input = [
                createRegularToken(A),
                createRegularToken(B),
                createRegularToken(C)
            ]
            let parser = new CstTerminalParser(input)
            let cst: any = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "bamba")
            expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            expect(cst.children.bamba[0].name).to.equal("bamba")
            expect(
                tokenStructuredMatcher(cst.children.bamba[0].children.C[0], C)
            ).to.be.true
        })

        it("Can output a CST with labels", () => {
            class CstTerminalParser2 extends CstParser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, { recoveryEnabled: recoveryMode })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.CONSUME(A, { LABEL: "myLabel" })
                    this.CONSUME(B)
                    this.SUBRULE(this.bamba, { LABEL: "myOtherLabel" })
                })

                public bamba = this.RULE("bamba", () => {
                    this.CONSUME(C)
                })
            }

            let input = [
                createRegularToken(A),
                createRegularToken(B),
                createRegularToken(C)
            ]
            let parser = new CstTerminalParser2(input)
            let cst: any = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("myLabel", "B", "myOtherLabel")
            expect(tokenStructuredMatcher(cst.children.myLabel[0], A)).to.be
                .true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            expect(cst.children.myOtherLabel[0].name).to.equal("bamba")
            expect(
                tokenStructuredMatcher(
                    cst.children.myOtherLabel[0].children.C[0],
                    C
                )
            ).to.be.true
        })

        it("Can output a CST with labels in recovery", () => {
            class CstTerminalParserWithLabels extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: true
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.CONSUME(A, { LABEL: "myLabel" })
                    this.CONSUME(B)
                    this.SUBRULE(this.bamba, { LABEL: "myOtherLabel" })
                })

                public bamba = this.RULE("bamba", () => {
                    this.CONSUME(C)
                })
            }

            let input = [createRegularToken(A), createRegularToken(B)]
            let parser = new CstTerminalParserWithLabels(input)
            let cst = parser.testRule()

            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("myLabel", "B", "myOtherLabel")
            expect(tokenStructuredMatcher(cst.children.myLabel[0], A)).to.be
                .true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            expect(cst.children.myOtherLabel[0].name).to.equal("bamba")
            expect(cst.children.myOtherLabel[0].recoveredNode).to.be.true
        })

        it("Can output a CST for a Terminal - alternations", () => {
            class CstTerminalAlternationParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.OR([
                        {
                            ALT: () => {
                                this.CONSUME(A)
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME(B)
                                this.SUBRULE(this.bamba)
                            }
                        }
                    ])
                })

                public bamba = this.RULE("bamba", () => {
                    this.CONSUME(C)
                })
            }

            let input = [createRegularToken(A)]
            let parser = new CstTerminalAlternationParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A")
            expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
            expect(cst.children.bamba).to.be.undefined
        })

        it("Can output a CST for a Terminal - alternations - single", () => {
            class CstTerminalAlternationSingleAltParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.OR([
                        {
                            ALT: () => {
                                this.CONSUME(A)
                                this.CONSUME(B)
                            }
                        }
                    ])
                })
            }

            let input = [createRegularToken(A), createRegularToken(B)]
            let parser = new CstTerminalAlternationSingleAltParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B")
            expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
        })

        it("Can output a CST for a Terminal with multiple occurrences", () => {
            class CstMultiTerminalParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.CONSUME(A)
                    this.CONSUME(B)
                    this.CONSUME2(A)
                })
            }

            let input = [
                createRegularToken(A),
                createRegularToken(B),
                createRegularToken(A)
            ]
            let parser = new CstMultiTerminalParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B")
            expect(cst.children.A).to.have.length(2)
            expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
        })

        it("Can output a CST for a Terminal with multiple occurrences - iteration", () => {
            class CstMultiTerminalWithManyParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.MANY(() => {
                        this.CONSUME(A)
                        this.SUBRULE(this.bamba)
                    })
                    this.CONSUME(B)
                })

                public bamba = this.RULE("bamba", () => {
                    this.CONSUME(C)
                })
            }

            let input = [
                createRegularToken(A),
                createRegularToken(C),
                createRegularToken(A),
                createRegularToken(C),
                createRegularToken(A),
                createRegularToken(C),
                createRegularToken(B)
            ]
            let parser = new CstMultiTerminalWithManyParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "bamba")
            expect(cst.children.A).to.have.length(3)
            expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.A[2], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            expect(cst.children.bamba).to.have.length(3)
            expect(
                tokenStructuredMatcher(cst.children.bamba[0].children.C[0], C)
            ).to.be.true
            expect(
                tokenStructuredMatcher(cst.children.bamba[1].children.C[0], C)
            ).to.be.true
            expect(
                tokenStructuredMatcher(cst.children.bamba[2].children.C[0], C)
            ).to.be.true
        })

        context("Can output a CST for an optional terminal", () => {
            class CstOptionalTerminalParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public ruleWithOptional = this.RULE("ruleWithOptional", () => {
                    this.OPTION(() => {
                        this.CONSUME(A)
                        this.SUBRULE(this.bamba)
                    })
                    this.CONSUME(B)
                })

                public bamba = this.RULE("bamba", () => {
                    this.CONSUME(C)
                })
            }

            it("path taken", () => {
                let input = [
                    createRegularToken(A),
                    createRegularToken(C),
                    createRegularToken(B)
                ]
                let parser = new CstOptionalTerminalParser(input)
                let cst = parser.ruleWithOptional()
                expect(cst.name).to.equal("ruleWithOptional")
                expect(cst.children).to.have.keys("A", "B", "bamba")
                expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
                expect(cst.children.bamba[0].name).to.equal("bamba")
                expect(
                    tokenStructuredMatcher(
                        cst.children.bamba[0].children.C[0],
                        C
                    )
                ).to.be.true
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            })

            it("path NOT taken", () => {
                let input = [createRegularToken(B)]
                let parser = new CstOptionalTerminalParser(input)
                let cst = parser.ruleWithOptional()
                expect(cst.name).to.equal("ruleWithOptional")
                expect(cst.children).to.have.keys("B")
                expect(cst.children.A).to.be.undefined
                expect(cst.children.bamba).to.be.undefined
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            })
        })

        it("Can output a CST for a Terminal with multiple occurrences - iteration mandatory", () => {
            class CstMultiTerminalWithAtLeastOneParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.AT_LEAST_ONE(() => {
                        this.CONSUME(A)
                    })
                    this.CONSUME(B)
                })
            }

            let input = [
                createRegularToken(A),
                createRegularToken(A),
                createRegularToken(A),
                createRegularToken(B)
            ]
            let parser = new CstMultiTerminalWithAtLeastOneParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B")
            expect(cst.children.A).to.have.length(3)
            expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.A[2], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
        })

        it("Can output a CST for a Terminal with multiple occurrences - iteration SEP", () => {
            class CstMultiTerminalWithManySepParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.MANY_SEP({
                        SEP: C,
                        DEF: () => {
                            this.CONSUME(A)
                        }
                    })
                    this.CONSUME(B)
                })
            }

            let input = [
                createRegularToken(A),
                createRegularToken(C),
                createRegularToken(A),
                createRegularToken(B)
            ]
            let parser = new CstMultiTerminalWithManySepParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "C")
            expect(cst.children.A).to.have.length(2)
            expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

            expect(cst.children.C).to.have.length(1)
            expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true
        })

        it("Can output a CST for a Terminal with multiple occurrences - iteration SEP mandatory", () => {
            class CstMultiTerminalWithAtLeastOneSepParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        outputCst: true,
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.AT_LEAST_ONE_SEP({
                        SEP: C,
                        DEF: () => {
                            this.CONSUME(A)
                        }
                    })
                    this.CONSUME(B)
                })
            }

            let input = [
                createRegularToken(A),
                createRegularToken(C),
                createRegularToken(A),
                createRegularToken(B)
            ]
            let parser = new CstMultiTerminalWithAtLeastOneSepParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "C")
            expect(cst.children.A).to.have.length(2)
            expect(tokenStructuredMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

            expect(cst.children.C).to.have.length(1)
            expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true
        })

        it("Can output a CST with node full location information", () => {
            class CstTerminalParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        nodeLocationTracking: "full",
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.SUBRULE(this.first)
                    this.CONSUME(B)
                    this.CONSUME(C)
                    this.SUBRULE(this.empty)
                    this.SUBRULE(this.second)
                })

                public first = this.RULE("first", () => {
                    this.CONSUME(A)
                })

                public empty = this.RULE("empty", () => {})

                public second = this.RULE("second", () => {
                    this.CONSUME(D)
                })
            }

            const input = [
                createRegularToken(A, "", 1, 1, 1, 2, 1, 2),
                createRegularToken(B, "", 12, 1, 3, 13, 1, 4),
                createRegularToken(C, "", 15, 2, 10, 16, 3, 15),
                createRegularToken(D, "", 17, 5, 2, 18, 5, 4)
            ]
            const parser = new CstTerminalParser(input)
            const cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys(
                "B",
                "C",
                "first",
                "empty",
                "second"
            )
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true
            expect(cst.children.first[0].name).to.equal("first")
            expect(cst.children.second[0].name).to.equal("second")
            expect(
                tokenStructuredMatcher(cst.children.first[0].children.A[0], A)
            ).to.be.true

            expect(cst.children.first[0].location).to.deep.equal({
                startOffset: 1,
                startLine: 1,
                startColumn: 1,
                endOffset: 2,
                endLine: 1,
                endColumn: 2
            })

            expect(cst.children.empty[0].location).to.deep.equal({
                startOffset: NaN,
                startLine: NaN,
                startColumn: NaN,
                endOffset: NaN,
                endLine: NaN,
                endColumn: NaN
            })

            expect(cst.children.second[0].location).to.deep.equal({
                startOffset: 17,
                startLine: 5,
                startColumn: 2,
                endOffset: 18,
                endLine: 5,
                endColumn: 4
            })

            expect(cst.location).to.deep.equal({
                startOffset: 1,
                startLine: 1,
                startColumn: 1,
                endOffset: 18,
                endLine: 5,
                endColumn: 4
            })
        })

        it("Can output a CST with node onlyOffset location information", () => {
            class CstTerminalParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        nodeLocationTracking: "onlyOffset",
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.SUBRULE(this.first)
                    this.CONSUME(B)
                    this.CONSUME(C)
                    this.SUBRULE(this.empty)
                    this.SUBRULE(this.second)
                })

                public first = this.RULE("first", () => {
                    this.CONSUME(A)
                })

                public empty = this.RULE("empty", () => {})

                public second = this.RULE("second", () => {
                    this.CONSUME(D)
                })
            }

            let input = [
                createRegularToken(A, "1", 1, NaN, NaN, 2),
                createRegularToken(B, "2", 12, NaN, NaN, 13),
                createRegularToken(C, "3", 15, NaN, NaN, 16),
                createRegularToken(D, "4", 17, NaN, NaN, 18)
            ]
            let parser = new CstTerminalParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys(
                "B",
                "C",
                "first",
                "empty",
                "second"
            )
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true
            expect(cst.children.first[0].name).to.equal("first")
            expect(cst.children.second[0].name).to.equal("second")
            expect(
                tokenStructuredMatcher(cst.children.first[0].children.A[0], A)
            ).to.be.true

            expect(cst.children.first[0].location).to.deep.equal({
                startOffset: 1,
                endOffset: 2
            })

            expect(cst.children.second[0].location).to.deep.equal({
                startOffset: 17,
                endOffset: 18
            })

            expect(cst.children.empty[0].location).to.deep.equal({
                startOffset: NaN,
                endOffset: NaN
            })

            expect(cst.location).to.deep.equal({
                startOffset: 1,
                endOffset: 18
            })
        })

        it("Can output a CST with no location information", () => {
            class CstTerminalParser extends Parser {
                constructor(input: IToken[] = []) {
                    super(ALL_TOKENS, {
                        nodeLocationTracking: "none",
                        recoveryEnabled: recoveryMode
                    })
                    this.performSelfAnalysis()
                    this.input = input
                }

                public testRule = this.RULE("testRule", () => {
                    this.SUBRULE(this.first)
                    this.CONSUME(B)
                    this.CONSUME(C)
                    this.SUBRULE(this.second)
                })

                public first = this.RULE("first", () => {
                    this.CONSUME(A)
                })

                public second = this.RULE("second", () => {
                    this.CONSUME(D)
                })
            }

            let input = [
                createRegularToken(A, "", 1, 1, 1, 2, 1, 2),
                createRegularToken(B, "", 12, 1, 3, 13, 1, 4),
                createRegularToken(C, "", 15, 2, 10, 16, 3, 15),
                createRegularToken(D, "", 17, 5, 2, 18, 5, 4)
            ]
            let parser = new CstTerminalParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("B", "C", "first", "second")
            expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
            expect(tokenStructuredMatcher(cst.children.C[0], C)).to.be.true
            expect(cst.children.first[0].name).to.equal("first")
            expect(cst.children.second[0].name).to.equal("second")
            expect(
                tokenStructuredMatcher(cst.children.first[0].children.A[0], A)
            ).to.be.true

            expect(cst.children.first[0].location).to.be.undefined

            expect(cst.children.second[0].location).to.be.undefined

            expect(cst.location).to.be.undefined
        })

        context("nested rules", () => {
            context("Can output cst when using OPTION", () => {
                class CstOptionalNestedTerminalParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public ruleWithOptional = this.RULE(
                        "ruleWithOptional",
                        () => {
                            this.OPTION({
                                NAME: "$nestedOption",
                                DEF: () => {
                                    this.CONSUME(A)
                                    this.SUBRULE(this.bamba)
                                }
                            })
                            this.CONSUME(B)
                        }
                    )

                    public bamba = this.RULE("bamba", () => {
                        this.CONSUME(C)
                    })
                }

                it("path taken", () => {
                    let input = [
                        createRegularToken(A),
                        createRegularToken(C),
                        createRegularToken(B)
                    ]
                    let parser = new CstOptionalNestedTerminalParser(input)
                    let cst = parser.ruleWithOptional()
                    expect(cst.name).to.equal("ruleWithOptional")
                    expect(cst.children).to.have.keys("$nestedOption", "B")
                    let $nestedOptionCst = cst.children.$nestedOption[0]
                    expect(
                        tokenStructuredMatcher(
                            $nestedOptionCst.children.A[0],
                            A
                        )
                    ).to.be.true
                    expect($nestedOptionCst.children.bamba[0].name).to.equal(
                        "bamba"
                    )
                    expect(
                        tokenStructuredMatcher(
                            $nestedOptionCst.children.bamba[0].children.C[0],
                            C
                        )
                    ).to.be.true
                    expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be
                        .true
                })

                it("path NOT taken", () => {
                    let input = [createRegularToken(B)]
                    let parser = new CstOptionalNestedTerminalParser(input)
                    let cst = parser.ruleWithOptional()
                    expect(cst.name).to.equal("ruleWithOptional")
                    // nested rule is equivalent to an optionally empty rule call
                    expect(cst.children).to.have.keys("B", "$nestedOption")
                    let $nestedOptionCst = cst.children.$nestedOption[0]
                    expect($nestedOptionCst.children.A).to.be.undefined
                    expect($nestedOptionCst.children.bamba).to.be.undefined
                    expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be
                        .true
                })
            })

            it("Can output a CST when using OR with nested named Alternatives", () => {
                class CstAlternationNestedAltParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OR([
                            {
                                NAME: "$first_alternative",
                                ALT: () => {
                                    this.CONSUME(A)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME(B)
                                    this.SUBRULE(this.bamba)
                                }
                            }
                        ])
                    })

                    public bamba = this.RULE("bamba", () => {
                        this.CONSUME(C)
                    })
                }

                let input = [createRegularToken(A)]
                let parser = new CstAlternationNestedAltParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$first_alternative")
                let firstAltCst = cst.children.$first_alternative[0]
                expect(tokenStructuredMatcher(firstAltCst.children.A[0], A)).to
                    .be.true
                expect(cst.children.bamba).to.be.undefined
                expect(cst.children.B).to.be.undefined
            })

            it("Can output a CST when using OR", () => {
                class CstAlternationNestedParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OR({
                            NAME: "$nestedOr",
                            DEF: [
                                {
                                    ALT: () => {
                                        this.CONSUME(A)
                                    }
                                },
                                {
                                    ALT: () => {
                                        this.CONSUME(B)
                                        this.SUBRULE(this.bamba)
                                    }
                                }
                            ]
                        })
                    })

                    public bamba = this.RULE("bamba", () => {
                        this.CONSUME(C)
                    })
                }

                let input = [createRegularToken(A)]
                let parser = new CstAlternationNestedParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedOr")
                let orCst = cst.children.$nestedOr[0]
                expect(orCst.children).to.have.keys("A")
                expect(tokenStructuredMatcher(orCst.children.A[0], A)).to.be
                    .true
                expect(orCst.children.bamba).to.be.undefined
                expect(orCst.children.B).to.be.undefined
            })

            it("Can output a CST when using OR - single Alt", () => {
                class CstAlternationNestedAltSingleParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OR([
                            {
                                NAME: "$nestedAlt",
                                ALT: () => {
                                    this.CONSUME(B)
                                    this.SUBRULE(this.bamba)
                                }
                            }
                        ])
                    })

                    public bamba = this.RULE("bamba", () => {
                        this.CONSUME(C)
                    })
                }

                let input = [createRegularToken(B), createRegularToken(C)]
                let parser = new CstAlternationNestedAltSingleParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedAlt")
                let altCst = cst.children.$nestedAlt[0]
                expect(altCst.children).to.have.keys("B", "bamba")
                expect(tokenStructuredMatcher(altCst.children.B[0], B)).to.be
                    .true
                expect(altCst.children.bamba[0].children).to.have.keys("C")
            })

            it("Can output a CST using Repetitions", () => {
                class CstMultiTerminalWithManyNestedParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.MANY({
                            NAME: "$nestedMany",
                            DEF: () => {
                                this.CONSUME(A)
                                this.SUBRULE(this.bamba)
                            }
                        })
                        this.CONSUME(B)
                    })

                    public bamba = this.RULE("bamba", () => {
                        this.CONSUME(C)
                    })
                }

                let input = [
                    createRegularToken(A),
                    createRegularToken(C),
                    createRegularToken(A),
                    createRegularToken(C),
                    createRegularToken(A),
                    createRegularToken(C),
                    createRegularToken(B)
                ]
                let parser = new CstMultiTerminalWithManyNestedParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("B", "$nestedMany")
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
                let nestedManyCst = cst.children.$nestedMany[0]
                expect(nestedManyCst.children).to.have.keys("A", "bamba")

                expect(nestedManyCst.children.A).to.have.length(3)
                expect(tokenStructuredMatcher(nestedManyCst.children.A[0], A))
                    .to.be.true
                expect(tokenStructuredMatcher(nestedManyCst.children.A[1], A))
                    .to.be.true
                expect(tokenStructuredMatcher(nestedManyCst.children.A[2], A))
                    .to.be.true

                expect(nestedManyCst.children.bamba).to.have.length(3)
                expect(
                    tokenStructuredMatcher(
                        nestedManyCst.children.bamba[0].children.C[0],
                        C
                    )
                ).to.be.true
                expect(
                    tokenStructuredMatcher(
                        nestedManyCst.children.bamba[1].children.C[0],
                        C
                    )
                ).to.be.true
                expect(
                    tokenStructuredMatcher(
                        nestedManyCst.children.bamba[2].children.C[0],
                        C
                    )
                ).to.be.true
            })

            it("Can output a CST using mandatory Repetitions", () => {
                class CstAtLeastOneNestedParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.AT_LEAST_ONE({
                            NAME: "$oops",
                            DEF: () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [
                    createRegularToken(A),
                    createRegularToken(A),
                    createRegularToken(A),
                    createRegularToken(B)
                ]
                let parser = new CstAtLeastOneNestedParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$oops", "B")
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
                let oopsCst = cst.children.$oops[0]
                expect(oopsCst.children).to.have.keys("A")
                expect(oopsCst.children.A).to.have.length(3)
                expect(tokenStructuredMatcher(oopsCst.children.A[0], A)).to.be
                    .true
                expect(tokenStructuredMatcher(oopsCst.children.A[1], A)).to.be
                    .true
                expect(tokenStructuredMatcher(oopsCst.children.A[2], A)).to.be
                    .true
            })

            it("Can output a CST using Repetitions with separator", () => {
                class CstNestedRuleWithManySepParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.MANY_SEP({
                            NAME: "$pizza",
                            SEP: C,
                            DEF: () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [
                    createRegularToken(A),
                    createRegularToken(C),
                    createRegularToken(A),
                    createRegularToken(B)
                ]
                let parser = new CstNestedRuleWithManySepParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$pizza", "B")
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true
                let pizzaCst = cst.children.$pizza[0]
                expect(pizzaCst.children.A).to.have.length(2)
                expect(tokenStructuredMatcher(pizzaCst.children.A[0], A)).to.be
                    .true
                expect(tokenStructuredMatcher(pizzaCst.children.A[1], A)).to.be
                    .true
                expect(pizzaCst.children.C).to.have.length(1)
                expect(tokenStructuredMatcher(pizzaCst.children.C[0], C)).to.be
                    .true
            })

            it("Can output a CST using Repetitions with separator - mandatory", () => {
                class CstAtLeastOneSepNestedParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.AT_LEAST_ONE_SEP({
                            NAME: "$nestedName",
                            SEP: C,
                            DEF: () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [
                    createRegularToken(A),
                    createRegularToken(C),
                    createRegularToken(A),
                    createRegularToken(B)
                ]
                let parser = new CstAtLeastOneSepNestedParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedName", "B")
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

                let nestedCst = cst.children.$nestedName[0]
                expect(nestedCst.children.A).to.have.length(2)
                expect(tokenStructuredMatcher(nestedCst.children.A[0], A)).to.be
                    .true
                expect(tokenStructuredMatcher(nestedCst.children.A[1], A)).to.be
                    .true
                expect(nestedCst.children.C).to.have.length(1)
                expect(tokenStructuredMatcher(nestedCst.children.C[0], C)).to.be
                    .true
            })

            it("Can output a CST with nested rules with node full location information", () => {
                class CstTerminalParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            nodeLocationTracking: "full",
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OPTION({
                            NAME: "$nestedOption",
                            DEF: () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [
                    createRegularToken(A, "", 1, 1, 1, 2, 1, 2),
                    createRegularToken(B, "", 12, 1, 3, 13, 2, 4)
                ]
                let parser = new CstTerminalParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedOption", "B")
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

                let nestedCst = cst.children.$nestedOption[0]
                expect(nestedCst.children.A).to.have.length(1)
                expect(tokenStructuredMatcher(nestedCst.children.A[0], A)).to.be
                    .true

                expect(nestedCst.location).to.deep.equal({
                    startOffset: 1,
                    startLine: 1,
                    startColumn: 1,
                    endOffset: 2,
                    endLine: 1,
                    endColumn: 2
                })

                expect(cst.location).to.deep.equal({
                    startOffset: 1,
                    startLine: 1,
                    startColumn: 1,
                    endOffset: 13,
                    endLine: 2,
                    endColumn: 4
                })
            })

            it("Can output a CST with nested rules with node onlyOffset location information", () => {
                class CstTerminalParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            nodeLocationTracking: "onlyOffset",
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OPTION({
                            NAME: "$nestedOption",
                            DEF: () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [
                    createRegularToken(A, "1", 1, NaN, NaN, 2),
                    createRegularToken(B, "2", 12, NaN, NaN, 13)
                ]
                let parser = new CstTerminalParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedOption", "B")
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

                let nestedCst = cst.children.$nestedOption[0]
                expect(nestedCst.children.A).to.have.length(1)
                expect(tokenStructuredMatcher(nestedCst.children.A[0], A)).to.be
                    .true

                expect(nestedCst.location).to.deep.equal({
                    startOffset: 1,
                    endOffset: 2
                })

                expect(cst.location).to.deep.equal({
                    startOffset: 1,
                    endOffset: 13
                })
            })

            it("Can output a CST with nested rules with no node location information", () => {
                class CstTerminalParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            nodeLocationTracking: "none",
                            recoveryEnabled: recoveryMode
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OPTION({
                            NAME: "$nestedOption",
                            DEF: () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [
                    createRegularToken(A, "", 1, 1, 1, 2, 1, 2),
                    createRegularToken(B, "", 12, 1, 3, 13, 2, 4)
                ]
                let parser = new CstTerminalParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedOption", "B")
                expect(tokenStructuredMatcher(cst.children.B[0], B)).to.be.true

                let nestedCst = cst.children.$nestedOption[0]
                expect(nestedCst.children.A).to.have.length(1)
                expect(tokenStructuredMatcher(nestedCst.children.A[0], A)).to.be
                    .true

                expect(nestedCst.location).to.be.undefined

                expect(cst.location).to.be.undefined
            })

            it("Can output a CST with nested rules with no node location information", () => {
                class CstTerminalParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            nodeLocationTracking: undefined,
                            recoveryEnabled: recoveryMode
                        })
                    }
                }

                expect(function() {
                    new CstTerminalParser()
                }).to.throw()
            })
        })

        context("Error Recovery", () => {
            it("re-sync recovery", () => {
                class CstRecoveryParserReSync extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: true
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public root = this.RULE("root", () => {
                        this.MANY(() => {
                            this.OR([
                                {
                                    ALT: () => {
                                        this.SUBRULE(this.first)
                                    }
                                },
                                {
                                    ALT: () => {
                                        this.SUBRULE(this.second)
                                    }
                                }
                            ])
                        })
                    })

                    public first = this.RULE("first", () => {
                        this.CONSUME(A)
                        this.CONSUME(B)
                    })

                    public second = this.RULE("second", () => {
                        this.CONSUME(C)
                        this.CONSUME(D)
                    })

                    public canTokenTypeBeInsertedInRecovery(
                        tokType: TokenType
                    ): boolean {
                        // we want to force re-sync recovery
                        return false
                    }
                }

                let input = createTokenVector([A, E, E, C, D])
                let parser = new CstRecoveryParserReSync(input)
                let cst = parser.root()
                expect(parser.errors).to.have.lengthOf(1)
                expect(parser.errors[0].message).to.include(
                    "Expecting token of type --> B <--"
                )
                expect(parser.errors[0].resyncedTokens).to.have.lengthOf(1)
                expect(
                    tokenStructuredMatcher(
                        parser.errors[0].resyncedTokens[0],
                        E
                    )
                ).to.be.true

                // expect(parser.errors[0]).
                expect(cst.name).to.equal("root")
                expect(cst.children).to.have.keys("first", "second")

                let firstCollection = cst.children.first
                expect(firstCollection).to.have.lengthOf(1)
                let first = firstCollection[0]
                expect(first.recoveredNode).to.be.true
                expect(first.children).to.have.keys("A")
                expect(tokenStructuredMatcher(first.children.A[0], A)).to.be
                    .true
                expect(first.children.B).to.be.undefined

                let secondCollection = cst.children.second
                expect(secondCollection).to.have.lengthOf(1)
                let second = secondCollection[0]
                expect(second.recoveredNode).to.be.undefined
                expect(second.children).to.have.keys("C", "D")
                expect(tokenStructuredMatcher(second.children.C[0], C)).to.be
                    .true
                expect(tokenStructuredMatcher(second.children.D[0], D)).to.be
                    .true
            })

            it("re-sync recovery nested", () => {
                class CstRecoveryParserReSyncNested extends Parser {
                    constructor(input: IToken[] = []) {
                        super(ALL_TOKENS, {
                            outputCst: true,
                            recoveryEnabled: true
                        })
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public root = this.RULE("root", () => {
                        this.MANY(() => {
                            this.OR([
                                {
                                    ALT: () => {
                                        this.SUBRULE(this.first_root)
                                    }
                                },
                                {
                                    ALT: () => {
                                        this.SUBRULE(this.second)
                                    }
                                }
                            ])
                        })
                    })

                    public first_root = this.RULE("first_root", () => {
                        this.SUBRULE(this.first)
                    })

                    public first = this.RULE("first", () => {
                        this.CONSUME(A)
                        this.CONSUME(B)
                    })

                    public second = this.RULE("second", () => {
                        this.CONSUME(C)
                        this.CONSUME(D)
                    })

                    public canTokenTypeBeInsertedInRecovery(
                        tokType: TokenType
                    ): boolean {
                        // we want to force re-sync recovery
                        return false
                    }
                }

                let input = createTokenVector([A, E, E, C, D])
                let parser = new CstRecoveryParserReSyncNested(input)
                let cst = parser.root()
                expect(parser.errors).to.have.lengthOf(1)
                expect(parser.errors[0].message).to.include(
                    "Expecting token of type --> B <--"
                )
                expect(parser.errors[0].resyncedTokens).to.have.lengthOf(1)
                expect(
                    tokenStructuredMatcher(
                        parser.errors[0].resyncedTokens[0],
                        E
                    )
                ).to.be.true

                expect(cst.name).to.equal("root")
                expect(cst.children).to.have.keys("first_root", "second")

                let firstRootCollection = cst.children.first_root
                expect(firstRootCollection).to.have.lengthOf(1)
                let firstRoot = firstRootCollection[0]
                expect(firstRoot.children).to.have.keys("first")

                let first = firstRoot.children.first[0]
                expect(first.recoveredNode).to.be.true
                expect(first.children).to.have.keys("A")
                expect(tokenStructuredMatcher(first.children.A[0], A)).to.be
                    .true
                expect(first.children.B).to.be.undefined

                let secondCollection = cst.children.second
                expect(secondCollection).to.have.lengthOf(1)
                let second = secondCollection[0]
                expect(second.recoveredNode).to.be.undefined
                expect(second.children).to.have.keys("C", "D")
                expect(tokenStructuredMatcher(second.children.C[0], C)).to.be
                    .true
                expect(tokenStructuredMatcher(second.children.D[0], D)).to.be
                    .true
            })
        })
    })
}

defineTestSuit(true)
defineTestSuit(false)
