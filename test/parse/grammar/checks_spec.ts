import {
    Parser,
    ParserDefinitionErrorType,
    EMPTY_ALT
} from "../../../src/parse/parser_public"
import { IdentTok, DotTok, qualifiedName, actionDec } from "./samples"
import { gast } from "../../../src/parse/grammar/gast_public"
import {
    validateRuleName,
    validateGrammar,
    identifyProductionForDuplicates,
    OccurrenceValidationCollector,
    getFirstNoneTerminal,
    validateRuleDoesNotAlreadyExist,
    validateRuleIsOverridden,
    validateTooManyAlts
} from "../../../src/parse/grammar/checks"
import { createToken, IToken } from "../../../src/scan/tokens_public"
import { forEach, first, map } from "../../../src/utils/utils"

let Rule = gast.Rule
let RepetitionMandatory = gast.RepetitionMandatory
let Repetition = gast.Repetition
let NonTerminal = gast.NonTerminal
let Terminal = gast.Terminal
let Option = gast.Option
let Alternation = gast.Alternation
let Flat = gast.Flat

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

        let qualifiedNameErr1 = new Rule("qualifiedNameErr1", [
            new Terminal(IdentTok, 1),
            new Repetition([
                new Terminal(DotTok),
                new Terminal(IdentTok, 1) // duplicate Terminal IdentTok with occurrence index 1
            ])
        ])

        let qualifiedNameErr2 = new Rule("qualifiedNameErr2", [
            new Terminal(IdentTok, 1),
            new Repetition([new Terminal(DotTok), new Terminal(IdentTok, 2)]),
            new Repetition([new Terminal(DotTok), new Terminal(IdentTok, 2)])
        ])
        let actualErrors = validateGrammar(
            [qualifiedNameErr1, qualifiedNameErr2],
            5,
            [],
            {}
        )
        expect(actualErrors.length).to.equal(4)

        forEach(actualErrors, err => delete err.message)
        expect(actualErrors).to.deep.include.members(expectedErrorsNoMsg)
        expect(expectedErrorsNoMsg).to.deep.include.members(actualErrors)
    })

    it("does not allow duplicate grammar rule names", () => {
        let noErrors = validateRuleDoesNotAlreadyExist(
            "A",
            ["B", "C"],
            "className"
        )
        //noinspection BadExpressionStatementJS
        expect(noErrors).to.be.empty

        let duplicateErr = validateRuleDoesNotAlreadyExist(
            "A",
            ["A", "B", "C"],
            "className"
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
        let res1 = validateRuleName("1baa")
        expect(res1).to.have.lengthOf(1)
        expect(res1[0]).to.have.property("message")
        expect(res1[0]).to.have.property(
            "type",
            ParserDefinitionErrorType.INVALID_RULE_NAME
        )
        expect(res1[0]).to.have.property("ruleName", "1baa")

        let res2 = validateRuleName("שלום")
        expect(res2).to.have.lengthOf(1)
        expect(res2[0]).to.have.property("message")
        expect(res2[0]).to.have.property(
            "type",
            ParserDefinitionErrorType.INVALID_RULE_NAME
        )
        expect(res2[0]).to.have.property("ruleName", "שלום")

        let res3 = validateRuleName("$bamba")
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
            new NonTerminal("ActionDeclaration")
        )
        expect(dslCode).to.equal("SUBRULE_#_1_#_ActionDeclaration")
    })

    it("generates DSL code for a OPTION", () => {
        let dslCode = identifyProductionForDuplicates(new Option([], 3))
        expect(dslCode).to.equal("OPTION_#_3_#_")
    })

    it("generates DSL code for a AT_LEAST_ONE", () => {
        let dslCode = identifyProductionForDuplicates(
            new RepetitionMandatory([])
        )
        expect(dslCode).to.equal("AT_LEAST_ONE_#_1_#_")
    })

    it("generates DSL code for a MANY", () => {
        let dslCode = identifyProductionForDuplicates(new Repetition([], 5))
        expect(dslCode).to.equal("MANY_#_5_#_")
    })

    it("generates DSL code for a OR", () => {
        let dslCode = identifyProductionForDuplicates(new Alternation([], 1))
        expect(dslCode).to.equal("OR_#_1_#_")
    })

    it("generates DSL code for a Terminal", () => {
        let dslCode = identifyProductionForDuplicates(new Terminal(IdentTok, 4))
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
let dummyRule = new Rule("dummyRule", [new Terminal(DummyToken)])
let dummyRule2 = new Rule("dummyRule2", [new Terminal(DummyToken)])
let dummyRule3 = new Rule("dummyRule3", [new Terminal(DummyToken)])

describe("the getFirstNoneTerminal function", () => {
    it("can find the firstNoneTerminal of an empty sequence", () => {
        expect(getFirstNoneTerminal([])).to.be.empty
    })

    it("can find the firstNoneTerminal of a sequence with only one item", () => {
        let result = getFirstNoneTerminal([
            new NonTerminal("dummyRule", dummyRule)
        ])
        expect(result).to.have.length(1)
        expect(first(result).name).to.equal("dummyRule")
    })

    it("can find the firstNoneTerminal of a sequence with two items", () => {
        let sqeuence = [
            new NonTerminal("dummyRule", dummyRule),
            new NonTerminal("dummyRule2", dummyRule2)
        ]
        let result = getFirstNoneTerminal(sqeuence)
        expect(result).to.have.length(1)
        expect(first(result).name).to.equal("dummyRule")
    })

    it("can find the firstNoneTerminal of a sequence with two items where the first is optional", () => {
        let sqeuence = [
            new Option([new NonTerminal("dummyRule", dummyRule)]),
            new NonTerminal("dummyRule2", dummyRule2)
        ]
        let result = getFirstNoneTerminal(sqeuence)
        expect(result).to.have.length(2)
        let resultRuleNames = map(result, currItem => currItem.name)
        expect(resultRuleNames).to.include.members(["dummyRule", "dummyRule2"])
    })

    it("can find the firstNoneTerminal of an alternation", () => {
        let alternation = [
            new Alternation([
                new Flat([new NonTerminal("dummyRule", dummyRule)]),
                new Flat([new NonTerminal("dummyRule2", dummyRule2)]),
                new Flat([new NonTerminal("dummyRule3", dummyRule3)])
            ])
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
            new Repetition([
                new Flat([new NonTerminal("dummyRule", dummyRule)]),
                new Flat([new NonTerminal("dummyRule2", dummyRule2)])
            ]),
            new NonTerminal("dummyRule3", dummyRule3)
        ]
        let result = getFirstNoneTerminal(alternation)
        expect(result).to.have.length(2)
        let resultRuleNames = map(result, currItem => currItem.name)
        expect(resultRuleNames).to.include.members(["dummyRule", "dummyRule3"])
    })

    it("can find the firstNoneTerminal of a mandatory repetition", () => {
        let alternation = [
            new RepetitionMandatory([
                new Flat([new NonTerminal("dummyRule", dummyRule)]),
                new Flat([new NonTerminal("dummyRule2", dummyRule2)])
            ]),
            new NonTerminal("dummyRule3", dummyRule3)
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

class ErroneousOccurrenceNumUsageParser1 extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [PlusTok])
        Parser.performSelfAnalysis(this)
    }

    public duplicateRef = this.RULE("duplicateRef", () => {
        this.SUBRULE1(this.anotherRule)
        this.SUBRULE(this.anotherRule)
    })

    public anotherRule = this.RULE("anotherRule", () => {
        this.CONSUME(PlusTok)
    })
}

class ErroneousOccurrenceNumUsageParser2 extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [PlusTok])
        Parser.performSelfAnalysis(this)
    }

    public duplicateTerminal = this.RULE("duplicateTerminal", () => {
        this.CONSUME3(PlusTok)
        this.CONSUME3(PlusTok)
    })
}

class ErroneousOccurrenceNumUsageParser3 extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [PlusTok, MinusTok])
        Parser.performSelfAnalysis(this)
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

