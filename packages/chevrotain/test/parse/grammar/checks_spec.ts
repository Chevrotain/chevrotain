import {
    CstParser,
    Parser
} from "../../../src/parse/parser/traits/parser_traits"
import {
    EMPTY_ALT,
    END_OF_FILE,
    ParserDefinitionErrorType
} from "../../../src/parse/parser/parser"
import { actionDec, DotTok, IdentTok, qualifiedName } from "./samples"
import {
    getFirstNoneTerminal,
    identifyProductionForDuplicates,
    OccurrenceValidationCollector,
    validateGrammar,
    validateRuleDoesNotAlreadyExist,
    validateRuleIsOverridden,
    validateRuleName,
    validateTooManyAlts
} from "../../../src/parse/grammar/checks"
import { createToken } from "../../../src/scan/tokens_public"
import { first, forEach, map } from "../../../src/utils/utils"
import {
    Alternation,
    Flat,
    NonTerminal,
    Option,
    Repetition,
    RepetitionMandatory,
    Rule,
    Terminal
} from "../../../src/parse/grammar/gast/gast_public"
import { defaultGrammarValidatorErrorProvider } from "../../../src/parse/errors_public"
import { IToken } from "../../../api"

describe("the grammar validations", () => {
    it("validates every one of the TOP_RULEs in the input", () => {
        let expectedErrorsNoMsg = [
            {
                type: ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName: "qualifiedNameErr1",
                dslName: "CONSUME",
                occurrence: 1,
                parameter: "IdentTok"
            },
            {
                type: ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName: "qualifiedNameErr2",
                dslName: "MANY",
                occurrence: 1
            },
            {
                type: ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName: "qualifiedNameErr2",
                dslName: "CONSUME",
                occurrence: 1,
                parameter: "DotTok"
            },
            {
                type: ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
                ruleName: "qualifiedNameErr2",
                dslName: "CONSUME",
                occurrence: 2,
                parameter: "IdentTok"
            }
        ]

        let qualifiedNameErr1 = new Rule({
            name: "qualifiedNameErr1",
            definition: [
                new Terminal({ terminalType: IdentTok, idx: 1 }),
                new Repetition({
                    definition: [
                        new Terminal({ terminalType: DotTok }),
                        new Terminal({
                            terminalType: IdentTok,
                            idx: 1
                        }) // duplicate Terminal IdentTok with occurrence index 1
                    ]
                })
            ]
        })

        let qualifiedNameErr2 = new Rule({
            name: "qualifiedNameErr2",
            definition: [
                new Terminal({ terminalType: IdentTok, idx: 1 }),
                new Repetition({
                    definition: [
                        new Terminal({ terminalType: DotTok }),
                        new Terminal({
                            terminalType: IdentTok,
                            idx: 2
                        })
                    ]
                }),
                new Repetition({
                    definition: [
                        new Terminal({ terminalType: DotTok }),
                        new Terminal({
                            terminalType: IdentTok,
                            idx: 2
                        })
                    ]
                })
            ]
        })
        let actualErrors = validateGrammar(
            [qualifiedNameErr1, qualifiedNameErr2],
            5,
            [],
            {},
            defaultGrammarValidatorErrorProvider,
            "bamba"
        )
        expect(actualErrors.length).to.equal(4)

        forEach(actualErrors, err => delete err.message)
        expect(actualErrors).to.deep.include.members(expectedErrorsNoMsg)
        expect(expectedErrorsNoMsg).to.deep.include.members(actualErrors)
    })

    it("does not allow duplicate grammar rule names", () => {
        let noErrors = validateRuleDoesNotAlreadyExist(
            new Rule({ name: "A", definition: [] }),
            [
                new Rule({ name: "B", definition: [] }),
                new Rule({ name: "C", definition: [] })
            ],
            "className",
            defaultGrammarValidatorErrorProvider
        )
        //noinspection BadExpressionStatementJS
        expect(noErrors).to.be.empty

        let duplicateErr = validateRuleDoesNotAlreadyExist(
            new Rule({ name: "A", definition: [] }),
            [
                new Rule({ name: "A", definition: [] }),
                new Rule({ name: "A", definition: [] }),
                new Rule({ name: "B", definition: [] }),
                new Rule({ name: "C", definition: [] })
            ],
            "className",
            defaultGrammarValidatorErrorProvider
        )
        //noinspection BadExpressionStatementJS
        expect(duplicateErr).to.have.length(1)
        expect(duplicateErr[0]).to.have.property("message")
        expect(duplicateErr[0]).to.have.property(
            "type",
            ParserDefinitionErrorType.DUPLICATE_RULE_NAME
        )
        expect(duplicateErr[0]).to.have.property("ruleName", "A")
    })

    it("only allows a subset of ECMAScript identifiers as rule names", () => {
        let res1 = validateRuleName(
            new Rule({ name: "1baa", definition: [] }),
            defaultGrammarValidatorErrorProvider
        )
        expect(res1).to.have.lengthOf(1)
        expect(res1[0]).to.have.property("message")
        expect(res1[0]).to.have.property(
            "type",
            ParserDefinitionErrorType.INVALID_RULE_NAME
        )
        expect(res1[0]).to.have.property("ruleName", "1baa")

        let res2 = validateRuleName(
            new Rule({ name: "שלום", definition: [] }),
            defaultGrammarValidatorErrorProvider
        )
        expect(res2).to.have.lengthOf(1)
        expect(res2[0]).to.have.property("message")
        expect(res2[0]).to.have.property(
            "type",
            ParserDefinitionErrorType.INVALID_RULE_NAME
        )
        expect(res2[0]).to.have.property("ruleName", "שלום")

        let res3 = validateRuleName(
            new Rule({ name: "$bamba", definition: [] }),
            defaultGrammarValidatorErrorProvider
        )
        expect(res3).to.have.lengthOf(1)
        expect(res3[0]).to.have.property("message")
        expect(res3[0]).to.have.property(
            "type",
            ParserDefinitionErrorType.INVALID_RULE_NAME
        )
        expect(res3[0]).to.have.property("ruleName", "$bamba")
    })

    it("does not allow overriding a rule which does not already exist", () => {
        let positive = validateRuleIsOverridden(
            "AAA",
            ["BBB", "CCC"],
            "className"
        )
        expect(positive).to.have.lengthOf(1)
        expect(positive[0].message).to.contain("Invalid rule override")
        expect(positive[0].type).to.equal(
            ParserDefinitionErrorType.INVALID_RULE_OVERRIDE
        )
        expect(positive[0].ruleName).to.equal("AAA")

        let negative = validateRuleIsOverridden(
            "AAA",
            ["BBB", "CCC", "AAA"],
            "className"
        )
        expect(negative).to.have.lengthOf(0)
    })
})

