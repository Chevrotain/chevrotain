import {
    BaseBySuperTypeDispatcher,
    IAstPatternDispatcher,
    findHandleMethodsOnDispatcher,
    validateBaseDispatcher,
    findClassNamesThatNeedDispatcherImpel
} from "../../pudu/dispatcher"
import * as jesAst from "./ast"
import {
    ObjectNode,
    ObjectItemNode,
    ArrayNode,
    StringNode,
    NumberNode,
    TrueNode,
    FalseNode,
    NullNode
} from "./ast"
import {AstNode} from "../../pudu/ast"

export class BaseJsonDispatcher<IN, OUT> extends BaseBySuperTypeDispatcher<IN, OUT> {

    private static performedBaseValidations = false

    constructor() {
        super()
        // TODO: why does this repeat in all dispatchers? can some of this code be included in the BaseBySuperTypeDispatcher
        if (!BaseJsonDispatcher.performedBaseValidations) {
            BaseJsonDispatcher.performedBaseValidations = true
            // don't worry the static flag prevents infinite recursion
            let baseDispatcher = new BaseJsonDispatcher()
            let actualHandlerMethods = findHandleMethodsOnDispatcher(baseDispatcher)
            let classesThatNeedHandlers = this.getSupportedClassNames()
            validateBaseDispatcher(classesThatNeedHandlers, actualHandlerMethods)
        }
    }

    getSupportedClassNames():string[] {
        return findClassNamesThatNeedDispatcherImpel(jesAst).concat(super.getSupportedClassNames())
    }

    getBaseDispatcherInstance():IAstPatternDispatcher<IN, OUT> {
        return new BaseJsonDispatcher<IN, OUT>()
    }

    handleObjectNode(node:ObjectNode, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleObjectItemNode(node:ObjectItemNode, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleArrayNode(node:ArrayNode, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleStringNode(node:StringNode, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleNumberNode(node:NumberNode, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleTrueNode(node:TrueNode, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleFalseNode(node:FalseNode, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleNullNode(node:NullNode, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }
}

/**
 * convenience class to be used in situations where the same action needs to be invoked on all the nodes
 * alternatively just use a map/forEach... :)
 */
export class SameActionDispatcher<IN, OUT> extends BaseJsonDispatcher<IN, OUT> {

    constructor(private action:(node:AstNode) => OUT) {super()}

    handleAstNode(node:AstNode):OUT {
        return this.action(node)
    }
}
