// TODO: add syntaxBox checks
import {
    StringLiteral,
    NumberLiteral,
    TrueLiteral,
    FalseLiteral,
    NullLiteral
} from "../../../src/examples/json/lexer"
import {PT} from "../../../src/pudu/parse_tree"
import {
    buildStringNode,
    buildNumberNode,
    buildTrueNode,
    buildFalseNode,
    buildNullNode,
    buildArrayNode,
    buildObjectItemNode,
    buildObjectNode
} from "../../../src/examples/json/builder"
import {
    StringNode,
    NumberNode,
    TrueNode,
    FalseNode,
    NullNode,
    ArrayNode,
    ObjectItemNode,
    ObjectNode
} from "../../../src/examples/json/ast"
import {
    ObjectItemPT,
    ValuePT,
    ObjectPT,
    ArrayPT
} from "../../../src/examples/json/parser"

import {expect} from "chai"
import {createTokenInstance} from "chevrotain"

describe("The jes ast builder", () => {

    it("can build a StringNode Ast", () => {
        let ptInput = PT(createTokenInstance(StringLiteral, "\"bamba\"", 1, 1, 1, 1, 1, 1))
        let astOutput = buildStringNode(ptInput)
        expect(astOutput).to.be.instanceOf(StringNode)
        expect(astOutput.value).to.equal("bamba")
    })

    it("can build a NumberNode Ast", () => {
        let ptInput = PT(createTokenInstance(NumberLiteral, "666", 1, 1, 1, 1, 1, 1))
        let astOutput = buildNumberNode(ptInput)
        expect(astOutput).to.be.instanceOf(NumberNode)
        expect(astOutput.value).to.equal("666")
    })

    it("can build a TrueNode Ast", () => {
        let ptInput = PT(createTokenInstance(TrueLiteral, "true", 1, 1, 1, 1, 1, 1))
        let astOutput = buildTrueNode(ptInput)
        expect(astOutput).to.be.instanceOf(TrueNode)
    })

    it("can build a FalseNode Ast", () => {
        let ptInput = PT(createTokenInstance(FalseLiteral, "false", 1, 1, 1, 1, 1, 1))
        let astOutput = buildFalseNode(ptInput)
        expect(astOutput).to.be.instanceOf(FalseNode)
    })

    it("can build a NullNode Ast", () => {
        let ptInput = PT(createTokenInstance(NullLiteral, "null", 1, 1, 1, 1, 1, 1))
        let astOutput = buildNullNode(ptInput)
        expect(astOutput).to.be.instanceOf(NullNode)
    })

    it("can build an arrayNode Ast", () => {
        let ptInput = PT(ArrayPT,
            [
                PT(ValuePT, [PT(createTokenInstance(NumberLiteral, "123", 1, 1, 1, 1, 1, 1))]),
                PT(ValuePT, [PT(createTokenInstance(StringLiteral, "\"bisli\"", 1, 1, 1, 1, 1, 1))]),
                PT(ValuePT, [PT(createTokenInstance(NullLiteral, "null", 1, 1, 1, 1, 1, 1))]),
            ]
        )

        let astOutput = buildArrayNode(ptInput)
        expect(astOutput).to.be.instanceOf(ArrayNode)
        expect(astOutput.children().length).to.equal(3)
        expect(astOutput.children()[0]).to.be.instanceOf(NumberNode)
        expect(astOutput.children()[1]).to.be.instanceOf(StringNode)
        expect(astOutput.children()[2]).to.be.instanceOf(NullNode)
    })

    it("can build an ObjecItemNode Ast", () => {
        let ptInput = PT(ObjectItemPT,
            [
                PT(createTokenInstance(StringLiteral, "\"key\"", 1, 1, 1, 1, 1, 1)),
                PT(ValuePT, [PT(createTokenInstance(NumberLiteral, "\"value\"", 1, 1, 1, 1, 1, 1))])
            ]
        )

        let astOutput = buildObjectItemNode(ptInput)
        expect(astOutput).to.be.instanceOf(ObjectItemNode)
        expect(astOutput.key).to.be.instanceOf(StringNode)
        expect(astOutput.value).to.be.instanceOf(NumberNode)
    })

    it("can build an ObjectNode Ast", () => {
        let ptInput = PT(ObjectPT,
            [
                PT(ObjectItemPT, [
                    PT(createTokenInstance(StringLiteral, "\"key1\"", 1, 1, 1, 1, 1, 1)),
                    PT(ValuePT, [PT(createTokenInstance(NumberLiteral, "\"value\"", 1, 1, 1, 1, 1, 1))])
                ]),
                PT(ObjectItemPT, [
                    PT(createTokenInstance(StringLiteral, "\"key2\"", 1, 1, 1, 1, 1, 1)),
                    PT(ValuePT, [PT(createTokenInstance(NumberLiteral, "\"value\"", 1, 1, 1, 1, 1, 1))])
                ]),
                PT(ObjectItemPT, [
                    PT(createTokenInstance(StringLiteral, "\"key3\"", 1, 1, 1, 1, 1, 1)),
                    PT(ValuePT, [PT(createTokenInstance(NumberLiteral, "\"value\"", 1, 1, 1, 1, 1, 1))])
                ])
            ]
        )

        let astOutput = buildObjectNode(ptInput)
        expect(astOutput).to.be.instanceOf(ObjectNode)
        expect(astOutput.items.length).to.equal(3)
        expect(astOutput.children()[0]).to.be.instanceOf(ObjectItemNode)
        expect(astOutput.children()[1]).to.be.instanceOf(ObjectItemNode)
        expect(astOutput.children()[2]).to.be.instanceOf(ObjectItemNode)
    })
})
