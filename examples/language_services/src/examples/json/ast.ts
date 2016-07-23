import {
    Nil,
    AstNode,
    NIL,
    setParent
} from "../../pudu/ast"
import {Token} from "chevrotain"

export type ValueNode = StringNode | NumberNode | TrueNode | FalseNode |
    NullNode | ArrayNode | ObjectNode | Nil

export type JsonRootNode = ObjectNode | ArrayNode

export class ObjectNode extends AstNode {

    constructor(private _items:ObjectItemNode[],
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
        Object.freeze(_items)
    }

    get items():ObjectItemNode[] {
        return this._items
    }
}

export class ObjectItemNode extends AstNode {

    constructor(private _key:StringNode,
                private _value:ValueNode = NIL,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get key():StringNode {
        return this._key
    }

    get value():ValueNode {
        return this._value
    }
}

export class ArrayNode extends AstNode {

    constructor(private _elements:ValueNode[],
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
        Object.freeze(_elements)
    }

    get elements():ValueNode[] {
        return this._elements
    }
}

export class StringNode extends AstNode {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get value():string {
        return this._value
    }
}

export class NumberNode extends AstNode {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    // using a 'string' type to avoid possible precision issues in converting JSON numbers to javascript numbers
    // uncertain there is really a problem...
    get value():string {
        return this._value
    }
}

export class TrueNode extends AstNode {}

export class FalseNode extends AstNode {}

export class NullNode extends AstNode {}