let myToken = createToken({ name: "myToken" })
let myOtherToken = createToken({ name: "myOtherToken" })

class ValidOccurrenceNumUsageParser extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [myToken, myOtherToken])
        Parser.performSelfAnalysis(this)
    }

    public anonymousTokens = this.RULE("anonymousTokens", () => {
        this.CONSUME1(myToken)
        this.CONSUME1(myOtherToken)
    })
}

describe("The duplicate occurrence validations full flow", () => {
    it("will throw errors on duplicate Terminals consumption in the same top level rule", () => {
        expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw(
            "SUBRULE"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw("1")
        expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw(
            "duplicateRef"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw(
            "anotherRule"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser1()).to.throw(
            "both have the same occurrence index 1"
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
        expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw("MANY")
        expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw("1")
        expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw(
            "duplicateMany"
        )
        expect(() => new ErroneousOccurrenceNumUsageParser3()).to.throw(
            "both have the same occurrence index 1"
        )
    })

    it("won't detect issues in a Parser using Tokens created by extendToken(...) utility (anonymous)", () => {
        //noinspection JSUnusedLocalSymbols
        let parser = new ValidOccurrenceNumUsageParser()
    })
})

class InvalidRefParser extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [myToken, myOtherToken])
        Parser.performSelfAnalysis(this)
    }

    public one = this.RULE("one", () => {
        this.SUBRULE2((<any>this).oopsTypo)
    })
}

