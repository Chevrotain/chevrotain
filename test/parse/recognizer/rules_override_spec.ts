import {Token} from "../../../src/scan/tokens_public"
import {Parser} from "../../../src/parse/parser_public"

describe("The Recognizer's capabilities for overriding grammar productions", () => {

    class PlusTok extends Token {
        constructor() { super("+", 0, 1, 1) }
    }

    class MinusTok extends Token {
        constructor() { super("-", 0, 1, 1) }
    }

    it("Can override an existing rule", () => {
        class SuperOverrideParser extends Parser {

            constructor(input:Token[] = []) {
                super(input, [PlusTok, MinusTok])
                Parser.performSelfAnalysis(this)
            }

            public topRule = this.RULE("topRule", () => {
                return this.SUBRULE(this.nestedRule)
            })

            public nestedRule = this.RULE("nestedRule", () => {
                this.CONSUME(PlusTok)
                return "yey"
            })
        }

        class ChildOverrideParser extends SuperOverrideParser {

            constructor(input:Token[] = []) {
                super(input)
                Parser.performSelfAnalysis(this)
            }

            // nestedRule is overridden with a new implementation
            public nestedRule = this.OVERRIDE_RULE("nestedRule", () => {
                this.AT_LEAST_ONE(() => {
                    this.CONSUME(MinusTok)
                })
                return "ney"
            })
        }

        let superParser = new SuperOverrideParser([new PlusTok()])
        let superResult = superParser.topRule()
        expect(superResult).to.equal("yey")
        expect(superParser.errors).to.be.empty

        let childParser = new ChildOverrideParser([new MinusTok(), new MinusTok(), new MinusTok()])
        let childResult = childParser.topRule()
        expect(childResult).to.equal("ney")
        expect(superParser.errors).to.be.empty
    })

    it("Can not override a rule which does not exist", () => {

        class InvalidOverrideParser extends Parser {

            constructor(input:Token[] = []) {
                super(input, [PlusTok, MinusTok])
                Parser.performSelfAnalysis(this)
            }

            // nothing to override, oops does not exist in any of the super grammars
            public oops = this.OVERRIDE_RULE("oops", () => {
                this.CONSUME(PlusTok)
                return "poof"
            }, () => "boom", true)
        }

        expect(() => new InvalidOverrideParser([])).to.throw("Parser Definition Errors detected")
        expect(() => new InvalidOverrideParser([])).to.throw("Invalid rule override")
        expect(() => new InvalidOverrideParser([])).to.throw("->oops<-")
    })
})