describe("identifyProductionForDuplicates function", () => {
    it("generates DSL code for a ProdRef", () => {
        let dslCode = identifyProductionForDuplicates(
            new NonTerminal({ nonTerminalName: "ActionDeclaration" })
        )
        expect(dslCode).to.equal("SUBRULE_#_1_#_ActionDeclaration")
    })

    it("generates DSL code for a OPTION", () => {
        let dslCode = identifyProductionForDuplicates(
            new Option({ definition: [], idx: 3 })
        )
        expect(dslCode).to.equal("OPTION_#_3_#_")
    })

    it("generates DSL code for a AT_LEAST_ONE", () => {
        let dslCode = identifyProductionForDuplicates(
            new RepetitionMandatory({ definition: [] })
        )
        expect(dslCode).to.equal("AT_LEAST_ONE_#_1_#_")
    })

    it("generates DSL code for a MANY", () => {
        let dslCode = identifyProductionForDuplicates(
            new Repetition({ definition: [], idx: 5 })
        )
        expect(dslCode).to.equal("MANY_#_5_#_")
    })

    it("generates DSL code for a OR", () => {
        let dslCode = identifyProductionForDuplicates(
            new Alternation({ definition: [], idx: 1 })
        )
        expect(dslCode).to.equal("OR_#_1_#_")
    })

    it("generates DSL code for a Terminal", () => {
        let dslCode = identifyProductionForDuplicates(
            new Terminal({ terminalType: IdentTok, idx: 4 })
        )
        expect(dslCode).to.equal("CONSUME_#_4_#_IdentTok")
    })
})

describe("OccurrenceValidationCollector GASTVisitor class", () => {
    it("collects all the productions relevant to occurrence validation", () => {
        let qualifiedNameVisitor = new OccurrenceValidationCollector()
        qualifiedName.accept(qualifiedNameVisitor)
        expect(qualifiedNameVisitor.allProductions.length).to.equal(4)

        // TODO: check set equality

        let actionDecVisitor = new OccurrenceValidationCollector()
        actionDec.accept(actionDecVisitor)
        expect(actionDecVisitor.allProductions.length).to.equal(13)

        // TODO: check set equality
    })
})

class DummyToken {
    static PATTERN = /NA/
}
let dummyRule = new Rule({
    name: "dummyRule",
    definition: [new Terminal({ terminalType: DummyToken })]
})
let dummyRule2 = new Rule({
    name: "dummyRule2",
    definition: [new Terminal({ terminalType: DummyToken })]
})
let dummyRule3 = new Rule({
    name: "dummyRule3",
    definition: [new Terminal({ terminalType: DummyToken })]
})

describe("the getFirstNoneTerminal function", () => {
    it("can find the firstNoneTerminal of an empty sequence", () => {
        expect(getFirstNoneTerminal([])).to.be.empty
    })

    it("can find the firstNoneTerminal of a sequence with only one item", () => {
        let result = getFirstNoneTerminal([
            new NonTerminal({
                nonTerminalName: "dummyRule",
                referencedRule: dummyRule
            })
        ])
        expect(result).to.have.length(1)
        expect(first(result).name).to.equal("dummyRule")
    })

    it("can find the firstNoneTerminal of a sequence with two items", () => {
        let sqeuence = [
            new NonTerminal({
                nonTerminalName: "dummyRule",
                referencedRule: dummyRule
            }),
            new NonTerminal({
                nonTerminalName: "dummyRule2",
                referencedRule: dummyRule2
            })
        ]
        let result = getFirstNoneTerminal(sqeuence)
        expect(result).to.have.length(1)
        expect(first(result).name).to.equal("dummyRule")
    })

    it("can find the firstNoneTerminal of a sequence with two items where the first is optional", () => {
        let sqeuence = [
            new Option({
                definition: [
                    new NonTerminal({
                        nonTerminalName: "dummyRule",
                        referencedRule: dummyRule
                    })
                ]
            }),
            new NonTerminal({
                nonTerminalName: "dummyRule2",
                referencedRule: dummyRule2
            })
        ]
        let result = getFirstNoneTerminal(sqeuence)
        expect(result).to.have.length(2)
        let resultRuleNames = map(result, currItem => currItem.name)
        expect(resultRuleNames).to.include.members(["dummyRule", "dummyRule2"])
    })

    it("can find the firstNoneTerminal of an alternation", () => {
        let alternation = [
            new Alternation({
                definition: [
                    new Flat({
                        definition: [
                            new NonTerminal({
                                nonTerminalName: "dummyRule",
                                referencedRule: dummyRule
                            })
                        ]
                    }),
                    new Flat({
                        definition: [
                            new NonTerminal({
                                nonTerminalName: "dummyRule2",
                                referencedRule: dummyRule2
                            })
                        ]
                    }),
                    new Flat({
                        definition: [
                            new NonTerminal({
                                nonTerminalName: "dummyRule3",
                                referencedRule: dummyRule3
                            })
                        ]
                    })
                ]
            })
        ]
        let result = getFirstNoneTerminal(alternation)
        expect(result).to.have.length(3)
        let resultRuleNames = map(result, currItem => currItem.name)
        expect(resultRuleNames).to.include.members([
            "dummyRule",
            "dummyRule2",
            "dummyRule3"
        ])
    })

    it("can find the firstNoneTerminal of an optional repetition", () => {
        let alternation = [
            new Repetition({
                definition: [
                    new Flat({
                        definition: [
                            new NonTerminal({
                                nonTerminalName: "dummyRule",
                                referencedRule: dummyRule
                            })
                        ]
                    }),
                    new Flat({
                        definition: [
                            new NonTerminal({
                                nonTerminalName: "dummyRule2",
                                referencedRule: dummyRule2
                            })
                        ]
                    })
                ]
            }),
            new NonTerminal({
                nonTerminalName: "dummyRule3",
                referencedRule: dummyRule3
            })
        ]
        let result = getFirstNoneTerminal(alternation)
        expect(result).to.have.length(2)
        let resultRuleNames = map(result, currItem => currItem.name)
        expect(resultRuleNames).to.include.members(["dummyRule", "dummyRule3"])
    })

    it("can find the firstNoneTerminal of a mandatory repetition", () => {
        let alternation = [
            new RepetitionMandatory({
                definition: [
                    new Flat({
                        definition: [
                            new NonTerminal({
                                nonTerminalName: "dummyRule",
                                referencedRule: dummyRule
                            })
                        ]
                    }),
                    new Flat({
                        definition: [
                            new NonTerminal({
                                nonTerminalName: "dummyRule2",
                                referencedRule: dummyRule2
                            })
                        ]
                    })
                ]
            }),
            new NonTerminal({
                nonTerminalName: "dummyRule3",
                referencedRule: dummyRule3
            })
        ]
        let result = getFirstNoneTerminal(alternation)
        expect(result).to.have.length(1)
        let resultRuleNames = map(result, currItem => currItem.name)
        expect(resultRuleNames).to.include.members(["dummyRule"])
    })
})

