import {
    AstNode,
    NIL,
    setParent
} from "../../pudu/ast"
import {Token} from "chevrotain"

export class CssStyleSheet extends AstNode {

    constructor(private _charsetHeader:CharsetHeader = NIL,
                private _imports:CssImport[] = [],
                private _contents:Contents[] = [],
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get charsetHeader():CharsetHeader {
        return this._charsetHeader
    }

    get imports():CssImport[] {
        return this._imports
    }

    get contents():Contents[] {
        return this._contents
    }
}

export class CharsetHeader extends AstNode {

    constructor(private _charset:StringLiteral,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get charset():StringLiteral {
        return this._charset
    }
}

export abstract class Contents extends AstNode {
    constructor(_parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }
}

export type CssImportTarget = StringLiteral | CssUri

export class CssImport extends AstNode {

    constructor(private _target:CssImportTarget,
                private _mediaList:CssMediaList = NIL,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get target():CssImportTarget {
        return this._target
    }

    get mediaList():CssMediaList {
        return this._mediaList
    }
}

export class Media extends Contents {

    constructor(private _mediaList:CssMediaList,
                private _ruleSet:RuleSet,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get mediaList():CssMediaList {
        return this._mediaList
    }

    get ruleSet():RuleSet {
        return this._ruleSet
    }
}

export class CssMediaList extends AstNode {

    constructor(private _mediums:Identifier[] = [],
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get mediums():Identifier[] {
        return this._mediums
    }
}

export class Page extends Contents {

    constructor(private _pseudoPage:PseudoPage = NIL,
                private _declarationsGroup:DeclarationsGroup,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get pseudoPage():PseudoPage {
        return this._pseudoPage
    }

    get declarationsGroup():DeclarationsGroup {
        return this._declarationsGroup
    }
}

export class DeclarationsGroup extends AstNode {

    constructor(private _declarations:Declaration[] = [],
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get declarations():Declaration[] {
        return this._declarations
    }
}

export class PseudoPage extends AstNode {

    constructor(private _name:Identifier,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get name():Identifier {
        return this._name
    }
}

export class RuleSet extends Contents {

    constructor(private _selectors:Selector[] = [],
                private _declarationsGroup:DeclarationsGroup,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get selectors():Selector[] {
        return this._selectors
    }

    get declarationsGroup():DeclarationsGroup {
        return this._declarationsGroup
    }
}

export class Selector extends AstNode {

    constructor(private _simpleSelector:SimpleSelector,
                private _combinator:Combinator = NIL,
                private _nextSelector:Selector = NIL,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get simpleSelector():SimpleSelector {
        return this._simpleSelector
    }

    get combinator():Combinator {
        return this._combinator
    }

    get nextSelector():Selector {
        return this._nextSelector
    }
}


export abstract class Combinator extends AstNode {}
export class PlusCombinator extends Combinator {}
export class GreaterThanCombinator extends Combinator {}

export class SimpleSelector extends AstNode {

    constructor(private _elementName:ElementName = NIL,
                private _suffixes:SimpleSelectorSuffix[] = [],
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get elementName():ElementName {
        return this._elementName
    }

    get suffixes():SimpleSelectorSuffix[] {
        return this._suffixes
    }
}

export abstract class SimpleSelectorSuffix extends AstNode {}

export class IDSelector extends SimpleSelectorSuffix {
    constructor(private _id:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get id():string {
        return this._id
    }
}

export class ClassSelector extends SimpleSelectorSuffix {

    constructor(private _className:Identifier,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get selectedclassName():Identifier {
        return this._className
    }
}

export class Attrib extends SimpleSelectorSuffix {

    constructor(private _key:string,
                private _relation:AttributeRelation,
                private _value:AttributeValue,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get key():string {
        return this._key
    }

    get relation():AttributeRelation {
        return this._relation
    }

    get value():AttributeValue {
        return this._value
    }
}

export abstract class AttributeRelation extends AstNode {}
export class Equals extends AttributeRelation {}
export class Includes extends AttributeRelation {}
export class Begins extends AttributeRelation {}

export type AttributeValue = StringLiteral | Identifier

export abstract class Pseudo extends SimpleSelectorSuffix {
    constructor(_className:PseudoClassName,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }
}

export type PseudoClassName = Identifier | PseudoFunc


export class PseudoFunc extends AstNode {
    constructor(private _funcName:FunctionIdentifier,
                private _argName:Identifier = NIL,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get funcName():FunctionIdentifier {
        return this._funcName
    }

    get argumentName():Identifier {
        return this._argName
    }
}

export class Declaration extends AstNode {
    constructor(private _property:string,
                private _expr:Expr,
                private _isImportant:boolean = false,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get property():string {
        return this._property
    }

    get expr():Expr {
        return this._expr
    }

    get isImportant():boolean {
        return this._isImportant
    }
}

export abstract class BinaryOperator extends AstNode {}

export class SlashOperator extends BinaryOperator {}
export class CommaOperator extends BinaryOperator {}


// TODO: convert into a tree structure instead of arrays
export class Expr extends AstNode {
    constructor(private _operands:Term[],
                private _operators:BinaryOperator[],
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get operands():Term[] {
        return this._operands
    }

    get operators():BinaryOperator[] {
        return this._operators
    }
}

export abstract class UnaryOperator extends AstNode {}
export class UnaryPlusOperator extends AstNode {}
export class UnaryMinusOperator extends AstNode {}

export class Term extends AstNode {
    constructor(private _unaryOperator:UnaryOperator = NIL,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get unaryOperator():UnaryOperator {
        return this._unaryOperator
    }
}

export abstract class Value extends AstNode {
    constructor(_parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }
}

// currently avoiding copy/paste mania by using this num to distinguish between different
// kinds of NumericalTypes
export enum NUMERICAL_TYPE {EMS, EXS, PX, CM, MM, IN, PT, PC, DEG, RAD, GRAD, MS, SEC, HZ, KHZ, PERCENTAGE, NUM }

export class NumericalLiteral extends Value {
    constructor(private _value:string,
                private _type:NUMERICAL_TYPE,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get value():string {
        return this._value
    }

    get type():NUMERICAL_TYPE {
        return this._type
    }
}

export class StringLiteral extends Value {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get value():string {
        return this._value
    }
}

// TODO: maybe should not extend Value and instead use a custom type definition
// export type Value = StringLiteral | Identifier | ... | ...
export class Identifier extends Value {
    constructor(private _name:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get name():string {
        return this._name
    }
}

export class FunctionIdentifier extends Identifier {}


export class CssUri extends Value {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get value():string {
        return this._value
    }
}

export class CssFunction extends Value {
    constructor(private _argument:Expr,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get argument():Expr {
        return this._argument
    }
}

export class Hexcolor extends Value {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get value():string {
        return this._value
    }
}

export class ElementName extends AstNode {

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
