import { Parser } from "../../../src/parse/traits/parser_traits"
import { createRegularToken } from "../../utils/matchers"
import { augmentTokenTypes } from "../../../src/scan/tokens"
import { IToken } from "../../../api"

describe("The Recognizer's capabilities for overriding grammar productions", () => {
    class PlusTok {
        static PATTERN = /\+/
    }

    class MinusTok {
        static PATTERN = /-/
    }

    augmentTokenTypes(<any>[PlusTok, MinusTok])

    it("Can override an existing rule", () => {
        class SuperOverrideParser extends Parser {
            constructor(
                input: IToken[] = [],
                isInvokedByChildConstructor = false
            ) {
                super(<any>[PlusTok, MinusTok], { outputCst: false })
                this.input = input

                // performSelfAnalysis should only be invoked once.
                if (!isInvokedByChildConstructor) {
                    this.performSelfAnalysis()
                }
            }

            public topRule = this.RULE("topRule", () => {
                let result
                this.OPTION(() => {
                    result = this.SUBRULE(this.nestedRule)
                })
                return result
            })

            public nestedRule = this.RULE("nestedRule", () => {
                this.CONSUME(PlusTok)
                return "yey"
            })
        }

        class ChildOverrideParser extends SuperOverrideParser {
            constructor(input: IToken[] = []) {
                super(input, true)
                this.performSelfAnalysis()
            }

            // nestedRule is overridden with a new implementation
            public nestedRule = this.OVERRIDE_RULE("nestedRule", () => {
                this.AT_LEAST_ONE(() => {
                    this.CONSUME(MinusTok)
                })
                return "ney"
            })
        }

        let superParser = new SuperOverrideParser([createRegularToken(PlusTok)])
        let superResult = superParser.topRule()
        expect(superResult).to.equal("yey")
        expect(superParser.errors).to.be.empty

        let childParser = new ChildOverrideParser([
            createRegularToken(MinusTok),
            createRegularToken(MinusTok),
            createRegularToken(MinusTok)
        ])
        let childResult = childParser.topRule()
        expect(childResult).to.equal("ney")
        expect(superParser.errors).to.be.empty
    })

    it("Can not override a rule which does not exist", () => {
        class InvalidOverrideParser extends Parser {
            constructor(input: IToken[] = []) {
                super([PlusTok, MinusTok])
                this.performSelfAnalysis()
            }

            // nothing to override, oops does not exist in any of the super grammars
            public oops = this.OVERRIDE_RULE(
                "oops",
                () => {
                    this.CONSUME(PlusTok)
                    return "poof"
                },
                { recoveryValueFunc: () => "boom" }
            )
        }

        expect(() => new InvalidOverrideParser([])).to.throw(
            "Parser Definition Errors detected"
        )
        expect(() => new InvalidOverrideParser([])).to.throw(
            "Invalid rule override"
        )
        expect(() => new InvalidOverrideParser([])).to.throw("->oops<-")
    })
})