export class PlusTok {
    static PATTERN = /NA/
}

export class MinusTok {
    static PATTERN = /NA/
}

export class StarTok {
    static PATTERN = /NA/
}

class ErroneousOccurrenceNumUsageParser2 extends Parser {
    constructor(input: IToken[] = []) {
        super([PlusTok])
        this.performSelfAnalysis()
        this.input = input
    }

    public duplicateTerminal = this.RULE("duplicateTerminal", () => {
        this.CONSUME3(PlusTok)
        this.CONSUME3(PlusTok)
    })
}

let myToken = createToken({ name: "myToken" })
let myOtherToken = createToken({ name: "myOtherToken" })

class ValidOccurrenceNumUsageParser extends Parser {
    constructor(input: IToken[] = []) {
        super([myToken, myOtherToken])
        this.performSelfAnalysis()
        this.input = input
    }

    public anonymousTokens = this.RULE("anonymousTokens", () => {
        this.CONSUME1(myToken)
        this.CONSUME1(myOtherToken)
    })
}

describe("The duplicate occurrence validations full flow", () => {
    it("will throw errors on duplicate Terminals consumption in the same top level rule", () => {
        class ErroneousOccurrenceNumUsageParser1 extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public duplicateRef = this.RULE("duplicateRef", () => {
                this.SUBRULE1(this.anotherRule)
                this.SUBRULE1(this.anotherRule)
            })

            public anotherRule = this.RULE("anotherRule", () => {
                this.CONSUME(PlusTok)
            })
        }

        expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw(
            "->SUBRULE1<- with argument: ->anotherRule<-"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw(
            "appears more than once (2 times) in the top level rule: ->duplicateRef<-"
        )
    })

    it("will throw errors on duplicate Subrules references in the same top level rule", () => {
        expect(() => new ErroneousOccurrenceNumUsageParser2()).to.throw(
            "CONSUME"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser2()).to.throw("3")
        expect(() => new ErroneousOccurrenceNumUsageParser2()).to.throw(
            "PlusTok"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser2()).to.throw(
            "duplicateTerminal"
        )
    })

    it("will throw errors on duplicate MANY productions in the same top level rule", () => {
        class ErroneousOccurrenceNumUsageParser3 extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok, MinusTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public duplicateMany = this.RULE("duplicateMany", () => {
                this.MANY(() => {
                    this.CONSUME1(MinusTok)
                    this.MANY(() => {
                        this.CONSUME1(PlusTok)
                    })
                })
            })
        }

        expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw(
            "->MANY<-"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw(
            "appears more than once (2 times) in the top level rule: ->duplicateMany<-"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw(
            "https://sap.github.io/chevrotain/docs/FAQ.html#NUMERICAL_SUFFIXES"
        )
    })

    it("won't detect issues in a Parser using Tokens created by extendToken(...) utility (anonymous)", () => {
        //noinspection JSUnusedLocalSymbols
        let parser = new ValidOccurrenceNumUsageParser()
    })
})

describe("The Recorder runtime checks full flow", () => {
    it("will return EOF for LA calls during recording phase", () => {
        class LookAheadParser extends Parser {
            constructor(input: IToken[] = []) {
                super([myToken, myOtherToken])
                this.performSelfAnalysis()
                this.input = input
            }

            public one = this.RULE("one", () => {
                expect(this.LA(0)).to.equal(END_OF_FILE)
                this.CONSUME(myToken)
            })
        }

        expect(() => new LookAheadParser()).to.not.throw()
    })

    it("won't invoke semantic actions during recording phase", () => {
        class SemanticActionsParsers extends Parser {
            counter: number
            constructor(input: IToken[] = []) {
                super([myToken, myOtherToken])
                this.performSelfAnalysis()
                this.input = input
                this.counter = 0
            }

            public one = this.RULE("one", () => {
                this.ACTION(() => {
                    if (this.RECORDING_PHASE) {
                        throw Error("Should not be executed during recording")
                    }
                })
                this.CONSUME(myToken)
            })
        }

        expect(() => new SemanticActionsParsers()).to.not.throw()
    })

    it("won't execute backtracking during recording phase", () => {
        class BacktrackingRecordingParser extends Parser {
            counter: number
            constructor(input: IToken[] = []) {
                super([myToken, myOtherToken])
                this.counter = 0
                this.performSelfAnalysis()
                this.input = input
            }

            public one = this.RULE("one", () => {
                const backtrackResult = this.BACKTRACK(this.two)()
                if (this.RECORDING_PHASE) {
                    // during recording backtracking always returns true backtracking
                    expect(backtrackResult).to.be.true
                }
                this.CONSUME(myOtherToken)
            })

            public two = this.RULE("two", () => {
                // if this is executed via backtracking the counter will increase
                // once for recording and once for backtracking
                this.counter++
                this.CONSUME(myToken)
            })
        }

        const parser = new BacktrackingRecordingParser()
        expect(parser.counter).to.equal(1)
    })

    it("will throw an error when trying to init a parser with unresolved rule references", () => {
        class InvalidRefParser extends Parser {
            constructor(input: IToken[] = []) {
                super([myToken, myOtherToken])
                this.performSelfAnalysis()
                this.input = input
            }

            public one = this.RULE("one", () => {
                this.SUBRULE((<any>this).oopsTypo)
            })
        }

        expect(() => new InvalidRefParser()).to.throw("<SUBRULE>")
        expect(() => new InvalidRefParser()).to.throw("argument is invalid")
        expect(() => new InvalidRefParser()).to.throw("but got: <undefined>")
        expect(() => new InvalidRefParser()).to.throw(
            "inside top level rule: <one>"
        )
    })

    it("will throw an error when trying to init a parser with unresolved tokenType references", () => {
        class InvalidTokTypeParser extends Parser {
            constructor(input: IToken[] = []) {
                super([myToken, myOtherToken])
                this.performSelfAnalysis()
                this.input = input
            }

            public one = this.RULE("two", () => {
                this.CONSUME3(null)
            })
        }

        expect(() => new InvalidTokTypeParser()).to.throw("<CONSUME3>")
        expect(() => new InvalidTokTypeParser()).to.throw("argument is invalid")
        expect(() => new InvalidTokTypeParser()).to.throw("but got: <null>")
        expect(() => new InvalidTokTypeParser()).to.throw(
            "inside top level rule: <two>"
        )
    })

    context(
        "will throw an error when trying to init a parser with an invalid method idx",
        () => {
            it("consume", () => {
                class InvalidIdxParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super([myToken, myOtherToken])
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public one = this.RULE("one", () => {
                        this.consume(256, myToken)
                    })
                }

                expect(() => new InvalidIdxParser()).to.throw(
                    "Invalid DSL Method idx value: <256>"
                )
                expect(() => new InvalidIdxParser()).to.throw(
                    "Idx value must be a none negative value smaller than 256"
                )
            })

            it("subrule", () => {
                class InvalidIdxParser extends CstParser {
                    constructor(input: IToken[] = []) {
                        super([myToken, myOtherToken])
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public one = this.RULE("one", () => {
                        this.subrule(-1, this.two)
                    })

                    public two = this.RULE("two", () => {
                        this.consume(1, null)
                    })
                }

                expect(() => new InvalidIdxParser()).to.throw(
                    "Invalid DSL Method idx value: <-1>"
                )
                expect(() => new InvalidIdxParser()).to.throw(
                    "Idx value must be a none negative value smaller than 256"
                )
            })

            it("option", () => {
                class InvalidIdxParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super([myToken, myOtherToken])
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public one = this.RULE("one", () => {
                        this.option(666, () => {
                            this.consume(1, myToken)
                        })
                    })
                }

                expect(() => new InvalidIdxParser()).to.throw(
                    "Invalid DSL Method idx value: <666>"
                )
                expect(() => new InvalidIdxParser()).to.throw(
                    "Idx value must be a none negative value smaller than 256"
                )
            })

            it("many", () => {
                class InvalidIdxParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super([myToken, myOtherToken])
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public one = this.RULE("one", () => {
                        this.many(-333, () => {
                            this.consume(1, myToken)
                        })
                    })
                }

                expect(() => new InvalidIdxParser()).to.throw(
                    "Invalid DSL Method idx value: <-333>"
                )
                expect(() => new InvalidIdxParser()).to.throw(
                    "Idx value must be a none negative value smaller than 256"
                )
            })

            it("atLeastOne", () => {
                class InvalidIdxParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super([myToken, myOtherToken])
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public one = this.RULE("one", () => {
                        this.atLeastOne(1999, () => {
                            this.consume(1, myToken)
                        })
                    })
                }

                expect(() => new InvalidIdxParser()).to.throw(
                    "Invalid DSL Method idx value: <1999>"
                )
                expect(() => new InvalidIdxParser()).to.throw(
                    "Idx value must be a none negative value smaller than 256"
                )
            })

            it("or", () => {
                class InvalidIdxParser extends Parser {
                    constructor(input: IToken[] = []) {
                        super([myToken, myOtherToken])
                        this.performSelfAnalysis()
                        this.input = input
                    }

                    public one = this.RULE("one", () => {
                        this.or(543, [
                            {
                                ALT: () => {
                                    this.consume(1, myToken)
                                }
                            }
                        ])
                    })
                }

                expect(() => new InvalidIdxParser()).to.throw(
                    "Invalid DSL Method idx value: <543>"
                )
                expect(() => new InvalidIdxParser()).to.throw(
                    "Idx value must be a none negative value smaller than 256"
                )
            })
        }
    )

    context("augmenting error messages", () => {
        it("will add additional details to other runtime exceptions encountered during recording phase", () => {
            class OtherRecordingErrorParser extends Parser {
                constructor(input: IToken[] = []) {
                    super([myToken, myOtherToken])
                    this.performSelfAnalysis()
                    this.input = input
                }

                public one = this.RULE("two", () => {
                    throw new Error("OOPS")
                })
            }

            expect(() => new OtherRecordingErrorParser()).to.throw(
                'This error was thrown during the "grammar recording phase"'
            )
        })

        it("will not fail when the original error is immutable", () => {
            class OtherRecordingErrorParser extends Parser {
                constructor(input: IToken[] = []) {
                    super([myToken, myOtherToken])
                    this.performSelfAnalysis()
                    this.input = input
                }

                public one = this.RULE("two", () => {
                    // We cannot mutate a string object
                    throw "Oops"
                })
            }

            expect(() => new OtherRecordingErrorParser()).to.throw("Oops")
        })
    })
})

