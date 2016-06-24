import {VirtualToken} from "chevrotain"
import {AstNode, NIL, setParent} from "../../src/pudu/ast"
import {ParseTree} from "../../src/pudu/parse_tree"
import {MATCH_CHILDREN} from "../../src/pudu/builder"
import {expect} from "chai"

class Root extends VirtualToken {}
class A extends VirtualToken {}
class B extends VirtualToken {}
class C extends VirtualToken {}

class C2 extends C {}
class C3 extends C {}


class Identifier extends AstNode {}

class GoPackageName extends AstNode {
    constructor(public pkgName:Identifier, public itemName:Identifier) {
        super()
        setParent(this)
    }
}

class FQN extends AstNode {
    constructor(public idents:Identifier[]) {
        super()
        setParent(this)
    }
}

describe("The Core AstBuilder", () => {

    // TODO: nested describe for the pattern matcher IT
    it("Implements a pattern patcher by ParseTree payload class type - simple", () => {
        let input = new ParseTree(new Root(),
            [
                new ParseTree(new A()),
                new ParseTree(new B()),
                new ParseTree(new C())
            ])

        let actual = ""

        MATCH_CHILDREN(input,
            {CASE: A, THEN: () => actual += "A"},
            {CASE: B, THEN: () => actual += "B"},
            {CASE: C, THEN: () => actual += "C"}
        )

        expect(actual).to.equal("ABC")
    })

    it("Implements a pattern patcher by ParseTree payload class type - hierarchy", () => {
        let input = new ParseTree(new Root(),
            [
                new ParseTree(new A()),
                new ParseTree(new C2()),
                new ParseTree(new C3()),
                new ParseTree(new C())
            ])

        let actual = ""

        MATCH_CHILDREN(input,
            {CASE: A, THEN: () => actual += "A"},
            {CASE: B, THEN: () => actual += "B"},
            {CASE: C2, THEN: () => actual += "C2"},
            {CASE: C3, THEN: () => actual += "C3"},
            {CASE: C, THEN: () => actual += "C"}
        )

        expect(actual).to.equal("AC2C3C")
    })


    it("Implements a pattern patcher by ParseTree payload class type - non exhaustive match", () => {
        let input = new ParseTree(new Root(),
            [
                new ParseTree(new A()),
                new ParseTree(new C()) // no matching CASE for C in the pattern matcher below
            ])

        let actual = ""

        expect(() => MATCH_CHILDREN(input,
            {CASE: A, THEN: () => actual += "A"},
            {CASE: B, THEN: () => actual += "B"}
        )).to.throw("non exhaustive match")
    })

    it("Implements a utility to set the parent of an AstNode during its constructor", () => {
        let heapPkg = new Identifier()
        let popFunc = new Identifier()

        let packageName = new GoPackageName(heapPkg, popFunc)

        expect(heapPkg.parent()).to.equal(packageName)
        expect(popFunc.parent()).to.equal(packageName)
    })

})
