import {
    createToken,
    Token,
    tokenLabel,
    tokenMatcher,
    tokenName
} from "../../src/scan/tokens_public"
import { Lexer } from "../../src/scan/lexer_public"
import { createTokenInstance } from "../../src/scan/tokens_public"

describe("The Chevrotain Tokens namespace", () => {
    context("createToken", () => {
        ;("use strict")

        let TrueLiteral = createToken({ name: "TrueLiteral" })
        class FalseLiteral extends Token {}

        it("exports a utility function that returns a token's name", () => {
            // FalseLiteral was created with an anonymous function as its constructor yet tokenName(...)
            // should still work correctly on it if the 'tokenName' property has been set on its constructor.
            expect(tokenName(FalseLiteral)).to.equal("FalseLiteral")
            expect(tokenName(TrueLiteral)).to.equal("TrueLiteral")
        })

        let A = createToken({ name: "A" })
        let B = createToken({ name: "B", parent: A })

        B.GROUP = "Special"

        let C = createToken({ name: "C", pattern: /\d+/, parent: B })
        let D = createToken({ name: "D", pattern: /\w+/, parent: B })
        let Plus = createToken({ name: "Plus", pattern: /\+/ })
        Plus.LABEL = "+"

        it("provides an createTokenInstance utility - creating an instance", () => {
            let aInstance = createTokenInstance(A, "Hello", 0, 4, 1, 1, 1, 5)
            expect(aInstance.image).to.equal("Hello")
            expect(aInstance.startOffset).to.equal(0)
            expect(aInstance.endOffset).to.equal(4)
            expect(aInstance.startLine).to.equal(1)
            expect(aInstance.endLine).to.equal(1)
            expect(aInstance.startColumn).to.equal(1)
            expect(aInstance.endColumn).to.equal(5)
        })

        it("provides an extendToken utility - creating a subclass instance", () => {
            let aInstance = createTokenInstance(A, "World", 0, 4, 1, 1, 1, 5)
            expect(aInstance.image).to.equal("World")
            expect(aInstance.startOffset).to.equal(0)
            expect(aInstance.endOffset).to.equal(4)
            expect(aInstance.startLine).to.equal(1)
            expect(aInstance.endLine).to.equal(1)
            expect(aInstance.startColumn).to.equal(1)
            expect(aInstance.endColumn).to.equal(5)
        })

        it("provides an extendToken utility - inheritance chain", () => {
            let dInstance = new D("world", 0, 1, 1)
            expect(dInstance).to.be.an.instanceof(A)
            expect(dInstance).to.be.an.instanceof(B)
            expect(dInstance).not.to.be.an.instanceof(C)

            let cInstance = new C("666", 0, 1, 1)
            expect(cInstance).to.be.an.instanceof(A)
            expect(cInstance).to.be.an.instanceof(B)

            let bInstance = new B("666", 0, 1, 1)
            expect(bInstance).to.be.an.instanceof(A)
        })

        it("provides an extendToken utility - static properties inheritance", () => {
            expect(D.GROUP).to.equal("Special")
            expect(C.GROUP).to.equal("Special")
        })

        it("Allows customization of the label", () => {
            // Default to class name
            expect(tokenLabel(B)).to.equal("B")
            // Unless there's a LABEL property
            expect(tokenLabel(Plus)).to.equal("+")
        })

        it("provides a utility to verify if a token instance matches a Token Type", () => {
            let ATokRegular = createToken({ name: "ATokRegular" })
            let BTokRegular = createToken({ name: "BTokRegular" })
            let AInstanceRegular = createTokenInstance(
                ATokRegular,
                "a",
                -1,
                -1,
                -1,
                -1,
                -1,
                -1
            )
            let BInstanceRegular = createTokenInstance(
                BTokRegular,
                "b",
                -1,
                -1,
                -1,
                -1,
                -1,
                -1
            )

            expect(tokenMatcher(AInstanceRegular, ATokRegular)).to.be.true
            expect(tokenMatcher(AInstanceRegular, BTokRegular)).to.be.false
            expect(tokenMatcher(BInstanceRegular, BTokRegular)).to.be.true
            expect(tokenMatcher(BInstanceRegular, ATokRegular)).to.be.false
        })

        it("Will augment Token Constructors with additional metadata basic", () => {
            let A = createToken({ name: "A" })
            let B = createToken({ name: "B" })

            expect(A.tokenType).to.be.greaterThan(0)
            expect(B.tokenType).to.be.greaterThan(A.tokenType)

            expect(A.extendingTokenTypes).to.be.an.instanceOf(Array)
            expect(A.extendingTokenTypes).to.be.empty
            expect(B.extendingTokenTypes).to.be.an.instanceOf(Array)
            expect(B.extendingTokenTypes).to.be.empty
        })

        it("can define a token Label via the createToken utilities", () => {
            let A = createToken({ name: "A", label: "bamba" })
            expect(tokenLabel(A)).to.equal("bamba")
        })

        it("can define a POP_MODE via the createToken utilities", () => {
            let A = createToken({ name: "A", pop_mode: true })
            expect(A).to.haveOwnProperty("POP_MODE")
            expect(A.POP_MODE).to.be.true
        })

        it("can define a PUSH_MODE via the createToken utilities", () => {
            let A = createToken({ name: "A", push_mode: "attribute" })
            expect(A).to.haveOwnProperty("PUSH_MODE")
            expect(A.PUSH_MODE).to.equal("attribute")
        })

        it("can define a LONGER_ALT via the createToken utilities", () => {
            let A = createToken({ name: "A" })
            let B = createToken({ name: "B", longer_alt: A })
            expect(B).to.haveOwnProperty("LONGER_ALT")
            expect(B.LONGER_ALT).to.equal(A)
        })

        it("can define a token group via the createToken utilities", () => {
            let A = createToken({ name: "A", group: Lexer.SKIPPED })
            expect(A).to.haveOwnProperty("GROUP")
            expect(A.GROUP).to.equal(Lexer.SKIPPED)
        })
    })
})
