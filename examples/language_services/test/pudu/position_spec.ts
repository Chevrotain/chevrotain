import {AstNode, NIL, NO_POSITION, setParent} from "../../src/pudu/ast"
import {Token} from "chevrotain"
import {expect} from "chai"

class A extends AstNode {
    constructor(public b:B,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }
}

class B extends AstNode {}

describe("The AstNode's textual position capabilities", () => {

    it("can extract textual position information from an AstNode", () => {
        let b = new B(NIL, [new Token("bamba", 2, 3, 4, 5, 6), new Token("bisli", 100, 50, 51, 52, 53)])
        let actual = b.position()
        expect(actual).to.deep.equal({
            startOffset: 2,
            startLine:   3,
            startColumn: 4,
            endOffset:   105,
            endLine:     52,
            endColumn:   53
        })
    })

    it("can extract textual position information from a complex AstNode", () => {
        let b = new B(NIL, [new Token("bamba", 1, 3, 4, 5, 6), new Token("pizza", 5, 4, 5, 6, 6)])
        let a = new A(b, NIL, [new Token("bisli", 100, 50, 51, 52, 53)])

        let actual = a.position()
        expect(actual).to.deep.equal({
            startOffset: 1, // The startOffset of 1 should be taken from the "pizza" token.
            startLine:   3, // yet this should be taken from the "bamba" token
            startColumn: 4,
            endOffset:   105,
            endLine:     52,
            endColumn:   53
        })
    })

    it("will report NO_POSITION when an AstNode has no position information", () => {
        let b = new B()

        let actual = b.position()
        expect(actual).to.equal(NO_POSITION)
    })

    it("will ignore Tokens inserted during recovery when computing the textual position", () => {

        let recoveredToken = new Token("pizza", 1111, 1, 234234, 52, 99)
        recoveredToken.isInsertedInRecovery = true

        let b = new B(NIL, [
            new Token("bamba", 2, 3, 4, 5, 6),
            new Token("bisli", 100, 50, 51, 52, 53),
            recoveredToken
        ])

        let actual = b.position()
        expect(actual).to.deep.equal({
            startOffset: 2,
            startLine:   3,
            startColumn: 4,
            endOffset:   105,
            endLine:     52,
            endColumn:   53
        })
    })

})