class InvalidRefParser2 extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [myToken, myOtherToken])
        Parser.performSelfAnalysis(this)
    }

    public one = this.RULE("one", () => {
        this.SUBRULE2((<any>this).oopsTypo)
    })
}

describe("The reference resolver validation full flow", () => {
    it("will throw an error when trying to init a parser with unresolved rule references", () => {
        expect(() => new InvalidRefParser()).to.throw("oopsTypo")
        expect(() => new InvalidRefParser()).to.throw(
            "Parser Definition Errors detected"
        )
        expect(() => new InvalidRefParser()).to.throw(
            "reference to a rule which is not defined"
        )
    })

    it(
        "won't throw an error when trying to init a parser with definition errors but with a flag active to defer handling" +
            "of definition errors",
        () => {
            Parser.DEFER_DEFINITION_ERRORS_HANDLING = true
            expect(() => new InvalidRefParser2()).to.not.throw()
            expect(() => new InvalidRefParser2()).to.not.throw()
            expect(() => new InvalidRefParser2()).to.not.throw()
            Parser.DEFER_DEFINITION_ERRORS_HANDLING = false
        }
    )
})

class DuplicateRulesParser extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [myToken, myOtherToken])
        Parser.performSelfAnalysis(this)
    }

    public one = this.RULE("oops_duplicate", () => {})
    public two = this.RULE("oops_duplicate", () => {})
}

class InvalidRuleNameParser extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [myToken, myOtherToken])
        Parser.performSelfAnalysis(this)
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
            "Invalid Grammar rule name"
        )
        expect(() => new InvalidRuleNameParser()).to.throw("שלום")
    })

    it(
        "won't throw an errors when trying to init a parser with definition errors but with a flag active to defer handling" +
            "of definition errors (ruleName validation",
        () => {
            Parser.DEFER_DEFINITION_ERRORS_HANDLING = true
            expect(() => new InvalidRuleNameParser()).to.not.throw()
            expect(() => new InvalidRuleNameParser()).to.not.throw()
            expect(() => new DuplicateRulesParser()).to.not.throw()
            expect(() => new DuplicateRulesParser()).to.not.throw()
            Parser.DEFER_DEFINITION_ERRORS_HANDLING = false
        }
    )
})

class StarToken {
    static PATTERN = /NA/
}

class DirectlyLeftRecursive extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [StarToken])
        Parser.performSelfAnalysis(this)
    }

    public A = this.RULE("A", () => {
        this.SUBRULE1(this.A)
    })
}

class InDirectlyLeftRecursive extends Parser {
    constructor(input: IToken[] = []) {
        super(input, [StarToken])
        Parser.performSelfAnalysis(this)
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
        super(input, [StarToken])
        Parser.performSelfAnalysis(this)
    }

    public A = this.RULE("A", () => {
        this.SUBRULE1(this.B)
    })

