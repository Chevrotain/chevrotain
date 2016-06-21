import {buildJsonOutline} from "../../../src/examples/json/outline"
import {
    ObjectItemNode,
    StringNode,
    NumberNode,
    ObjectNode,
    ArrayNode
} from "../../../src/examples/json/ast"

import {expect} from "chai"

describe("The jes outline capabilities", () => {

    it("can create an outline from an ObjectNode Ast", () => {

        let key1 = new ObjectItemNode(new StringNode("key1"), new NumberNode("333"))
        let key2 = new ObjectItemNode(new StringNode("key2"), new NumberNode("666"))
        let key3 = new ObjectItemNode(new StringNode("key3"), new NumberNode("999"))

        let objectNode = new ObjectNode([key1, key2, key3])

        let expected = {
            name:     "object",
            astNode:  objectNode,
            children: [
                {
                    name:     "key1",
                    astNode:  key1,
                    children: []
                },
                {
                    name:     "key2",
                    astNode:  key2,
                    children: []
                },
                {
                    name:     "key3",
                    astNode:  key3,
                    children: []
                }
            ]
        }
        let actual = buildJsonOutline(objectNode)
        expect(actual).to.deep.equal(expected)
    })

    it("can create an outline from an ArrayNode Ast", () => {

        let key1 = new ObjectItemNode(new StringNode("key1"), new NumberNode("333"))
        let key2 = new ObjectItemNode(new StringNode("key2"), new NumberNode("666"))
        let key3 = new ObjectItemNode(new StringNode("key3"), new NumberNode("999"))

        let arrayNode = new ArrayNode([key1, key2, key3])

        let expected = {
            name:     "array",
            astNode:  arrayNode,
            children: [
                {
                    name:     "key1",
                    astNode:  key1,
                    children: []
                },
                {
                    name:     "key2",
                    astNode:  key2,
                    children: []
                },
                {
                    name:     "key3",
                    astNode:  key3,
                    children: []
                }
            ]
        }
        let actual = buildJsonOutline(arrayNode)
        expect(actual).to.deep.equal(expected)
    })


    it("will remove collections with just a single item from the outline", () => {

        let key1 = new ObjectItemNode(new StringNode("key1"), new NumberNode("333"))
        let nestedKey = new ObjectItemNode(new StringNode("nested_key1"), new NumberNode("111"))
        let nestedObject = new ObjectNode([nestedKey])
        let key2 = new ObjectItemNode(new StringNode("key2"), nestedObject)

        let objectNode = new ObjectNode([key1, key2])

        let expected = {
            name:     "object",
            astNode:  objectNode,
            children: [
                {
                    name:     "key1",
                    astNode:  key1,
                    children: []
                },
                {
                    name:     "key2",
                    astNode:  key2,
                    children: [{
                        name:     "nested_key1",
                        astNode:  nestedKey,
                        children: []
                    }]
                }
            ]
        }
        let actual = buildJsonOutline(objectNode)
        expect(actual).to.deep.equal(expected)
    })

    it("will remove keyless collections from the outline", () => {

        let key1 = new ObjectItemNode(new StringNode("key1"), new NumberNode("333"))
        let keylessNested = new ArrayNode([new ArrayNode([new ObjectNode([])])])
        let key2 = new ObjectItemNode(new StringNode("key2"), keylessNested)
        let objectNode = new ObjectNode([key1, key2])

        let expected = {
            name:     "object",
            astNode:  objectNode,
            children: [
                {
                    name:     "key1",
                    astNode:  key1,
                    children: []
                },
                {
                    name:     "key2",
                    astNode:  key2,
                    children: []
                }
            ]
        }
        let actual = buildJsonOutline(objectNode)
        expect(actual).to.deep.equal(expected)
    })

})
