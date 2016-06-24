import {
    ParseTree,
    SyntaxBoxPT
} from "../../pudu/parse_tree"
import {
    ObjectNode,
    ObjectItemNode,
    ValueNode,
    ArrayNode,
    StringNode,
    NumberNode,
    TrueNode,
    FalseNode,
    NullNode
} from "./ast"
import {
    ObjectItemPT,
    ObjectPT,
    ArrayPT,
    ValuePT
} from "./parser"
import {
    buildSyntaxBox,
    MATCH_CHILDREN
} from "../../pudu/builder"
import {NIL} from "../../pudu/ast"
import {
    StringLiteral,
    NumberLiteral,
    NullLiteral,
    TrueLiteral,
    FalseLiteral
} from "./lexer"

export function buildObjectNode(tree:ParseTree):ObjectNode {
    let objectItemNodes = []
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: ObjectItemPT, THEN: (childTree) => objectItemNodes.push(buildObjectItemNode(childTree))},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let objectNodeInstance = new ObjectNode(objectItemNodes, NIL, syntaxBox)
    return objectNodeInstance
}

export function buildObjectItemNode(tree:ParseTree):ObjectItemNode {
    let key = undefined, value = undefined
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: StringLiteral, THEN: (childTree) => key = buildStringNode(childTree)},
        {CASE: ValuePT, THEN: (childTree) => value = buildValueNode(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let objectItemNodeInstance = new ObjectItemNode(key, value, NIL, syntaxBox)
    return objectItemNodeInstance
}

export function buildValueNode(tree:ParseTree):ValueNode {
    let valueInstance = undefined

    MATCH_CHILDREN(tree,
        {CASE: StringLiteral, THEN: (childTree) => valueInstance = buildStringNode(childTree)},
        {CASE: NumberLiteral, THEN: (childTree) => valueInstance = buildNumberNode(childTree)},
        {CASE: NullLiteral, THEN: (childTree) => valueInstance = buildNullNode(childTree)},
        {CASE: TrueLiteral, THEN: (childTree) => valueInstance = buildTrueNode(childTree)},
        {CASE: FalseLiteral, THEN: (childTree) => valueInstance = buildFalseNode(childTree)},
        {CASE: ObjectPT, THEN: (childTree) => valueInstance = buildObjectNode(childTree)},
        {CASE: ArrayPT, THEN: (childTree) => valueInstance = buildArrayNode(childTree)}
    )

    // no need for setParent here, it is set in one of the specific builders
    return valueInstance
}

export function buildArrayNode(tree:ParseTree):ArrayNode {
    let arrItems = []
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: ValuePT, THEN: (childTree) => arrItems.push(buildValueNode(childTree))},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let arrayNodeInstance = new ArrayNode(arrItems, NIL, syntaxBox)
    return arrayNodeInstance
}

export function buildStringNode(tree:ParseTree):StringNode {
    let orgStringVal = tree.payload.image
    let stringValWithoutQuotes = orgStringVal.substring(1, orgStringVal.length - 1)
    return new StringNode(stringValWithoutQuotes, NIL, [tree.payload])
}

export function buildNumberNode(tree:ParseTree):NumberNode {
    return new NumberNode(tree.payload.image, NIL, [tree.payload])
}

export function buildTrueNode(tree:ParseTree):TrueNode {
    return new TrueNode(NIL, [tree.payload])
}

export function buildFalseNode(tree:ParseTree):FalseNode {
    return new FalseNode(NIL, [tree.payload])
}

export function buildNullNode(tree:ParseTree):NullNode {
    return new NullNode(NIL, [tree.payload])
}