describe("The reference resolver validation full flow", () => {
    it(
        "won't throw an error when trying to init a parser with definition errors but with a flag active to defer handling" +
            "of definition errors",
        () => {
            class DupConsumeParser extends Parser {
                constructor(input: IToken[] = []) {
                    super([myToken, myOtherToken])
                    this.performSelfAnalysis()
                    this.input = input
                }

                public one = this.RULE("one", () => {
                    this.CONSUME(myToken)
                    this.CONSUME(myToken) // duplicate consume with the same suffix.
                })
            }

            ;(Parser as any).DEFER_DEFINITION_ERRORS_HANDLING = true
            expect(() => new DupConsumeParser()).to.not.throw()
            expect(() => new DupConsumeParser()).to.not.throw()
            expect(() => new DupConsumeParser()).to.not.throw()
            ;(Parser as any).DEFER_DEFINITION_ERRORS_HANDLING = false
        }
    )
})

class DuplicateRulesParser extends Parser {
    constructor(input: IToken[] = []) {
        super([myToken, myOtherToken])
        this.performSelfAnalysis()
        this.input = input
    }

    public one = this.RULE("oops_duplicate", () => {})
    public two = this.RULE("oops_duplicate", () => {})
}

class InvalidRuleNameParser extends Parser {
    constructor(input: IToken[] = []) {
        super([myToken, myOtherToken])
        this.performSelfAnalysis()
        this.input = input
    }

