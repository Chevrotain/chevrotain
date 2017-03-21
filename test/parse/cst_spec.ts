import {extendToken, Token} from "../../src/scan/tokens_public"
import {Parser} from "../../src/parse/parser_public"
import {exceptions} from "../../src/parse/exceptions_public"
import {clearCache} from "../../src/parse/cache_public"
import {tokenStructuredMatcher} from "../../src/scan/tokens"
import {createRegularToken} from "../utils/matchers"
import {TokenConstructor} from "../../src/scan/lexer_public"
import {map} from "../../src/utils/utils"
import MismatchedTokenException = exceptions.MismatchedTokenException
import NoViableAltException = exceptions.NoViableAltException
import EarlyExitException = exceptions.EarlyExitException

function defineCstSpecs(contextName, extendToken, createToken, tokenMatcher) {

    function createTokenVector(tokTypes:TokenConstructor[]):any[] {
        return map(tokTypes, (curTokType) => {
            return createToken(curTokType)
        })
    }

    context("CST " + contextName, () => {

        let A = extendToken("A")
        let B = extendToken("B")
        let C = extendToken("C")
        let D = extendToken("D")
        let E = extendToken("E")

        const ALL_TOKENS = [A, B, C, D, E]

        it("Can output a CST for a flat structure", () => {
            class CstTerminalParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
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

            let input = [createToken(A), createToken(B), createToken(C)]
            let parser = new CstTerminalParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "bamba")
            expect(tokenMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenMatcher(cst.children.B[0], B)).to.be.true
            expect(cst.children.bamba[0].name).to.equal("bamba")
            expect(tokenMatcher(cst.children.bamba[0].children.C[0], C)).to.be.true
        })

        it("Can output a CST for a Terminal - alternations", () => {
            class CstTerminalAlternationParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
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

            let input = [createToken(A)]
            let parser = new CstTerminalAlternationParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "bamba")
            expect(tokenMatcher(cst.children.A[0], A)).to.be.true
            expect(cst.children.bamba[0]).to.be.undefined
        })

        it("Can output a CST for a Terminal - alternations - single", () => {
            class CstTerminalAlternationSingleAltParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
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

            let input = [createToken(A), createToken(B)]
            let parser = new CstTerminalAlternationSingleAltParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B")
            expect(tokenMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenMatcher(cst.children.B[0], B)).to.be.true
        })

        it("Can output a CST for a Terminal with multiple occurrences", () => {
            class CstMultiTerminalParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
                }

                public testRule = this.RULE("testRule", () => {
                    this.CONSUME(A)
                    this.CONSUME(B)
                    this.CONSUME2(A)
                })
            }

            let input = [createToken(A), createToken(B), createToken(A)]
            let parser = new CstMultiTerminalParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B")
            expect(cst.children.A).to.have.length(2)
            expect(tokenMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenMatcher(cst.children.B[0], B)).to.be.true
        })

        it("Can output a CST for a Terminal with multiple occurrences - iteration", () => {
            class CstMultiTerminalWithManyParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
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

            let input = [createToken(A), createToken(C), createToken(A), createToken(C), createToken(A), createToken(C), createToken(B)]
            let parser = new CstMultiTerminalWithManyParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "bamba")
            expect(cst.children.A).to.have.length(3)
            expect(tokenMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenMatcher(cst.children.A[2], A)).to.be.true
            expect(tokenMatcher(cst.children.B[0], B)).to.be.true
            expect(cst.children.bamba).to.have.length(3)
            expect(tokenMatcher(cst.children.bamba[0].children.C[0], C)).to.be.true
            expect(tokenMatcher(cst.children.bamba[1].children.C[0], C)).to.be.true
            expect(tokenMatcher(cst.children.bamba[2].children.C[0], C)).to.be.true
        })

        context("Can output a CST for an optional terminal", () => {
            class CstOptionalTerminalParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
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
                let input = [createToken(A), createToken(C), createToken(B)]
                let parser = new CstOptionalTerminalParser(input)
                let cst = parser.ruleWithOptional()
                expect(cst.name).to.equal("ruleWithOptional")
                expect(cst.children).to.have.keys("A", "B", "bamba")
                expect(tokenMatcher(cst.children.A[0], A)).to.be.true
                expect(cst.children.bamba[0].name).to.equal("bamba")
                expect(tokenMatcher(cst.children.bamba[0].children.C[0], C)).to.be.true
                expect(tokenMatcher(cst.children.B[0], B)).to.be.true
            })

            it("path NOT taken", () => {
                let input = [createToken(B)]
                let parser = new CstOptionalTerminalParser(input)
                let cst = parser.ruleWithOptional()
                expect(cst.name).to.equal("ruleWithOptional")
                expect(cst.children).to.have.keys("A", "B", "bamba")
                expect(cst.children.A[0]).to.be.undefined
                expect(cst.children.bamba[0]).to.be.undefined
                expect(tokenMatcher(cst.children.B[0], B)).to.be.true
            })
        })

        it("Can output a CST for a Terminal with multiple occurrences - iteration mandatory", () => {
            class CstMultiTerminalWithAtLeastOneParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
                }

                public testRule = this.RULE("testRule", () => {
                    this.AT_LEAST_ONE(() => {
                        this.CONSUME(A)
                    })
                    this.CONSUME(B)
                })
            }

            let input = [createToken(A), createToken(A), createToken(A), createToken(B)]
            let parser = new CstMultiTerminalWithAtLeastOneParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B")
            expect(cst.children.A).to.have.length(3)
            expect(tokenMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenMatcher(cst.children.A[2], A)).to.be.true
            expect(tokenMatcher(cst.children.B[0], B)).to.be.true
        })

        it("Can output a CST for a Terminal with multiple occurrences - iteration SEP", () => {
            class CstMultiTerminalWithManySepParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
                }

                public testRule = this.RULE("testRule", () => {
                    this.MANY_SEP({
                        SEP: C, DEF: () => {
                            this.CONSUME(A)
                        }
                    })
                    this.CONSUME(B)
                })
            }

            let input = [createToken(A), createToken(C), createToken(A), createToken(B)]
            let parser = new CstMultiTerminalWithManySepParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "C")
            expect(cst.children.A).to.have.length(2)
            expect(tokenMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenMatcher(cst.children.B[0], B)).to.be.true

            expect(cst.children.C).to.have.length(1)
            expect(tokenMatcher(cst.children.C[0], C)).to.be.true
        })

        it("Can output a CST for a Terminal with multiple occurrences - iteration SEP mandatory", () => {
            class CstMultiTerminalWithAtLeastOneSepParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS, {outputCst: true});
                    (<any>Parser).performSelfAnalysis(this)
                }

                public testRule = this.RULE("testRule", () => {
                    this.AT_LEAST_ONE_SEP({
                        SEP: C, DEF: () => {
                            this.CONSUME(A)
                        }
                    })
                    this.CONSUME(B)
                })
            }

            let input = [createToken(A), createToken(C), createToken(A), createToken(B)]
            let parser = new CstMultiTerminalWithAtLeastOneSepParser(input)
            let cst = parser.testRule()
            expect(cst.name).to.equal("testRule")
            expect(cst.children).to.have.keys("A", "B", "C")
            expect(cst.children.A).to.have.length(2)
            expect(tokenMatcher(cst.children.A[0], A)).to.be.true
            expect(tokenMatcher(cst.children.A[1], A)).to.be.true
            expect(tokenMatcher(cst.children.B[0], B)).to.be.true

            expect(cst.children.C).to.have.length(1)
            expect(tokenMatcher(cst.children.C[0], C)).to.be.true
        })

        context("nested rules", () => {
            context("Can output cst when using OPTION", () => {
                class CstOptionalNestedTerminalParser extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public ruleWithOptional = this.RULE("ruleWithOptional", () => {
                        this.OPTION({
                            NAME: "$nestedOption",
                            DEF:  () => {
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

                it("path taken", () => {
                    let input = [createToken(A), createToken(C), createToken(B)]
                    let parser = new CstOptionalNestedTerminalParser(input)
                    let cst = parser.ruleWithOptional()
                    expect(cst.name).to.equal("ruleWithOptional")
                    expect(cst.children).to.have.keys("$nestedOption", "B")
                    let $nestedOptionCst = cst.children.$nestedOption[0]
                    expect(tokenMatcher($nestedOptionCst.children.A[0], A)).to.be.true
                    expect($nestedOptionCst.children.bamba[0].name).to.equal("bamba")
                    expect(tokenMatcher($nestedOptionCst.children.bamba[0].children.C[0], C)).to.be.true
                    expect(tokenMatcher(cst.children.B[0], B)).to.be.true
                })

                it("path NOT taken", () => {
                    let input = [createToken(B)]
                    let parser = new CstOptionalNestedTerminalParser(input)
                    let cst = parser.ruleWithOptional()
                    expect(cst.name).to.equal("ruleWithOptional")
                    expect(cst.children).to.have.keys("$nestedOption", "B")
                    let $nestedOptionCst = cst.children.$nestedOption[0]
                    expect($nestedOptionCst.children.A[0]).to.be.undefined
                    expect($nestedOptionCst.children.bamba[0]).to.be.undefined
                    expect(tokenMatcher(cst.children.B[0], B)).to.be.true
                })
            })

            it("Can output a CST when using OR with nested named Alternatives", () => {
                class CstAlternationNestedAltParser extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OR([
                            {
                                NAME: "$first_alternative",
                                ALT:  () => {
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

                let input = [createToken(A)]
                let parser = new CstAlternationNestedAltParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$first_alternative", "B", "bamba")
                let firstAltCst = cst.children.$first_alternative[0]
                expect(tokenMatcher(firstAltCst.children.A[0], A)).to.be.true
                expect(cst.children.bamba[0]).to.be.undefined
                expect(cst.children.B[0]).to.be.undefined
            })

            it("Can output a CST when using OR", () => {
                class CstAlternationNestedParser extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OR({
                            NAME: "$nestedOr",
                            DEF:  [
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

                let input = [createToken(A)]
                let parser = new CstAlternationNestedParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedOr")
                let orCst = cst.children.$nestedOr[0]
                expect(orCst.children).to.have.keys("A", "B", "bamba")
                expect(tokenMatcher(orCst.children.A[0], A)).to.be.true
                expect(orCst.children.bamba[0]).to.be.undefined
                expect(orCst.children.B[0]).to.be.undefined
            })

            it("Can output a CST when using OR - single Alt", () => {
                class CstAlternationNestedAltSingleParser extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.OR(
                            [
                                {
                                    NAME: "$nestedAlt",
                                    ALT:  () => {
                                        this.CONSUME(B)
                                        this.SUBRULE(this.bamba)
                                    }
                                }
                            ]
                        )
                    })

                    public bamba = this.RULE("bamba", () => {
                        this.CONSUME(C)
                    })
                }

                let input = [createToken(B), createToken(C)]
                let parser = new CstAlternationNestedAltSingleParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedAlt")
                let altCst = cst.children.$nestedAlt[0]
                expect(altCst.children).to.have.keys("B", "bamba")
                expect(tokenMatcher(altCst.children.B[0], B)).to.be.true
                expect(altCst.children.bamba[0].children).to.have.keys("C")
            })

            it("Can output a CST using Repetitions", () => {
                class CstMultiTerminalWithManyNestedParser extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.MANY({
                            NAME: "$nestedMany",
                            DEF:  () => {
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

                let input = [createToken(A), createToken(C), createToken(A), createToken(C), createToken(A), createToken(C), createToken(B)]
                let parser = new CstMultiTerminalWithManyNestedParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("B", "$nestedMany")
                expect(tokenMatcher(cst.children.B[0], B)).to.be.true
                let nestedManyCst = cst.children.$nestedMany[0]
                expect(nestedManyCst.children).to.have.keys("A", "bamba")

                expect(nestedManyCst.children.A).to.have.length(3)
                expect(tokenMatcher(nestedManyCst.children.A[0], A)).to.be.true
                expect(tokenMatcher(nestedManyCst.children.A[1], A)).to.be.true
                expect(tokenMatcher(nestedManyCst.children.A[2], A)).to.be.true

                expect(nestedManyCst.children.bamba).to.have.length(3)
                expect(tokenMatcher(nestedManyCst.children.bamba[0].children.C[0], C)).to.be.true
                expect(tokenMatcher(nestedManyCst.children.bamba[1].children.C[0], C)).to.be.true
                expect(tokenMatcher(nestedManyCst.children.bamba[2].children.C[0], C)).to.be.true
            })

            it("Can output a CST using mandatory Repetitions", () => {
                class CstAtLeastOneNestedParser extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.AT_LEAST_ONE({
                            NAME: "$oops",
                            DEF:  () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [createToken(A), createToken(A), createToken(A), createToken(B)]
                let parser = new CstAtLeastOneNestedParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$oops", "B")
                expect(tokenMatcher(cst.children.B[0], B)).to.be.true
                let oopsCst = cst.children.$oops[0]
                expect(oopsCst.children).to.have.keys("A")
                expect(oopsCst.children.A).to.have.length(3)
                expect(tokenMatcher(oopsCst.children.A[0], A)).to.be.true
                expect(tokenMatcher(oopsCst.children.A[1], A)).to.be.true
                expect(tokenMatcher(oopsCst.children.A[2], A)).to.be.true
            })

            it("Can output a CST using Repetitions with separator", () => {
                class CstNestedRuleWithManySepParser extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.MANY_SEP({
                            NAME: "$pizza",
                            SEP:  C, DEF: () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [createToken(A), createToken(C), createToken(A), createToken(B)]
                let parser = new CstNestedRuleWithManySepParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$pizza", "B")
                expect(tokenMatcher(cst.children.B[0], B)).to.be.true
                let pizzaCst = cst.children.$pizza[0]
                expect(pizzaCst.children.A).to.have.length(2)
                expect(tokenMatcher(pizzaCst.children.A[0], A)).to.be.true
                expect(tokenMatcher(pizzaCst.children.A[1], A)).to.be.true
                expect(pizzaCst.children.C).to.have.length(1)
                expect(tokenMatcher(pizzaCst.children.C[0], C)).to.be.true
            })

            it("Can output a CST using Repetitions with separator - mandatory", () => {
                class CstAtLeastOneSepNestedParser extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public testRule = this.RULE("testRule", () => {
                        this.AT_LEAST_ONE_SEP({
                            NAME: "$nestedName",
                            SEP:  C, DEF: () => {
                                this.CONSUME(A)
                            }
                        })
                        this.CONSUME(B)
                    })
                }

                let input = [createToken(A), createToken(C), createToken(A), createToken(B)]
                let parser = new CstAtLeastOneSepNestedParser(input)
                let cst = parser.testRule()
                expect(cst.name).to.equal("testRule")
                expect(cst.children).to.have.keys("$nestedName", "B")
                expect(tokenMatcher(cst.children.B[0], B)).to.be.true

                let nestedCst = cst.children.$nestedName[0]
                expect(nestedCst.children.A).to.have.length(2)
                expect(tokenMatcher(nestedCst.children.A[0], A)).to.be.true
                expect(tokenMatcher(nestedCst.children.A[1], A)).to.be.true
                expect(nestedCst.children.C).to.have.length(1)
                expect(tokenMatcher(nestedCst.children.C[0], C)).to.be.true
            })
        })

        context("Error Recovery", () => {
            it("re-sync recovery", () => {
                class CstRecoveryParserReSync extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true, recoveryEnabled: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public root = this.RULE("root", () => {
                        this.MANY(() => {
                            this.OR([
                                {ALT: () => { this.SUBRULE(this.first) }},
                                {ALT: () => { this.SUBRULE(this.second) }}
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

                    protected canTokenTypeBeInsertedInRecovery(tokClass:Function):boolean {
                        // we want to force re-sync recovery
                        return false
                    }
                }


                let input = createTokenVector([A, E, E, C, D])
                let parser = new CstRecoveryParserReSync(input)
                let cst = parser.root()
                expect(parser.errors).to.have.lengthOf(1)
                expect(parser.errors[0].message).to.include("Expecting token of type --> B <--")
                expect(parser.errors[0].resyncedTokens).to.have.lengthOf(1)
                expect(tokenMatcher(parser.errors[0].resyncedTokens[0], E)).to.be.true

                // expect(parser.errors[0]).
                expect(cst.name).to.equal("root")
                expect(cst.children).to.have.keys("first", "second")

                let firstCollection = cst.children.first
                expect(firstCollection).to.have.lengthOf(1)
                let first = firstCollection[0]
                expect(first.recoveredNode).to.be.true
                expect(first.children).to.have.keys("A", "B")
                expect(tokenMatcher(first.children.A[0], A)).to.be.true
                expect(first.children.B[0]).to.be.undefined

                let secondCollection = cst.children.second
                expect(secondCollection).to.have.lengthOf(1)
                let second = secondCollection[0]
                expect(second.recoveredNode).to.be.undefined
                expect(second.children).to.have.keys("C", "D")
                expect(tokenMatcher(second.children.C[0], C)).to.be.true
                expect(tokenMatcher(second.children.D[0], D)).to.be.true
            })

            it("re-sync recovery nested", () => {
                class CstRecoveryParserReSyncNested extends Parser {

                    constructor(input:Token[] = []) {
                        super(input, ALL_TOKENS, {outputCst: true, recoveryEnabled: true});
                        (<any>Parser).performSelfAnalysis(this)
                    }

                    public root = this.RULE("root", () => {
                        this.MANY(() => {
                            this.OR([
                                {ALT: () => { this.SUBRULE(this.first_root) }},
                                {ALT: () => { this.SUBRULE(this.second) }}
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

                    protected canTokenTypeBeInsertedInRecovery(tokClass:Function):boolean {
                        // we want to force re-sync recovery
                        return false
                    }
                }


                let input = createTokenVector([A, E, E, C, D])
                let parser = new CstRecoveryParserReSyncNested(input)
                let cst = parser.root()
                expect(parser.errors).to.have.lengthOf(1)
                expect(parser.errors[0].message).to.include("Expecting token of type --> B <--")
                expect(parser.errors[0].resyncedTokens).to.have.lengthOf(1)
                expect(tokenMatcher(parser.errors[0].resyncedTokens[0], E)).to.be.true

                expect(cst.name).to.equal("root")
                expect(cst.children).to.have.keys("first_root", "second")

                let firstRootCollection = cst.children.first_root
                expect(firstRootCollection).to.have.lengthOf(1)
                let firstRoot = firstRootCollection[0]
                expect(firstRoot.children).to.have.keys("first")

                let first = firstRoot.children.first[0]
                expect(first.recoveredNode).to.be.true
                expect(first.children).to.have.keys("A", "B")
                expect(tokenMatcher(first.children.A[0], A)).to.be.true
                expect(first.children.B[0]).to.be.undefined

                let secondCollection = cst.children.second
                expect(secondCollection).to.have.lengthOf(1)
                let second = secondCollection[0]
                expect(second.recoveredNode).to.be.undefined
                expect(second.children).to.have.keys("C", "D")
                expect(tokenMatcher(second.children.C[0], C)).to.be.true
                expect(tokenMatcher(second.children.D[0], D)).to.be.true
            })


        })

        after(() => {
            clearCache()
        })
    })
}

defineCstSpecs("Regular Tokens Mode", extendToken, createRegularToken, tokenStructuredMatcher)
