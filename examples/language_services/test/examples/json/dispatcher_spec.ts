import {
    BaseJsonDispatcher,
    SameActionDispatcher
} from "../../../src/examples/json/dispatcher"
import {AstNode} from "../../../src/pudu/ast"
import {
    ArrayNode,
    NumberNode,
    StringNode,
    NullNode,
    FalseNode,
    TrueNode,
    ObjectItemNode,
    ObjectNode
} from "../../../src/examples/json/ast"

import {expect} from "chai"

describe("The jes visitor implementation", () => {

    it("can dispatch for an AstNode - sanity test", () => {
        let dispatcherConstructor = class extends BaseJsonDispatcher<void, string> {

            //noinspection JSUnusedLocalSymbols
            handleAstNode(node:AstNode):string {
                throw Error("should not have gotten to this handler when all sample nodes have handlers")
            }

            handleArrayNode(node:ArrayNode):string {
                return `length: ${node.elements.length}`
            }

            handleNumberNode(node:NumberNode):string {
                return node.value
            }
        }

        let dispatcher = new dispatcherConstructor()

        let sixes = new NumberNode("666")
        let threes = new NumberNode("333")
        let arr = new ArrayNode([sixes, threes])

        let expectedResult = ["length: 2", "666", "333"]
        let actualResult = arr.visit(dispatcher)

        expect(actualResult).to.contain.members(expectedResult)
        expect(expectedResult).to.contain.members(actualResult)
        expect(actualResult.length).to.equal(expectedResult.length)
    })

    it("can dispatch for all AstNodes types", () => {
        let counter = 0
        let counterDispatcher = new SameActionDispatcher<void, number>(() => counter++)

        let ast = new ObjectNode([
            new ObjectItemNode(
                new StringNode("key1"),
                new ArrayNode([
                    new NumberNode("555"),
                    new NullNode(),
                    new FalseNode(),
                    new TrueNode()
                ])),
        ])

        expect(counter).to.equal(0)
        ast.visit(counterDispatcher)
        expect(counter).to.equal(8) // each node visited once
    })
})
