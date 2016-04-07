import {Token, EOF} from "../../src/scan/tokens_public"
import {Parser, EMPTY_ALT} from "../../src/parse/parser_public"
import {HashTable} from "../../src/lang/lang_extensions"
import {getLookaheadFuncsForClass} from "../../src/parse/cache"
import {exceptions} from "../../src/parse/exceptions_public"
import MismatchedTokenException = exceptions.MismatchedTokenException
import NoViableAltException = exceptions.NoViableAltException
import EarlyExitException = exceptions.EarlyExitException

export class PlusTok extends Token {
    static LABEL = "+"

    constructor() { super("+", 0, 1, 1) }
}

export class MinusTok extends Token {
    constructor() { super("-", 0, 1, 1) }
}

export class IntToken extends Token {
    constructor(image:string) { super(image, 0, 1, 1) }
}

export class IdentTok extends Token {
    constructor(image:string) { super(image, 0, 1, 1) }
}

export class DotTok extends Token {
    constructor() { super(".", 0, 1, 1) }
}

const ALL_TOKENS = [PlusTok, MinusTok, IntToken, IdentTok, DotTok]

class ManyRepetitionRecovery extends Parser {

    constructor(input:Token[] = [], isErrorRecoveryEnabled = true) {
        super(input, ALL_TOKENS, isErrorRecoveryEnabled)
        Parser.performSelfAnalysis(this)
    }

    public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, () => { return ["666"] })

    private parseQualifiedName():string[] {
        let idents = []

        idents.push(this.CONSUME1(IdentTok).image)
        this.MANY(isQualifiedNamePart, () => {
            this.CONSUME1(DotTok)
            idents.push(this.CONSUME2(IdentTok).image)
        })

        this.CONSUME1(EOF)

        return idents
    }
}

class ManySepRepetitionRecovery extends Parser {

    constructor(input:Token[] = [], isErrorRecoveryEnabled = true) {
        super(input, ALL_TOKENS, isErrorRecoveryEnabled)
        Parser.performSelfAnalysis(this)
    }

    public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, () => { return ["333"] })

    private parseQualifiedName():string[] {
        let idents = []

        idents.push(this.CONSUME1(IdentTok).image)
        this.CONSUME1(DotTok)

        this.MANY_SEP(DotTok, () => {
            idents.push(this.CONSUME2(IdentTok).image)
        })

        this.CONSUME1(EOF)

        return idents
    }
}

class ManySepSubRuleRepetitionRecovery extends Parser {

    constructor(input:Token[] = []) {
        super(input, ALL_TOKENS)
        Parser.performSelfAnalysis(this)
    }

    public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, () => { return undefined })
    public identifier = this.RULE("identifier", this.parseIdentifier, () => { return undefined })
    public idents = []

    private parseQualifiedName():string[] {
        this.idents = []

        this.MANY_SEP(DotTok, () => {
            this.SUBRULE(this.identifier)
        })

        this.CONSUME1(EOF)

        return this.idents
    }

    private parseIdentifier():void {
        this.idents.push(this.CONSUME1(IdentTok).image)
    }

    protected canTokenTypeBeInsertedInRecovery(tokClass:Function) {
        // this parser is meant to test a scenario with re-sync recovery and MANY_SEP --> disable TokenInsertion
        return false
    }
}

class AtLeastOneRepetitionRecovery extends Parser {

    constructor(input:Token[] = [], isErrorRecoveryEnabled = true) {
        super(input, ALL_TOKENS, isErrorRecoveryEnabled)
        Parser.performSelfAnalysis(this)
    }

    public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, () => { return ["777"] })

    private parseQualifiedName():string[] {
        let idents = []

        idents.push(this.CONSUME1(IdentTok).image)
        this.AT_LEAST_ONE(isQualifiedNamePart, () => {
            this.CONSUME1(DotTok)
            idents.push(this.CONSUME2(IdentTok).image)
        })

        this.CONSUME1(EOF)

        return idents
    }
}