    public one = this.RULE("שלום", () => {})
}

describe("The rule names validation full flow", () => {
    it("will throw an error when trying to init a parser with duplicate ruleNames", () => {
        expect(() => new DuplicateRulesParser()).to.throw(
            "is already defined in the grammar"
        )
        expect(() => new DuplicateRulesParser()).to.throw(
            "DuplicateRulesParser"
        )
        expect(() => new DuplicateRulesParser()).to.throw("oops_duplicate")
    })

    it("will throw an error when trying to init a parser with an invalid rule names", () => {
        expect(() => new InvalidRuleNameParser()).to.throw(
            "it must match the pattern"
        )
        expect(() => new InvalidRuleNameParser()).to.throw(
            "Invalid grammar rule name"
        )
        expect(() => new InvalidRuleNameParser()).to.throw("שלום")
    })

    it(
        "won't throw an errors when trying to init a parser with definition errors but with a flag active to defer handling" +
            "of definition errors (ruleName validation",
        () => {
            ;(Parser as any).DEFER_DEFINITION_ERRORS_HANDLING = true
            expect(() => new InvalidRuleNameParser()).to.not.throw()
            expect(() => new InvalidRuleNameParser()).to.not.throw()
            expect(() => new DuplicateRulesParser()).to.not.throw()
            expect(() => new DuplicateRulesParser()).to.not.throw()
            ;(Parser as any).DEFER_DEFINITION_ERRORS_HANDLING = false
        }
    )
})

class StarToken {
    static PATTERN = /NA/
}

class DirectlyLeftRecursive extends Parser {
    constructor(input: IToken[] = []) {
        super([StarToken])
        this.performSelfAnalysis()
        this.input = input
    }

    public A = this.RULE("A", () => {
        this.SUBRULE1(this.A)
    })
}

class InDirectlyLeftRecursive extends Parser {
    constructor(input: IToken[] = []) {
        super([StarToken])
        this.performSelfAnalysis()
        this.input = input
    }

    public A = this.RULE("A", () => {
        this.SUBRULE1(this.B)
    })

    public B = this.RULE("B", () => {
        this.SUBRULE1(this.A)
    })
}

class ComplexInDirectlyLeftRecursive extends Parser {
    constructor(input: IToken[] = []) {
        super([StarToken])
        this.performSelfAnalysis()
        this.input = input
    }

    public A = this.RULE("A", () => {
        this.SUBRULE1(this.B)
    })

    public B = this.RULE("B", () => {
        this.MANY(() => {
            this.SUBRULE1(this.A)
        })
        this.CONSUME(StarToken)
    })
}

describe("The left recursion detection full flow", () => {
    it("will throw an error when trying to init a parser with direct left recursion", () => {
        expect(() => new DirectlyLeftRecursive()).to.throw(
            "Left Recursion found in grammar"
        )
        expect(() => new DirectlyLeftRecursive()).to.throw("A --> A")
    })

    it("will throw an error when trying to init a parser with indirect left recursion", () => {
        expect(() => new InDirectlyLeftRecursive()).to.throw(
            "Left Recursion found in grammar"
        )
        expect(() => new InDirectlyLeftRecursive()).to.throw("A --> B --> A")
    })

    it("will throw an error when trying to init a parser with indirect left recursion - complex", () => {
        expect(() => new ComplexInDirectlyLeftRecursive()).to.throw(
            "Left Recursion found in grammar"
        )
        expect(() => new ComplexInDirectlyLeftRecursive()).to.throw(
            "A --> B --> A"
        )
    })
})

