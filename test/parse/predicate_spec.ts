import {Token} from "../../src/scan/tokens_public"
import {Parser} from "../../src/parse/parser_public"
import {exceptions} from "../../src/parse/exceptions_public"

describe("The chevrotain support for custom gates/predicates on DSL production:", () => {

    class A extends Token {
        constructor() { super("a", 0, 1, 1) }
    }

    class B extends Token {
        constructor() { super("b", 0, 1, 1) }
    }

    class C extends Token {
        constructor() { super("c", 0, 1, 1) }
    }

    let ALL_TOKENS = [A, B, C]

    it("OPTION", () => {

        function gateFunc() {
            return this.gate
        }

        class PredicateOptionParser extends Parser {

            constructor(input:Token[] = [], private gate:boolean) {
                super(input, ALL_TOKENS);
                (Parser as any).performSelfAnalysis(this)
            }

            public optionRule = this.RULE("optionRule", () => {
                let result = "not entered!"
                this.OPTION(gateFunc, () => {
                    this.CONSUME(A)
                    result = "entered!"
                })
                return result
            })
        }

        let gateOpenInputGood = new PredicateOptionParser([new A()], true).optionRule()
        expect(gateOpenInputGood).to.equal("entered!")

        let gateOpenInputBad = new PredicateOptionParser([new B()], true).optionRule()
        expect(gateOpenInputBad).to.equal("not entered!")

        let gateClosedInputGood = new PredicateOptionParser([new A()], false).optionRule()
        expect(gateClosedInputGood).to.equal("not entered!")

        let gateClosedInputBad = new PredicateOptionParser([new B()], false).optionRule()
        expect(gateClosedInputBad).to.equal("not entered!")
    })

    it("MANY", () => {
        function gateFunc() {
            return this.gate
        }

        class PredicateManyParser extends Parser {

            constructor(input:Token[] = [], private gate:boolean) {
                super(input, ALL_TOKENS);
                (Parser as any).performSelfAnalysis(this)
            }

            public manyRule = this.RULE("manyRule", () => {
                let result = "not entered!"
                this.MANY(gateFunc, () => {
                    this.CONSUME(A)
                    result = "entered!"
                })

                return result
            })
        }

        let gateOpenInputGood = new PredicateManyParser([new A(), new A()], true).manyRule()
        expect(gateOpenInputGood).to.equal("entered!")

        let gateOpenInputBad = new PredicateManyParser([new B()], true).manyRule()
        expect(gateOpenInputBad).to.equal("not entered!")

        let gateClosedInputGood = new PredicateManyParser([new A(), new A()], false).manyRule()
        expect(gateClosedInputGood).to.equal("not entered!")

        let gateClosedInputBad = new PredicateManyParser([new B()], false).manyRule()
        expect(gateClosedInputBad).to.equal("not entered!")
    })

    it("AT_LEAST_ONE", () => {
        function gateFunc() {
            return this.gate
        }

        class PredicateAtLeastOneParser extends Parser {

            constructor(input:Token[] = [], private gate:boolean) {
                super(input, ALL_TOKENS);
                (Parser as any).performSelfAnalysis(this)
            }

            public atLeastOneRule = this.RULE("atLeastOneRule", () => {
                let result = "not entered!"
                this.AT_LEAST_ONE(gateFunc, () => {
                    this.CONSUME(A)
                    result = "entered!"
                })

                return result
            })
        }

        let gateOpenInputGood = new PredicateAtLeastOneParser([new A(), new A()], true).atLeastOneRule()
        expect(gateOpenInputGood).to.equal("entered!")

        let gateOpenInputBadParser = new PredicateAtLeastOneParser([new B()], true)
        gateOpenInputBadParser.atLeastOneRule()
        expect(gateOpenInputBadParser.errors).to.have.lengthOf(1)
        expect(gateOpenInputBadParser.errors[0]).to.be.an.instanceOf(exceptions.EarlyExitException)

        let gateClosedInputGood = new PredicateAtLeastOneParser([new A(), new A()], false)
        gateClosedInputGood.atLeastOneRule()
        expect(gateClosedInputGood.errors).to.have.lengthOf(1)
        expect(gateClosedInputGood.errors[0]).to.be.an.instanceOf(exceptions.EarlyExitException)

        let gateClosedInputBad = new PredicateAtLeastOneParser([new B()], false)
        gateClosedInputBad.atLeastOneRule()
        expect(gateClosedInputBad.errors).to.have.lengthOf(1)
        expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(exceptions.EarlyExitException)
    })

    it("OR", () => {
        function gateFunc() {
            return this.gate
        }

        class PredicateOrParser extends Parser {

            constructor(input:Token[] = [], private gate:boolean) {
                super(input, ALL_TOKENS);
                (Parser as any).performSelfAnalysis(this)
            }

            public orRule = this.RULE("orRule", () => {
                // @formatter:off
                    return this.OR1([
                        // no predicate
                        {ALT: () => {
                            this.CONSUME1(A)
                            return "A"
                        }}, // Has predicate
                        {WHEN: gateFunc, THEN_DO: () => {
                            this.CONSUME1(B)
                            return "B"
                        }},
                        // No predicate
                        {ALT: () => {
                            this.CONSUME1(C)
                            return "C"
                        }}
                    ])
                    // @formatter:on
            })
        }

        let gateOpenInputA = new PredicateOrParser([new A()], true).orRule()
        expect(gateOpenInputA).to.equal("A")

        let gateOpenInputB = new PredicateOrParser([new B()], true).orRule()
        expect(gateOpenInputB).to.equal("B")

        let gateOpenInputC = new PredicateOrParser([new C()], true).orRule()
        expect(gateOpenInputC).to.equal("C")

        let gateClosedInputA = new PredicateOrParser([new A()], false).orRule()
        expect(gateClosedInputA).to.equal("A")

        let gateClosedInputBad = new PredicateOrParser([new B()], false)
        gateClosedInputBad.orRule()
        expect(gateClosedInputBad.errors).to.have.lengthOf(1)
        expect(gateClosedInputBad.errors[0]).to.be.an.instanceOf(exceptions.NoViableAltException)

        let gateClosedInputC = new PredicateOrParser([new C()], false).orRule()
        expect(gateClosedInputC).to.equal("C")
    })

    describe("Predicates shall work with parametrized rules (issue #221)", () => {

        it("predicates in OR", () => {
            class PredicateWithRuleOrParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS);
                    (Parser as any).performSelfAnalysis(this)
                }

                public topRule = this.RULE("topRule", (param) => {
                    return this.OR1([
                        {WHEN: () => param, THEN_DO: () => this.CONSUME1(A).image},
                        {WHEN: () => !param, THEN_DO: () => this.CONSUME1(B).image}
                    ])
                })
            }

            let gateOpenInputA = new PredicateWithRuleOrParser([new A()]).topRule(1, [true])
            expect(gateOpenInputA).to.equal("a")

            // if the predicate function still kept a reference via a closure to the original param this will not work.
            let gateOpenInputB = new PredicateWithRuleOrParser([new B()]).topRule(1, [false])
            expect(gateOpenInputB).to.equal("b")
        })

        it("predicates in OPTION", () => {
            class PredicateWithRuleOptionParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS);
                    (Parser as any).performSelfAnalysis(this)
                }

                public topRule = this.RULE("topRule", (param) => {
                    let result = ""
                    this.OPTION(() => param, () => {
                        result += this.CONSUME1(A).image
                    })
                    result += this.CONSUME1(B).image

                    return result
                })
            }

            let gateOpenInputB = new PredicateWithRuleOptionParser([new B()]).topRule(1, [false])
            expect(gateOpenInputB).to.equal("b")

            // if the predicate function still kept a reference via a closure to the original param this will not work.
            // because the <() => param> in the OPTION will ALWAYS return false (the original param)
            let gateOpenInputA = new PredicateWithRuleOptionParser([new A(), new B()]).topRule(1, [true])
            expect(gateOpenInputA).to.equal("ab")
        })

        it("predicates in MANY", () => {
            class PredicateWithRuleManyParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS);
                    (Parser as any).performSelfAnalysis(this)
                }

                public topRule = this.RULE("topRule", (param) => {
                    let result = ""
                    this.MANY(() => param, () => {
                        result += this.CONSUME1(A).image
                    })
                    result += this.CONSUME1(B).image
                    return result
                })
            }

            let gateOpenInputB = new PredicateWithRuleManyParser([new B()]).topRule(1, [false])
            expect(gateOpenInputB).to.equal("b")

            // if the predicate function still kept a reference via a closure to the original param this will not work.
            // because the <() => param> in the MANY will ALWAYS return false (the original param)
            let gateOpenInputA = new PredicateWithRuleManyParser([new A(), new A(), new A(), new B()]).topRule(1, [true])
            expect(gateOpenInputA).to.equal("aaab")
        })

        it("predicates in AT_LEAST_ONE", () => {


            class PredicateWithRuleAtLeastOneParser extends Parser {

                constructor(input:Token[] = []) {
                    super(input, ALL_TOKENS);
                    (Parser as any).performSelfAnalysis(this)
                }

                public topRule = this.RULE("topRule", (param) => {
                    let times = 0

                    function gateFunc() {
                        // got to enter at least once...
                        if (times === 0) {
                            times++
                            return true
                        }
                        else {
                            return param
                        }
                    }

                    let result = ""
                    this.AT_LEAST_ONE(gateFunc, () => {
                        result += this.CONSUME1(A).image
                    })
                    result += this.CONSUME1(B).image
                    return result
                })
            }

            let gateOpenInputB = new PredicateWithRuleAtLeastOneParser([new A(), new B()]).topRule(1, [false])
            expect(gateOpenInputB).to.equal("ab")

            // if the predicate function still kept a reference via a closure to the original param this will not work.
            // because the <() => param> in the AT_LEAST_ONE will ALWAYS return false (the original param)
            let gateOpenInputA = new PredicateWithRuleAtLeastOneParser([new A(), new A(), new A(), new B()]).topRule(1, [true])
            expect(gateOpenInputA).to.equal("aaab")
        })
    })
})