class AtLeastOneSepRepetitionRecovery extends Parser {

    constructor(input:Token[] = [], isErrorRecoveryEnabled = true) {
        super(input, ALL_TOKENS, isErrorRecoveryEnabled)
        Parser.performSelfAnalysis(this)
    }

    public qualifiedName = this.RULE("qualifiedName", this.parseQualifiedName, () => { return ["999"] })

    private parseQualifiedName():string[] {
        let idents = []

        this.AT_LEAST_ONE_SEP(DotTok, () => {
            idents.push(this.CONSUME1(IdentTok).image)
        }, "identifiers")

        this.CONSUME1(EOF)

        return idents
    }
}

function isQualifiedNamePart():boolean {
    return this.NEXT_TOKEN() instanceof DotTok
}

class SubRuleTestParser extends Parser {

    private result = ""
    private index = 1

    constructor(input:Token[] = []) {
        super(input, ALL_TOKENS)
        Parser.performSelfAnalysis(this)
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

class SubRuleArgsParser extends Parser {

    private numbers = ""
    private letters = ""

    constructor(input:Token[] = []) {
        super(input, ALL_TOKENS)
        Parser.performSelfAnalysis(this)
    }

    public topRule = this.RULE("topRule", () => {
        this.SUBRULE(this.subRule, [5, "a"])
        this.SUBRULE2(this.subRule, [4, "b"])
        this.SUBRULE3(this.subRule, [3, "c"])
        this.SUBRULE4(this.subRule, [2, "d"])
        this.SUBRULE5(this.subRule, [1, "e"])
        return {numbers: this.numbers, letters: this.letters}
    })

    public subRule = this.RULE("subRule", (numFromCaller, charFromCaller) => {
        this.CONSUME(PlusTok)
        this.numbers += numFromCaller
        this.letters += charFromCaller
    })
}

class CustomLookaheadParser extends Parser {

    private result = ""
    public plusAllowed = true
    public minusAllowed = true

    constructor(input:Token[] = []) {
        super(input, ALL_TOKENS)
        Parser.performSelfAnalysis(this)
    }

    private isPlus():boolean {
        return this.isNextRule("plusRule") && this.plusAllowed
    }

    private isMinus():boolean {
        return this.isNextRule("minusRule") && this.minusAllowed
    }

    public topRule = this.RULE("topRule", () => {
        this.OR([
            {WHEN: this.isPlus, THEN_DO: () => { this.SUBRULE1(this.plusRule) }},
            {WHEN: this.isMinus, THEN_DO: () => { this.SUBRULE1(this.minusRule) }}
        ], "a unicorn")


        return this.result
    })

    public plusRule = this.RULE("plusRule", () => {
        this.CONSUME(PlusTok)
        this.result += "plus"
    })

    public minusRule = this.RULE("minusRule", () => {
        this.CONSUME(MinusTok)
        this.result += "minus"
    })
}

describe("The Parsing DSL", () => {

    it("provides a production SUBRULE1-5 that invokes another rule", () => {
        let input = [new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok()]
        let parser = new SubRuleTestParser(input)
        let result = parser.topRule()
        expect(result).to.equal("12345")
    })

    it("provides a production SUBRULE1-5 that can accept arguments from its caller", () => {
        let input = [new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok(), new PlusTok()]
        let parser = new SubRuleArgsParser(input)
        let result = parser.topRule()
        expect(result.letters).to.equal("abcde")
        expect(result.numbers).to.equal("54321")
    })

    it("allows using automatic lookahead even as part of custom lookahead functions valid", () => {
        let input1 = [new PlusTok()]
        let parser = new CustomLookaheadParser(input1)
        let result = parser.topRule()
        expect(result).to.equal("plus")

        let input2 = [new MinusTok()]
        let parser2 = new CustomLookaheadParser(input2)
        let result2 = parser2.topRule()
        expect(result2).to.equal("minus")
    })

    it("allows using automatic lookahead even as part of custom lookahead functions invalid", () => {
        let input1 = [new PlusTok()]
        let parser = new CustomLookaheadParser(input1)
        parser.plusAllowed = false
        let result = parser.topRule()
        expect(result).to.equal(undefined)
        expect(parser.errors.length).to.equal(1)
        expect(parser.errors[0].message).to.contain("unicorn")
    })

    describe("supports EMPTY(...) alternative convenience function", () => {

        class EmptyAltParser extends Parser {

            public getLookAheadCache():HashTable<Function> {
                return getLookaheadFuncsForClass(this.className)
            }

            constructor(input:Token[] = []) {
                super(input, ALL_TOKENS)
                Parser.performSelfAnalysis(this)
            }

            public orRule = this.RULE("orRule", this.parseOrRule, () => { return "-666" })

            private parseOrRule():string {
                // @formatter:off
                    return this.OR1([
                            {ALT: () => {
                                this.CONSUME1(PlusTok)
                                return "+"
                            }},
                            {ALT: () => {
                                this.CONSUME1(MinusTok)
                                return "-"
                            }},
                            {ALT: EMPTY_ALT("EMPTY_ALT")}
                        ])
                     // @formatter:on
            }
        }

        it("can match an non-empty alternative in an OR with an empty alternative", () => {
            let input = [new PlusTok()]
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

describe("The Error Recovery functionality of the IntrospectionParser", () => {

    it("can CONSUME tokens with an index specifying the occurrence for the specific token in the current rule", () => {
        let parser:any = new Parser([], ALL_TOKENS)
        parser.reset()
        let testInput = [new IntToken("1"), new PlusTok(),
            new IntToken("2"), new PlusTok(), new IntToken("3")]

        parser.input = testInput
        expect(parser.CONSUME4(IntToken)).to.equal(testInput[0])
        expect(parser.CONSUME2(PlusTok)).to.equal(testInput[1])
        expect(parser.CONSUME1(IntToken)).to.equal(testInput[2])
        expect(parser.CONSUME3(PlusTok)).to.equal(testInput[3])
        expect(parser.CONSUME1(IntToken)).to.equal(testInput[4])
        expect(parser.NEXT_TOKEN()).to.be.an.instanceof(EOF)
    })

    it("will not perform inRepetition recovery while in backtracking mode", () => {
        let parser:any = new Parser([], {})
        parser.isBackTrackingStack.push(1)
        expect(parser.shouldInRepetitionRecoveryBeTried(MinusTok, 1)).to.equal(false)
    })

    it("can perform in-repetition recovery for MANY grammar rule", () => {
        // a.b+.c
        let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
            new PlusTok(), new DotTok(), new IdentTok("c")]
        let parser = new ManyRepetitionRecovery(input)
        expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
        expect(parser.errors.length).to.equal(1)
    })

    it("can disable in-repetition recovery for MANY grammar rule", () => {
        // a.b+.c
        let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
            new PlusTok(), new DotTok(), new IdentTok("c")]
        let parser = new ManyRepetitionRecovery(input, false)
        expect(parser.qualifiedName()).to.deep.equal(["666"])
        expect(parser.errors.length).to.equal(1)
    })

    it("can perform in-repetition recovery for MANY_SEP grammar rule", () => {
        // a.b+.c
        let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
            new PlusTok(), new DotTok(), new IdentTok("c")]
        let parser = new ManySepRepetitionRecovery(input)
        expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
        expect(parser.errors.length).to.equal(1)
    })

    it("can disable in-repetition recovery for MANY_SEP grammar rule", () => {
        // a.b+.c
        let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
            new PlusTok(), new DotTok(), new IdentTok("c")]
        let parser = new ManySepRepetitionRecovery(input, false)
        expect(parser.qualifiedName()).to.deep.equal(["333"])
        expect(parser.errors.length).to.equal(1)
    })

    it("can perform in-repetition recovery for MANY_SEP grammar rule #2", () => {
        // a.b..c...d
        let input = [new IdentTok("a"), new DotTok(), new DotTok(), new IdentTok("b"),
            new DotTok(), new IdentTok("c"), new DotTok(), new DotTok(), new DotTok(), new IdentTok("d")]
        let parser = new ManySepSubRuleRepetitionRecovery(input)
        expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c", "d"])
        expect(parser.errors.length).to.equal(3)
    })

    it("can perform in-repetition recovery for AT_LEAST_ONE grammar rule", () => {
        // a.b+.c
        let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
            new PlusTok(), new DotTok(), new IdentTok("c")]
        let parser = new AtLeastOneRepetitionRecovery(input)
        expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
        expect(parser.errors.length).to.equal(1)
    })

    it("can disable in-repetition recovery for AT_LEAST_ONE grammar rule", () => {
        // a.b+.c
        let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
            new PlusTok(), new DotTok(), new IdentTok("c")]
        let parser = new AtLeastOneRepetitionRecovery(input, false)
        expect(parser.qualifiedName()).to.deep.equal(["777"])
        expect(parser.errors.length).to.equal(1)
    })

    it("can perform in-repetition recovery for AT_LEAST_ONE_SEP grammar rule", () => {
        // a.b+.c
        let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
            new PlusTok(), new DotTok(), new IdentTok("c")]
        let parser = new AtLeastOneSepRepetitionRecovery(input)
        expect(parser.qualifiedName()).to.deep.equal(["a", "b", "c"])
        expect(parser.errors.length).to.equal(1)
    })

    it("can disable in-repetition recovery for AT_LEAST_ONE_SEP grammar rule", () => {
        // a.b+.c
        let input = [new IdentTok("a"), new DotTok(), new IdentTok("b"),
            new PlusTok(), new DotTok(), new IdentTok("c")]
        let parser = new AtLeastOneSepRepetitionRecovery(input, false)
        expect(parser.qualifiedName()).to.deep.equal(["999"])
        expect(parser.errors.length).to.equal(1)
    })
})

describe("The BaseRecognizer", () => {

    it("can be initialized without supplying an input vector", () => {
        let parser = new Parser([], [])
        expect(parser.input).to.deep.equal([])
        expect(parser.input).to.be.an.instanceof(Array)
    })

    it("can only SAVE_ERROR for recognition exceptions", () => {
        let parser:any = new Parser([], [])
        expect(() => parser.SAVE_ERROR(new Error("I am some random Error")))
            .to.throw("Trying to save an Error which is not a RecognitionException")
        expect(parser.input).to.be.an.instanceof(Array)
    })

    it("when it runs out of input EOF will be returned", () => {
        let parser:any = new Parser([new IntToken("1"), new PlusTok()], [])
        parser.CONSUME(IntToken)
        parser.CONSUME(PlusTok)
        expect(parser.NEXT_TOKEN()).to.be.an.instanceof(EOF)
        expect(parser.NEXT_TOKEN()).to.be.an.instanceof(EOF)
        expect(parser.SKIP_TOKEN()).to.be.an.instanceof(EOF)
        expect(parser.SKIP_TOKEN()).to.be.an.instanceof(EOF)
        // and we can go on and on and on... this avoid returning null/undefined
        // see: http://en.wikipedia.org/wiki/Tony_Hoare#Apologies_and_retractions
    })

    it("invoking an OPTION will return true/false depending if it succeeded or not", () => {
        let parser:any = new Parser([new IntToken("1"), new PlusTok()], {})

        let successfulOption = parser.OPTION(function () { return this.NEXT_TOKEN() instanceof IntToken }, () => {
            parser.CONSUME1(IntToken)
        })
        expect(successfulOption).to.equal(true)

        let failedOption = parser.OPTION(function () {
            // this lookahead should fail because the first token has been consumed and
            // now the next one is a PlusTok
            return this.NEXT_TOKEN() instanceof IntToken
        }, () => { parser.CONSUME1(IntToken) })
        expect(failedOption).to.equal(false)
    })

    it("will return false if a RecognitionException is thrown during " +
        "backtracking and rethrow any other kind of Exception", () => {
        let parser:any = new Parser([], [])
        let backTrackingThrows = parser.BACKTRACK(() => {throw new Error("division by zero, boom")}, () => { return true })
        expect(() => backTrackingThrows()).to.throw("division by zero, boom")

        let throwExceptionFunc = () => { throw new exceptions.NotAllInputParsedException("sad sad panda", new PlusTok()) }
        let backTrackingFalse = parser.BACKTRACK(() => { throwExceptionFunc() }, () => { return true })
        expect(backTrackingFalse()).to.equal(false)
    })

})

describe("The BaseRecognizer", () => {

    it("can be initialized with a vector of Tokens", () => {
        let parser:any = new Parser([], [PlusTok, MinusTok, IntToken])
        let tokensMap = (<any>parser).tokensMap
        expect(tokensMap.PlusTok).to.equal(PlusTok)
        expect(tokensMap.MinusTok).to.equal(MinusTok)
        expect(tokensMap.IntToken).to.equal(IntToken)
    })

    it("can be initialized with a Dictionary of Tokens", () => {
        let initTokenDictionary = {PlusTok: PlusTok, MinusTok: MinusTok, IntToken: IntToken}
        let parser:any = new Parser([], {
            PlusTok:  PlusTok,
            MinusTok: MinusTok,
            IntToken: IntToken
        })
        let tokensMap = (<any>parser).tokensMap
        // the implementation should clone the dictionary to avoid bugs caused by mutability
        expect(tokensMap).not.to.equal(initTokenDictionary)
        expect(tokensMap.PlusTok).to.equal(PlusTok)
        expect(tokensMap.MinusTok).to.equal(MinusTok)
        expect(tokensMap.IntToken).to.equal(IntToken)
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

            constructor(input:Token[] = []) {
                super(input, ALL_TOKENS)
                Parser.performSelfAnalysis(this)
            }

            public someRule = this.RULE("someRule", () => {
                this.CONSUME1(DotTok)
            })
        }
        let parser:any = new InRuleParser([new IntToken("1")])
        parser.tryInRuleRecovery = () => { throw Error("oops")}
        expect(() => parser.someRule()).to.throw("oops")
    })

    it("Will use Token LABELS for mismatch error messages when available", () => {

        class LabelTokParser extends Parser {

            constructor(input:Token[] = []) {
                super(input, [PlusTok, MinusTok])
                Parser.performSelfAnalysis(this)
            }

            public rule = this.RULE("rule", () => {
                this.CONSUME1(PlusTok)
            })
        }

        let parser = new LabelTokParser([new MinusTok()])
        parser.rule()
        expect(parser.errors[0]).to.be.an.instanceof(MismatchedTokenException)
        expect(parser.errors[0].message).to.include("+")
        expect(parser.errors[0].message).to.not.include("token of type")
    })

    it("Will not use Token LABELS for mismatch error messages when unavailable", () => {

        class NoLabelTokParser extends Parser {

            constructor(input:Token[] = []) {
                super(input, [PlusTok, MinusTok])
                Parser.performSelfAnalysis(this)
            }

            public rule = this.RULE("rule", () => {
                this.CONSUME1(MinusTok)
            })
        }

        let parser = new NoLabelTokParser([new PlusTok()])
        parser.rule()
        expect(parser.errors[0]).to.be.an.instanceof(MismatchedTokenException)
        expect(parser.errors[0].message).to.include("MinusTok")
        expect(parser.errors[0].message).to.include("token of type")
        expect(parser.errors[0].context.ruleStack).to.deep.equal(["rule"])
    })

    it("Will use Token LABELS for noViableAlt error messages when unavailable", () => {

        class LabelAltParser extends Parser {

            constructor(input:Token[] = []) {
                super(input, [PlusTok, MinusTok])
                Parser.performSelfAnalysis(this)
            }

            public rule = this.RULE("rule", () => {
                this.OR([
                    {ALT: () => {this.CONSUME1(PlusTok)}},
                    {ALT: () => {this.CONSUME1(MinusTok)}},
                ])
            })
        }

        let parser = new LabelAltParser([])
        parser.rule()
        expect(parser.errors[0]).to.be.an.instanceof(NoViableAltException)
        expect(parser.errors[0].context.ruleStack).to.deep.equal(["rule"])
        expect(parser.errors[0].message).to.include("MinusTok")
        expect(parser.errors[0].message).to.include("+")
        expect(parser.errors[0].message).to.not.include("PlusTok")
    })


    it("Will include the ruleStack in a recognition Exception", () => {

        class NestedRulesParser extends Parser {

            constructor(input:Token[] = []) {
                super(input, [PlusTok, MinusTok])
                Parser.performSelfAnalysis(this)
            }

            public rule = this.RULE("rule", () => {
                this.OPTION(() => {
                    this.SUBRULE2(this.rule2)
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

        let parser = new NestedRulesParser([new MinusTok(), new MinusTok()])
        parser.rule()
        expect(parser.errors[0]).to.be.an.instanceof(MismatchedTokenException)
        expect(parser.errors[0].context.ruleStack).to.deep.equal(["rule", "rule2", "rule3"])
        expect(parser.errors[0].context.ruleOccurrenceStack).to.deep.equal([1, 2, 5])
    })

    it("Will build an error message for AT_LEAST_ONE automatically", () => {

        class ImplicitAtLeastOneErrParser extends Parser {

            constructor(input:Token[] = []) {
                super(input, [PlusTok, MinusTok])
                Parser.performSelfAnalysis(this)
            }

            public rule = this.RULE("rule", () => {
                this.AT_LEAST_ONE(() => {
                    this.SUBRULE(this.rule2)
                })
            })

            public rule2 = this.RULE("rule2", () => {
                this.OR([
                    {ALT: () => { this.CONSUME1(MinusTok) }},
                    {ALT: () => { this.CONSUME1(PlusTok) }}
                ])
            })
        }

        let parser = new ImplicitAtLeastOneErrParser([new IntToken("666"), new MinusTok(), new MinusTok()])
        parser.rule()
        expect(parser.errors[0]).to.be.an.instanceof(EarlyExitException)
        expect(parser.errors[0].message).to.contain("expecting at least one iteration")
        expect(parser.errors[0].message).to.contain("MinusTok")
        expect(parser.errors[0].message).to.contain("+")
        expect(parser.errors[0].message).to.contain("but found: '666'")
        expect(parser.errors[0].context.ruleStack).to.deep.equal(["rule"])
    })

    it("Will build an error message for AT_LEAST_ONE_SEP automatically", () => {

        class ImplicitAtLeastOneSepErrParser extends Parser {

            constructor(input:Token[] = []) {
                super(input, [PlusTok, MinusTok, IdentTok])
                Parser.performSelfAnalysis(this)
            }

            public rule = this.RULE("rule", () => {
                this.AT_LEAST_ONE_SEP(IdentTok, () => {
                    this.SUBRULE(this.rule2)
                })
            })

            public rule2 = this.RULE("rule2", () => {
                this.OR([
                    {ALT: () => { this.CONSUME1(MinusTok) }},
                    {ALT: () => { this.CONSUME1(PlusTok) }}
                ])
            })
        }

        let parser = new ImplicitAtLeastOneSepErrParser([new IntToken("666"), new MinusTok(), new MinusTok()])
        parser.rule()
        expect(parser.errors[0]).to.be.an.instanceof(EarlyExitException)
        expect(parser.errors[0].message).to.contain("expecting at least one iteration")
        expect(parser.errors[0].message).to.contain("MinusTok")
        expect(parser.errors[0].message).to.contain("+")
        expect(parser.errors[0].message).to.contain("but found: '666'")
        expect(parser.errors[0].context.ruleStack).to.deep.equal(["rule"])
        expect(parser.errors[0].context.ruleOccurrenceStack).to.deep.equal([1])
    })
})