describe("The empty alternative detection full flow", () => {
    it("will throw an error when an empty alternative is not the last alternative", () => {
        class EmptyAltAmbiguityParser extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok, StarTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public noneLastEmpty = this.RULE("noneLastEmpty", () => {
                this.OR1([
                    {
                        ALT: () => {
                            this.CONSUME1(PlusTok)
                        }
                    },
                    {
                        ALT: EMPTY_ALT()
                    }, // empty alternative #2 which is not the last one!
                    // empty alternative #3 which is not the last one!
                    { ALT: () => {} },
                    {
                        ALT: () => {
                            this.CONSUME2(StarTok)
                        }
                    }
                ])
            })
        }
        expect(() => new EmptyAltAmbiguityParser()).to.throw(
            "Ambiguous empty alternative"
        )
        expect(() => new EmptyAltAmbiguityParser()).to.throw("3")
        expect(() => new EmptyAltAmbiguityParser()).to.throw("2")
    })

    it("will throw an error when an empty alternative is not the last alternative - Indirect", () => {
        class EmptyAltIndirectAmbiguityParser extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok, StarTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public noneLastEmpty = this.RULE("noneLastEmpty", () => {
                this.OR1([
                    {
                        ALT: () => {
                            this.CONSUME1(PlusTok)
                        }
                    },
                    {
                        ALT: () => {
                            this.SUBRULE(this.emptyRule)
                        }
                    }, // empty alternative #2 which is not the last one!
                    // empty alternative #3 which is not the last one!
                    { ALT: () => {} },
                    {
                        ALT: () => {
                            this.CONSUME2(StarTok)
                        }
                    }
                ])
            })

            public emptyRule = this.RULE("emptyRule", () => {})
        }
        expect(() => new EmptyAltIndirectAmbiguityParser()).to.throw(
            "Ambiguous empty alternative"
        )
        expect(() => new EmptyAltIndirectAmbiguityParser()).to.throw("3")
        expect(() => new EmptyAltIndirectAmbiguityParser()).to.throw("2")
    })

    it("will detect alternative ambiguity with identical lookaheads", () => {
        class AltAmbiguityParserImplicitOccurence extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok, StarTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public noneLastEmpty = this.RULE("noneLastEmpty", () => {
                this.OR([
                    {
                        ALT: () => {
                            this.CONSUME1(PlusTok)
                            this.CONSUME1(StarTok)
                        }
                    },
                    {
                        ALT: () => {
                            this.CONSUME2(PlusTok)
                            this.CONSUME2(StarTok)
                        }
                    }
                ])
            })
        }
        expect(() => new AltAmbiguityParserImplicitOccurence()).to.throw(
            "Ambiguous Alternatives Detected"
        )
        expect(() => new AltAmbiguityParserImplicitOccurence()).to.throw("1")
        expect(() => new AltAmbiguityParserImplicitOccurence()).to.throw("2")
        expect(() => new AltAmbiguityParserImplicitOccurence()).to.throw(
            "<PlusTok, StarTok> may appears as a prefix path"
        )
    })

    it("will detect alternative ambiguity with identical lookahead - custom maxLookAhead", () => {
        class AltAmbiguityParserImplicitOccurrence extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok, StarTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public noneLastEmpty = this.RULE(
                "AmbiguityDueToExplicitLowLookahead",
                () => {
                    this.OR({
                        MAX_LOOKAHEAD: 1,
                        DEF: [
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                    this.CONSUME1(PlusTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME2(PlusTok)
                                    this.CONSUME2(StarTok)
                                }
                            }
                        ]
                    })
                }
            )
        }
        expect(() => new AltAmbiguityParserImplicitOccurrence()).to.throw(
            "Ambiguous Alternatives Detected"
        )
        expect(() => new AltAmbiguityParserImplicitOccurrence()).to.throw("1")
        expect(() => new AltAmbiguityParserImplicitOccurrence()).to.throw("2")
        expect(() => new AltAmbiguityParserImplicitOccurrence()).to.throw(
            "<PlusTok> may appears as a prefix path"
        )
    })

    context("IGNORE_AMBIGUITIES flag", () => {
        it("will ignore specific alternative ambiguity", () => {
            class IgnoreAlternativeAmbiguitiesFlagParser extends Parser {
                constructor(input: IToken[] = []) {
                    super([PlusTok, StarTok])
                    this.performSelfAnalysis()
                    this.input = input
                }

                public noneLastEmpty = this.RULE("noneLastEmpty", () => {
                    this.OR([
                        {
                            IGNORE_AMBIGUITIES: true,
                            ALT: () => {
                                this.CONSUME1(PlusTok)
                                this.CONSUME1(StarTok)
                            }
                        },
                        {
                            ALT: () => {
                                this.CONSUME2(PlusTok)
                                this.CONSUME2(StarTok)
                            }
                        }
                    ])
                })
            }
            expect(
                () => new IgnoreAlternativeAmbiguitiesFlagParser()
            ).to.not.throw()
        })

        it("will ignore all alternation ambiguities", () => {
            class IgnoreAlternationAmbiguitiesFlagParser extends Parser {
                constructor(input: IToken[] = []) {
                    super([PlusTok, StarTok])
                    this.performSelfAnalysis()
                    this.input = input
                }

                public noneLastEmpty = this.RULE("noneLastEmpty", () => {
                    this.OR({
                        IGNORE_AMBIGUITIES: true,
                        DEF: [
                            {
                                ALT: () => {
                                    this.CONSUME1(PlusTok)
                                    this.CONSUME1(StarTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME2(PlusTok)
                                    this.CONSUME2(StarTok)
                                }
                            },
                            {
                                ALT: () => {
                                    this.CONSUME3(PlusTok)
                                    this.CONSUME3(StarTok)
                                }
                            }
                        ]
                    })
                })
            }
            expect(
                () => new IgnoreAlternationAmbiguitiesFlagParser()
            ).to.not.throw()
        })
    })

    it("will throw an error when an empty alternative is not the last alternative #2", () => {
        class EmptyAltAmbiguityParser2 extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok, StarTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public noneLastEmpty = this.RULE("noneLastEmpty", () => {
                this.OR([
                    // using OR without occurrence suffix, test to check for fix for https://github.com/SAP/chevrotain/issues/101
                    {
                        ALT: EMPTY_ALT()
                    }, // empty alternative #1 which is not the last one!
                    {
                        ALT: () => {
                            this.CONSUME1(PlusTok)
                        }
                    },
                    {
                        ALT: () => {
                            this.CONSUME2(StarTok)
                        }
                    }
                ])
            })
        }
        expect(() => new EmptyAltAmbiguityParser2()).to.throw(
            "Ambiguous empty alternative"
        )
        expect(() => new EmptyAltAmbiguityParser2()).to.throw("1")
        expect(() => new EmptyAltAmbiguityParser2()).to.throw(
            "Only the last alternative may be an empty alternative."
        )
        expect(() => new EmptyAltAmbiguityParser2()).to.not.throw("undefined")
    })
})

