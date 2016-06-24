import {
    IOutlineNode, compareAlphabetically, IOutlineDispatcher, NO_OUTLINE_FOR_NODE,
    buildOutline, sortOutline
} from "../../src/pudu/outline"
import {NIL, AstNode, setParent} from "../../src/pudu/ast"
import {BaseBySuperTypeDispatcher, IAstPatternDispatcher} from "../../src/pudu/dispatcher"
import {expect} from "chai"

class Interface extends AstNode {
    constructor(public name:string,
                public methods:Method[],
                public _parent:AstNode = NIL) {
        super(_parent)
        setParent(this)
    }
}

class Method extends AstNode {
    constructor(public name:string,
                public params:Param[],
                public isExported:boolean = true,
                _parent:AstNode = NIL) {
        super(_parent)
        setParent(this)
    }
}

class Param extends AstNode {
    constructor(public name:string,
                public type:Type,
                _parent:AstNode = NIL) {
        super(_parent)
        setParent(this)
    }
}

class Type extends AstNode {}

class ExampleOutlineDispatcher extends BaseBySuperTypeDispatcher<void, string> implements IOutlineDispatcher {

    constructor() {
        super()
        // disable validations for this test mock.
        this.performedInstanceValidations = true
    }

    getBaseDispatcherInstance():IAstPatternDispatcher<void, string> {
        return undefined
    }

    handleInterface(node:Interface):string {
        return node.name
    }

    handleMethod(node:Method):string {
        return node.name
    }

    handleParam(node:Param):string {
        return node.name
    }

    handleType(node:Type):string {
        return NO_OUTLINE_FOR_NODE
    }
}

describe("The pudu outline capabilities", () => {

    let foo = new Method("foo", [])
    let ima = new Param("ima", new Type())
    let aba = new Param("aba", new Type())
    let bamba = new Param("bamba", new Type())
    let bar = new Method("bar", [ima, aba, bamba])

    let api = new Interface("api", [
        foo,
        bar
    ])

    it("can create an outline from an Ast", () => {
        let expected = {
            name:     "api",
            astNode:     api,
            children: [
                {
                    name:     "foo",
                    astNode:     foo,
                    children: []
                },
                {
                    name:     "bar",
                    astNode:     bar,
                    children: [
                        {
                            name:     "ima",
                            astNode:     ima,
                            children: []
                        },
                        {
                            name:     "aba",
                            astNode:     aba,
                            children: []
                        },
                        {
                            name:     "bamba",
                            astNode:     bamba,
                            children: []
                        }
                    ]
                }]
        }
        let actual = buildOutline(api, new ExampleOutlineDispatcher())
        expect(actual).to.deep.equal(expected)
    })

    it("can sort an outline alphabetically", () => {
        let expected = {
            name:     "api",
            astNode:     api,
            children: [
                {
                    name:     "bar",
                    astNode:     bar,
                    children: [
                        {
                            name:     "aba",
                            astNode:     aba,
                            children: []
                        },
                        {
                            name:     "bamba",
                            astNode:     bamba,
                            children: []
                        },
                        {
                            name:     "ima",
                            astNode:     ima,
                            children: []
                        }
                    ]
                },
                {
                    name:     "foo",
                    astNode:     foo,
                    children: []
                }]
        }
        let unsortedOutline = buildOutline(api, new ExampleOutlineDispatcher())
        let sortedActual = sortOutline(unsortedOutline, compareAlphabetically)
        expect(sortedActual).to.deep.equal(expected)
    })

    it("can sort an outline by position", () => {
        // TODO:
    })

    describe("The Pudu outline comparing capabilities", () => {

        context("alphabetical comparison", () => {

            it("can compare different lowcase strings", () => {
                let bigger:IOutlineNode = {
                    name:     "bamba",
                    astNode:  NIL,
                    children: []
                }

                let smaller:IOutlineNode = {
                    name:     "aba",
                    astNode:  NIL,
                    children: []
                }

                expect(compareAlphabetically(bigger, smaller)).to.be.greaterThan(0)
                expect(compareAlphabetically(smaller, bigger)).to.be.lessThan(0)
            })

            it("can compare different multicase strings", () => {
                let bigger:IOutlineNode = {
                    name:     "Dog",
                    astNode:  NIL,
                    children: []
                }

                let smaller:IOutlineNode = {
                    name:     "caT",
                    astNode:  NIL,
                    children: []
                }

                expect(compareAlphabetically(bigger, smaller)).to.be.greaterThan(0)
                expect(compareAlphabetically(smaller, bigger)).to.be.lessThan(0)
            })

            it("can compare equal lowcase strings", () => {
                let identical1:IOutlineNode = {
                    name:     "equal opportunity policy",
                    astNode:  NIL,
                    children: []
                }

                let identical2:IOutlineNode = {
                    name:     "equal opportunity policy",
                    astNode:  NIL,
                    children: []
                }

                expect(compareAlphabetically(identical1, identical2)).to.equal(0)
                expect(compareAlphabetically(identical2, identical1)).to.equal(0)
            })

            it("can compare equal multi case strings", () => {
                let identical1:IOutlineNode = {
                    name:     "Equal opporTunity polIcy",
                    astNode:  NIL,
                    children: []
                }

                let identical2:IOutlineNode = {
                    name:     "Equal opporTunity polIcy",
                    astNode:  NIL,
                    children: []
                }

                expect(compareAlphabetically(identical1, identical2)).to.equal(0)
                expect(compareAlphabetically(identical2, identical1)).to.equal(0)
            })
        })


        it("can compare two outlineNodes by textual position", () => {

        })
    })

})
