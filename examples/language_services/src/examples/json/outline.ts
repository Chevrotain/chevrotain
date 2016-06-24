import {BaseJsonDispatcher} from "./dispatcher"
import {
    IOutlineDispatcher,
    NO_OUTLINE_FOR_NODE,
    buildOutline,
    IOutlineNode,
    replaceOutlineNodes,
    removeOutlineNodes,
    flattenOutline
} from "../../pudu/outline"
import {
    ObjectNode,
    ObjectItemNode,
    ArrayNode,
    StringNode,
    NumberNode,
    TrueNode,
    FalseNode,
    NullNode,
    JsonRootNode
} from "./ast"
import * as _ from "lodash"

export function buildJsonOutline(node:JsonRootNode):IOutlineNode {
    let rawOutline = buildOutline(node, new JsonOutlineDispatcher())

    let withoutSingleChildObjects = replaceOutlineNodes(rawOutline, (currOutline) => {
        // skip collections (ObjectNode/ArrayNode) which has only a single item.
        if (currOutline.children.length === 1 &&
            (currOutline.astNode instanceof ObjectNode ||
            currOutline.astNode instanceof ArrayNode)) {
            return _.first(currOutline.children)
        }

        return currOutline
    })
    let withoutKeylessCollections = removeOutlineNodes(withoutSingleChildObjects, (currOutline) => {
        return isCollectionNode(currOutline) && isKeyLess(currOutline)
    })

    return withoutKeylessCollections
}

function isCollectionNode(outline:IOutlineNode):boolean {
    return outline.astNode instanceof ArrayNode ||
        outline.astNode instanceof ObjectNode
}

function isKeyLess(outline:IOutlineNode):boolean {
    // not very effective performance wise, but probably not relevant for real world inputs sizes.
    let allChildren = flattenOutline(outline)
    return !_.some(allChildren,
        (currChild) => currChild.astNode instanceof ObjectItemNode)
}

class JsonOutlineDispatcher extends BaseJsonDispatcher<void, string> implements IOutlineDispatcher {

    handleObjectNode(node:ObjectNode):string {
        return "object"
    }

    handleObjectItemNode(node:ObjectItemNode):string {
        return node.key.value
    }

    handleArrayNode(node:ArrayNode):string {
        return "array"
    }

    handleStringNode(node:StringNode):string {
        return NO_OUTLINE_FOR_NODE
    }

    handleNumberNode(node:NumberNode):string {
        return NO_OUTLINE_FOR_NODE
    }

    handleTrueNode(node:TrueNode):string {
        return NO_OUTLINE_FOR_NODE
    }

    handleFalseNode(node:FalseNode):string {
        return NO_OUTLINE_FOR_NODE
    }

    handleNullNode(node:NullNode):string {
        return NO_OUTLINE_FOR_NODE
    }
}