    public B = this.RULE("B", () => {
        this.OPTION(() => {
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

    it("will throw an error when trying to init a parser with indirect left recursion", () => {
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
                super(input, [PlusTok, StarTok])
                ;(<any>Parser).performSelfAnalysis(this)
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
                super(input, [PlusTok, StarTok])
                ;(<any>Parser).performSelfAnalysis(this)
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
                super(input, [PlusTok, StarTok])
                ;(<any>Parser).performSelfAnalysis(this)
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
            "Ambiguous alternative"
        )
        expect(() => new AltAmbiguityParserImplicitOccurence()).to.throw("1")
        expect(() => new AltAmbiguityParserImplicitOccurence()).to.throw("2")
        expect(() => new AltAmbiguityParserImplicitOccurence()).to.throw(
            "<PlusTok, StarTok> may appears as a prefix path"
        )
    })

    it("will throw an error when an empty alternative is not the last alternative #2", () => {
        class EmptyAltAmbiguityParser extends Parser {
            constructor(input: IToken[] = []) {
                super(input, [PlusTok, StarTok])
                ;(<any>Parser).performSelfAnalysis(this)
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
        expect(() => new EmptyAltAmbiguityParser()).to.throw(
            "Ambiguous empty alternative"
        )
        expect(() => new EmptyAltAmbiguityParser()).to.throw("1")
        expect(() => new EmptyAltAmbiguityParser()).to.throw(
            "Only the last alternative may be an empty alternative."
        )
        expect(() => new EmptyAltAmbiguityParser()).to.not.throw("undefined")
    })
})

describe("The prefix ambiguity detection full flow", () => {
    it("will throw an error when an a common prefix ambiguity is detected", () => {
        class PrefixAltAmbiguity extends Parser {
            constructor(input: IToken[] = []) {
                super(input, [PlusTok, MinusTok, StarTok])
                ;(<any>Parser).performSelfAnalysis(this)
            }

            public prefixAltAmbiguity = this.RULE("prefixAltAmbiguity", () => {
                this.OR3([
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
        expect(() => new PrefixAltAmbiguity()).to.throw("OR3")
        expect(() => new PrefixAltAmbiguity()).to.throw(
            "Ambiguous alternatives"
        )
        expect(() => new PrefixAltAmbiguity()).to.throw(
            "due to common lookahead prefix"
        )
        expect(() => new PrefixAltAmbiguity()).to.throw("<PlusTok, MinusTok>")
        expect(() => new PrefixAltAmbiguity()).to.throw(
            "See https://github.com/SAP/chevrotain/blob/master/docs/resolving_grammar_errors.md#COMMON_PREFIX"
        )
    })

    it("will throw an error when an a common prefix ambiguity is detected - implicit occurrence idx", () => {
        class PrefixAltAmbiguity2 extends Parser {
            constructor(input: IToken[] = []) {
                super(input, [PlusTok, MinusTok, StarTok])
                ;(<any>Parser).performSelfAnalysis(this)
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
            "See https://github.com/SAP/chevrotain/blob/master/docs/resolving_grammar_errors.md#COMMON_PREFIX"
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
                super(input, [Bamba, A])
                Parser.performSelfAnalysis(this)
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
                super(input, [A])
                Parser.performSelfAnalysis(this)
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
                super(input, [A, B])
                Parser.performSelfAnalysis(this)
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
                super(input, [במבה, A])
                Parser.performSelfAnalysis(this)
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
    class EmptyLookaheadParser extends Parser {
        constructor(input: IToken[] = []) {
            super(input, [PlusTok])
        }

        public block = this.RULE("block", () => this.CONSUME(PlusTok))
    }
    it("will throw an error when there are no non-empty lookaheads for AT_LEAST_ONE", () => {
        class EmptyLookaheadParserAtLeastOne extends EmptyLookaheadParser {
            constructor(input: IToken[] = []) {
                super(input)
                ;(<any>Parser).performSelfAnalysis(this)
            }

            public someRule = this.RULE("someRule", () =>
                this.AT_LEAST_ONE(this.block)
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
        class EmptyLookaheadParserAtLeastOneSep extends EmptyLookaheadParser {
            constructor(input: IToken[] = []) {
                super(input)
                ;(<any>Parser).performSelfAnalysis(this)
            }

            public someRule = this.RULE("someRule", () =>
                this.AT_LEAST_ONE_SEP5({
                    SEP: PlusTok,
                    DEF: this.block
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
        class EmptyLookaheadParserMany extends EmptyLookaheadParser {
            constructor(input: IToken[] = []) {
                super(input)
                ;(<any>Parser).performSelfAnalysis(this)
            }

            public someRule = this.RULE("someRule", () =>
                this.MANY2(this.block)
            )
        }
        expect(() => new EmptyLookaheadParserMany()).to.throw(
            "The repetition <MANY2>"
        )
        expect(() => new EmptyLookaheadParserMany()).to.throw(
            "<someRule> can never consume any tokens"
        )
    })

    it("will throw an error when there are no non-empty lookaheads for MANY_SEP", () => {
        class EmptyLookaheadParserManySep extends EmptyLookaheadParser {
            constructor(input: IToken[] = []) {
                super(input)
                ;(<any>Parser).performSelfAnalysis(this)
            }

            public someRule = this.RULE("someRule", () =>
                this.MANY_SEP3({
                    SEP: PlusTok,
                    DEF: this.block
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
                new Flat([new NonTerminal("dummyRule", dummyRule)])
            )
        }

        const ruleWithTooManyAlts = new Rule("blah", [
            new Alternation(alternatives)
        ])

        const actual = validateTooManyAlts(ruleWithTooManyAlts)
        expect(actual).to.have.lengthOf(1)
        expect(actual[0].type).to.equal(ParserDefinitionErrorType.TOO_MANY_ALTS)
        expect(actual[0].ruleName).to.equal("blah")
        expect(actual[0].message).to.contain(
            "An Alternation cannot have more than 256 alternatives"
        )
    })
})
