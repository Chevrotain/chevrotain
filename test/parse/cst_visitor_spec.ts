import { createToken, IToken } from "../../src/scan/tokens_public"
import { Parser } from "../../src/parse/parser_public"
import { createRegularToken } from "../utils/matchers"
import { keys } from "../../src/utils/utils"

describe("The CSTVisitor", () => {
    let A = createToken({ name: "A" })
    let B = createToken({ name: "B" })
    let C = createToken({ name: "C" })

    const ALL_TOKENS = [A, B, C]

    class CstTerminalParserReturnVisitor extends Parser {
        constructor(input: IToken[] = []) {
            super(input, ALL_TOKENS, { outputCst: true })
            ;(<any>Parser).performSelfAnalysis(this)
        }

        public testRule = this.RULE("testRule", () => {
            this.CONSUME(A)
            this.CONSUME(B)
            this.OPTION({
                NAME: "$bisli",
                DEF: () => {
                    this.SUBRULE(this.bamba)
                }
            })
        })

        public bamba = this.RULE("bamba", () => {
            this.CONSUME(C)
        })
    }

    let parserInstance = new CstTerminalParserReturnVisitor([])
    let BaseVisitor = parserInstance.getBaseCstVisitorConstructor()
    let BaseVisitorWithDefaults = parserInstance.getBaseCstVisitorConstructorWithDefaults()

    // to avoid issues with other tests clearing the cache
    before(() => {
        parserInstance = new CstTerminalParserReturnVisitor([])
        BaseVisitor = parserInstance.getBaseCstVisitorConstructor()
        BaseVisitorWithDefaults = parserInstance.getBaseCstVisitorConstructorWithDefaults()
        // to hit all coverage branches
        BaseVisitorWithDefaults = parserInstance.getBaseCstVisitorConstructorWithDefaults()
    })

    it("can execute a Visitor with a return Value", () => {
        class CstVisitorValidator extends BaseVisitor {
            constructor() {
                super()
                this.validateVisitor()
            }

            testRule(ctx) {
                expect(keys(ctx)).to.deep.equal(["A", "B", "$bisli"])
                return this.visit(ctx.$bisli[0])
            }

            testRule$bisli(ctx) {
                expect(keys(ctx)).to.deep.equal(["bamba"])
                return this.visit(ctx.bamba[0])
            }

            bamba(ctx) {
                expect(keys(ctx)).to.deep.equal(["C"])
                return 666
            }
        }

        let input = [
            createRegularToken(A),
            createRegularToken(B),
            createRegularToken(C)
        ]
        parserInstance.input = input
        let cst = parserInstance.testRule()

        let visitor = new CstVisitorValidator()
        expect(visitor.visit(cst)).to.equal(666)
    })

    it("can execute a Visitor with an 'in' param", () => {
        class CstVisitorValidator extends BaseVisitor {
            constructor() {
                super()
                this.validateVisitor()
            }

            testRule(ctx, param) {
                expect(keys(ctx)).to.deep.equal(["A", "B", "$bisli"])
                return this.visit(ctx.$bisli[0], param)
            }

            testRule$bisli(ctx, param) {
                expect(keys(ctx)).to.deep.equal(["bamba"])
                return this.visit(ctx.bamba[0], param)
            }

            bamba(ctx, param) {
                // inspecting handling of optional arguments
                expect(this.visit(ctx.missingKey)).to.be.undefined
                expect(keys(ctx)).to.deep.equal(["C"])
                return 666 + param
            }
        }

        let input = [
            createRegularToken(A),
            createRegularToken(B),
            createRegularToken(C)
        ]
        parserInstance.input = input
        let cst = parserInstance.testRule()

        let visitor = new CstVisitorValidator()
        expect(visitor.visit(cst, 1)).to.equal(667)
    })

    it("can create a visitor with default methods implementations", () => {
        let visited = false
        class CstVisitorValidator extends BaseVisitorWithDefaults {
            constructor() {
                super()
                this.validateVisitor()
            }

            // testRule and testRule$bisli visitor should be created automatically
            bamba(ctx) {
                expect(keys(ctx)).to.deep.equal(["C"])
                visited = true
            }
        }

        let input = [
            createRegularToken(A),
            createRegularToken(B),
            createRegularToken(C)
        ]
        parserInstance.input = input
        let cst = parserInstance.testRule()

        let visitor = new CstVisitorValidator()
        visitor.visit(cst)
        expect(visited).to.be.true
    })

    it("can invoke visit with an array", () => {
        class CstVisitorValidator extends BaseVisitor {
            constructor() {
                super()
                this.validateVisitor()
            }

            testRule(ctx, param) {
                expect(keys(ctx)).to.deep.equal(["A", "B", "$bisli"])
                return this.visit(ctx.$bisli[0], param)
            }

            testRule$bisli(ctx, param) {
                expect(keys(ctx)).to.deep.equal(["bamba"])
                return this.visit(ctx.bamba[0], param)
            }

            bamba(ctx, param) {
                expect(keys(ctx)).to.deep.equal(["C"])
                return 666 + param
            }
        }

        let input = [
            createRegularToken(A),
            createRegularToken(B),
            createRegularToken(C)
        ]
        parserInstance.input = input
        let cst = parserInstance.testRule()

        let visitor = new CstVisitorValidator()
        expect(visitor.visit([cst], 1)).to.equal(667)
        expect(visitor.visit([], 1)).to.be.undefined
    })

    it("can detect missing visitor methods", () => {
        class CstVisitorValidator extends BaseVisitor {
            constructor() {
                super()
                this.validateVisitor()
            }

            testRule(ctx, param) {}

            testRule$bisli(ctx, param) {}

            // missing "bamba" method
        }

        expect(() => new CstVisitorValidator()).to.throw(
            "Missing visitor method: <bamba>"
        )
        expect(() => new CstVisitorValidator()).to.throw(
            "Errors Detected in CST Visitor"
        )
    })

    it("can detect redundant visitor methods", () => {
        class CstVisitorValidatorRedundant extends BaseVisitor {
            constructor() {
                super()
                this.validateVisitor()
            }

            testRule(ctx, param) {}

            testRule$bisli(ctx, param) {}

            bamba(ctx, param) {}

            oops(ctx, param) {}
        }

        expect(() => new CstVisitorValidatorRedundant()).to.throw(
            "Redundant visitor method: <oops>"
        )
        expect(() => new CstVisitorValidatorRedundant()).to.throw(
            "Errors Detected in CST Visitor"
        )
    })
})