describe("The prefix ambiguity detection full flow", () => {
    it("will throw an error when an a common prefix ambiguity is detected - categories", () => {
        let A = createToken({ name: "A" })
        let B = createToken({ name: "B", categories: A })
        let C = createToken({ name: "C" })

        class PrefixAltAmbiguity extends Parser {
            constructor(input: IToken[] = []) {
                super([A, B, C])
                this.performSelfAnalysis()
                this.input = input
            }

            public prefixAltAmbiguity = this.RULE("prefixAltAmbiguity", () => {
                this.OR3([
                    {
                        ALT: () => {
                            this.CONSUME1(B)
                            this.CONSUME1(A)
                        }
                    },
                    {
                        ALT: () => {
                            this.CONSUME2(A)
                            this.CONSUME3(A)
                            this.CONSUME1(C)
                        }
                    }
                ])
            })
        }
        expect(() => new PrefixAltAmbiguity()).to.throw("OR3")
        expect(() => new PrefixAltAmbiguity()).to.throw(
            "Ambiguous alternatives"
        )
        expect(() => new PrefixAltAmbiguity()).to.throw(
            "due to common lookahead prefix"
        )
        expect(() => new PrefixAltAmbiguity()).to.throw("<B, A>")
        expect(() => new PrefixAltAmbiguity()).to.throw(
            "https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#COMMON_PREFIX"
        )
    })

    it("will throw an error when an an alts ambiguity is detected", () => {
        const OneTok = createToken({ name: "OneTok" })
        const TwoTok = createToken({ name: "TwoTok" })
        const Comma = createToken({ name: "Comma" })

        const ALL_TOKENS = [OneTok, TwoTok, Comma]

        class AlternativesAmbiguityParser extends Parser {
            constructor() {
                super(ALL_TOKENS)
                this.performSelfAnalysis()
            }

            public main = this.RULE("main", () => {
                this.OR([
                    { ALT: () => this.SUBRULE(this.alt1) },
                    { ALT: () => this.SUBRULE(this.alt2) }
                ])
            })

            public alt1 = this.RULE("alt1", () => {
                this.MANY(() => {
                    this.CONSUME(Comma)
                })
                this.CONSUME(OneTok)
            })

            public alt2 = this.RULE("alt2", () => {
                this.MANY(() => {
                    this.CONSUME(Comma)
                })
                this.CONSUME(TwoTok)
            })
        }
        expect(() => new AlternativesAmbiguityParser()).to.throw(
            "Ambiguous Alternatives Detected: <1 ,2>"
        )
        expect(() => new AlternativesAmbiguityParser()).to.throw(
            "in <OR> inside <main> Rule"
        )
        expect(() => new AlternativesAmbiguityParser()).to.throw(
            "Comma, Comma, Comma, Comma"
        )
        expect(() => new AlternativesAmbiguityParser()).to.throw(
            "https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#AMBIGUOUS_ALTERNATIVES"
        )
    })

    it("will throw an error when an an alts ambiguity is detected - Categories", () => {
        const A = createToken({ name: "A" })
        const B = createToken({ name: "B" })
        const C = createToken({ name: "C" })
        const D = createToken({ name: "D", categories: C })

        const ALL_TOKENS = [A, B, C, D]

        class AlternativesAmbiguityParser extends Parser {
            constructor() {
                super(ALL_TOKENS)
                this.performSelfAnalysis()
            }

            public main = this.RULE("main", () => {
                this.OR([
                    { ALT: () => this.SUBRULE(this.alt1) },
                    { ALT: () => this.SUBRULE(this.alt2) }
                ])
            })

            public alt1 = this.RULE("alt1", () => {
                this.MANY(() => {
                    this.CONSUME(D)
                })
                this.CONSUME(A)
            })

            public alt2 = this.RULE("alt2", () => {
                this.MANY(() => {
                    this.CONSUME(C)
                })
                this.CONSUME(B)
            })
        }
        expect(() => new AlternativesAmbiguityParser()).to.throw(
            "Ambiguous Alternatives Detected: <1 ,2>"
        )
        expect(() => new AlternativesAmbiguityParser()).to.throw(
            "in <OR> inside <main> Rule"
        )
        expect(() => new AlternativesAmbiguityParser()).to.throw("D, D, D, D")
        expect(() => new AlternativesAmbiguityParser()).to.throw(
            "https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#AMBIGUOUS_ALTERNATIVES"
        )
    })

    // TODO: detect these ambiguity with categories
    it("will throw an error when an a common prefix ambiguity is detected - implicit occurrence idx", () => {
        class PrefixAltAmbiguity2 extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok, MinusTok, StarTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public prefixAltAmbiguity = this.RULE("prefixAltAmbiguity", () => {
                this.OR([
                    {
                        ALT: () => {
                            this.CONSUME1(PlusTok)
                            this.CONSUME1(MinusTok)
                        }
                    },
                    {
                        ALT: () => {
                            this.CONSUME2(PlusTok)
                            this.CONSUME2(MinusTok)
                            this.CONSUME1(StarTok)
                        }
                    }
                ])
            })
        }
        expect(() => new PrefixAltAmbiguity2()).to.throw("OR")
        expect(() => new PrefixAltAmbiguity2()).to.throw(
            "Ambiguous alternatives"
        )
        expect(() => new PrefixAltAmbiguity2()).to.throw(
            "due to common lookahead prefix"
        )
        expect(() => new PrefixAltAmbiguity2()).to.throw("<PlusTok, MinusTok>")
        expect(() => new PrefixAltAmbiguity2()).to.throw(
            "https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#COMMON_PREFIX"
        )
    })
})

