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

    it("MANY_SEP", () => {
        function gateFunc() {
            return this.gate
        }

        class PredicateManySepParser extends Parser {

            constructor(input:Token[] = [], private gate:boolean) {
                super(input, ALL_TOKENS);
                (Parser as any).performSelfAnalysis(this)
            }

            public manySepRule = this.RULE("manySepRule", () => {
                let result = "not entered!"
                this.MANY_SEP(B, gateFunc, () => {
                    this.CONSUME(A)
                    result = "entered!"
                })

                return result
            })
        }

        let gateOpenInputGood = new PredicateManySepParser([new A(), new B(), new A()], true).manySepRule()
        expect(gateOpenInputGood).to.equal("entered!")

        let gateOpenInputBad = new PredicateManySepParser([new B()], true).manySepRule()
        expect(gateOpenInputBad).to.equal("not entered!")

        let gateClosedInputGood = new PredicateManySepParser([new A(), new B(), new A()], false).manySepRule()
        expect(gateClosedInputGood).to.equal("not entered!")

        let gateClosedInputBad = new PredicateManySepParser([new B()], false).manySepRule()
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

    it("AT_LEAST_ONE_SEP", () => {
        function gateFunc() {
            return this.gate
        }

        class PredicateAtLeastOneSepParser extends Parser {

            constructor(input:Token[] = [], private gate:boolean) {
                super(input, ALL_TOKENS);
                (Parser as any).performSelfAnalysis(this)
            }

            public atLeastOneSepRule = this.RULE("atLeastOneSepRule", () => {
                let result = "not entered!"
                this.AT_LEAST_ONE_SEP(B, gateFunc, () => {
                    this.CONSUME(A)
                    result = "entered!"
                })

                return result
            })
        }

        let gateOpenInputGood = new PredicateAtLeastOneSepParser([new A(), new B(), new A()], true).atLeastOneSepRule()
        expect(gateOpenInputGood).to.equal("entered!")

        let gateOpenInputBadParser = new PredicateAtLeastOneSepParser([new B()], true)
        gateOpenInputBadParser.atLeastOneSepRule()
        expect(gateOpenInputBadParser.errors).to.have.lengthOf(1)
        expect(gateOpenInputBadParser.errors[0]).to.be.an.instanceOf(exceptions.EarlyExitException)

        let gateClosedInputGood = new PredicateAtLeastOneSepParser([new A(), new B(), new A()], false)
        gateClosedInputGood.atLeastOneSepRule()
        expect(gateClosedInputGood.errors).to.have.lengthOf(1)
        expect(gateClosedInputGood.errors[0]).to.be.an.instanceOf(exceptions.EarlyExitException)

        let gateClosedInputBad = new PredicateAtLeastOneSepParser([new B()], false)
        gateClosedInputBad.atLeastOneSepRule()
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

            public orRule = this.RULE("manyRule", () => {
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
})