describe("The namespace conflict detection full flow", () => {
    it("will throw an error when a Terminal and a NoneTerminal have the same name", () => {
        class Bamba {
            static PATTERN = /NA/
        }
        class A {
            static PATTERN = /NA/
        }

        class NameSpaceConflict extends Parser {
            constructor(input: IToken[] = []) {
                super([Bamba, A])

                this.performSelfAnalysis()
                this.input = input
            }

            public Bamba = this.RULE("Bamba", () => {
                this.CONSUME(A)
            })
        }

        expect(() => new NameSpaceConflict([])).to.throw(
            "The grammar has both a Terminal(Token) and a Non-Terminal(Rule) named: <Bamba>"
        )
    })
})

describe("The nested rule name validation full flow", () => {
    it("will throw an error when a nested name does not start with $(dollar)", () => {
        class A {
            static PATTERN = /NA/
        }

        class NestedNamedInvalid extends Parser {
            constructor(input: IToken[] = []) {
                super([A])
                this.performSelfAnalysis()
                this.input = input
            }

            public someRule = this.RULE("someRule", () => {
                this.OPTION({
                    NAME: "blah",
                    DEF: () => {
                        this.CONSUME(A)
                    }
                })
            })
        }

        expect(() => new NestedNamedInvalid([])).to.throw(
            "Invalid nested rule name: ->blah<- inside rule: ->someRule<-"
        )
    })
})

describe("The duplicated nested name validation full flow", () => {
    it("will throw an error when two nested rules share the same name", () => {
        class A {
            static PATTERN = /NA/
        }
        class B {
            static PATTERN = /NA/
        }

        class NestedNamedDuplicate extends Parser {
            constructor(input: IToken[] = []) {
                super([A, B])
                this.performSelfAnalysis()
                this.input = input
            }

            public someRule = this.RULE("someRule", () => {
                this.OPTION({
                    NAME: "$blah",
                    DEF: () => {
                        this.CONSUME(A)
                    }
                })

                this.OPTION2({
                    NAME: "$blah",
                    DEF: () => {
                        this.CONSUME(B)
                    }
                })
            })
        }
        expect(() => new NestedNamedDuplicate([])).to.throw(
            "Duplicate nested rule name: ->$blah<- inside rule: ->someRule<-"
        )
    })
})

describe("The invalid token name validation", () => {
    it("will throw an error when a Token is using an invalid name", () => {
        class במבה {
            static PATTERN = /NA/
        }
        class A {
            static PATTERN = /NA/
        }

        class InvalidTokenName extends Parser {
            constructor(input: IToken[] = []) {
                super([במבה, A])
                this.performSelfAnalysis()
                this.input = input
            }

            public someRule = this.RULE("someRule", () => {
                this.CONSUME(A)
            })
        }
        expect(() => new InvalidTokenName([])).to.throw(
            "Invalid Grammar Token name: ->במבה<- it must match the pattern: ->/^[a-zA-Z_]\\w*$/<-"
        )
    })
})

describe("The no non-empty lookahead validation", () => {
    it("will throw an error when there are no non-empty lookaheads for AT_LEAST_ONE", () => {
        class EmptyLookaheadParserAtLeastOne extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public someRule = this.RULE("someRule", () =>
                this.AT_LEAST_ONE(() => {})
            )
        }
        expect(() => new EmptyLookaheadParserAtLeastOne()).to.throw(
            "The repetition <AT_LEAST_ONE>"
        )
        expect(() => new EmptyLookaheadParserAtLeastOne()).to.throw(
            "<someRule> can never consume any tokens"
        )
    })

    it("will throw an error when there are no non-empty lookaheads for AT_LEAST_ONE_SEP", () => {
        class EmptyLookaheadParserAtLeastOneSep extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public someRule = this.RULE("someRule", () =>
                this.AT_LEAST_ONE_SEP5({
                    SEP: PlusTok,
                    DEF: () => {}
                })
            )
        }
        expect(() => new EmptyLookaheadParserAtLeastOneSep()).to.throw(
            "The repetition <AT_LEAST_ONE_SEP5>"
        )
        expect(() => new EmptyLookaheadParserAtLeastOneSep()).to.throw(
            "within Rule <someRule>"
        )
    })

    it("will throw an error when there are no non-empty lookaheads for MANY", () => {
        class EmptyLookaheadParserMany extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public someRule = this.RULE("someRule", () => this.MANY2(() => {}))
        }
        expect(() => new EmptyLookaheadParserMany()).to.throw(
            "The repetition <MANY2>"
        )
        expect(() => new EmptyLookaheadParserMany()).to.throw(
            "<someRule> can never consume any tokens"
        )
    })

    it("will throw an error when there are no non-empty lookaheads for MANY_SEP", () => {
        class EmptyLookaheadParserManySep extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok])
                this.performSelfAnalysis()
                this.input = input
            }

            public someRule = this.RULE("someRule", () =>
                this.MANY_SEP3({
                    SEP: PlusTok,
                    DEF: () => {}
                })
            )
        }
        expect(() => new EmptyLookaheadParserManySep()).to.throw(
            "The repetition <MANY_SEP3>"
        )
        expect(() => new EmptyLookaheadParserManySep()).to.throw(
            "within Rule <someRule>"
        )
    })

    it("will throw an error when there are too many alternatives in an alternation", () => {
        const alternatives = []
        for (let i = 0; i < 256; i++) {
            alternatives.push(
                new Flat({
                    definition: [
                        new NonTerminal({
                            nonTerminalName: "dummyRule",
                            referencedRule: dummyRule
                        })
                    ]
                })
            )
        }

        const ruleWithTooManyAlts = new Rule({
            name: "blah",
            definition: [new Alternation({ definition: alternatives })]
        })

        const actual = validateTooManyAlts(
            ruleWithTooManyAlts,
            defaultGrammarValidatorErrorProvider
        )
        expect(actual).to.have.lengthOf(1)
        expect(actual[0].type).to.equal(ParserDefinitionErrorType.TOO_MANY_ALTS)
        expect(actual[0].ruleName).to.equal("blah")
        expect(actual[0].message).to.contain(
            "An Alternation cannot have more than 256 alternatives"
        )
    })
})
