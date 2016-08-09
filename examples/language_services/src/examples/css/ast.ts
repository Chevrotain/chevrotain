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
    constructor(private _name:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get name():string {
        return this._name
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

export class Attribute extends SimpleSelectorSuffix {

    constructor(private _key:Identifier,
                private _relation:AttributeRelation,
                private _value:AttributeValue,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
        setParent(this)
    }

    get key():Identifier {
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
export class EqualsRelation extends AttributeRelation {}
export class IncludesRelation extends AttributeRelation {}
export class BeginsRelation extends AttributeRelation {}

export type AttributeValue = StringLiteral | Identifier

export class Pseudo extends SimpleSelectorSuffix {
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
    constructor(private _property:Identifier,
                private _expr:Expr,
                private _important:Important = NIL,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get property():Identifier {
        return this._property
    }

    get expr():Expr {
        return this._expr
    }

    get important():Important {
        return this._important
    }
}

export class Important extends AstNode {}

export abstract class BinaryOperator extends AstNode {}

export class SlashOperator extends BinaryOperator {}
export class CommaOperator extends BinaryOperator {}


// TODO: convert into a tree structure instead of arrays ?
// TODO: or maybe this is only relevant for AST while this structure is an ST?
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
    constructor(private _value:Value,
                private _unaryOperator:UnaryOperator = NIL,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get unaryOperator():UnaryOperator {
        return this._unaryOperator
    }

    get value():Value {
        return this._value
    }
}

export type Value = NumericalLiteral |
    Identifier |
    CssFunction |
    CssUri |
    StringLiteral |
    HashColorLiteral


export abstract class NumericalLiteral extends AstNode {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get value():string {
        return this._value
    }
}

export class EmsLiteral extends NumericalLiteral {}
export class ExsLiteral extends NumericalLiteral {}

export abstract class LengthLiteral extends NumericalLiteral {}
export class PxLiteral extends LengthLiteral {}
export class CmLiteral extends LengthLiteral {}
export class MmLiteral extends LengthLiteral {}
export class InLiteral extends LengthLiteral {}
export class PtLiteral extends LengthLiteral {}
export class PcLiteral extends LengthLiteral {}

export abstract class AngleLiteral extends NumericalLiteral {}
export class DegLiteral extends AngleLiteral {}
export class RadLiteral extends AngleLiteral {}
export class GradLiteral extends AngleLiteral {}

export abstract class TimeLiteral extends NumericalLiteral {}
export class MsLiteral extends TimeLiteral {}
export class SecLiteral extends TimeLiteral {}

export abstract class FrequencyLiteral extends NumericalLiteral {}
export class HzLiteral extends FrequencyLiteral {}
export class KhzLiteral extends FrequencyLiteral {}

export class PlainNumberLiteral extends NumericalLiteral {}
export class PercentageLiteral extends NumericalLiteral {}

// TODO: create both single quotes and double quotes string Literal
// TODO would be useful in formatting use cases.
export class StringLiteral extends AstNode {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get value():string {
        return this._value
    }
}

export class Identifier extends AstNode {
    constructor(private _name:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    // TODO: should this be called name of value ?
    get name():string {
        return this._name
    }
}

export class FunctionIdentifier extends Identifier {}

// TODO: is this a literal? should extend some abstract Literal class?
export class CssUri extends AstNode {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get value():string {
        return this._value
    }
}

export class CssFunction extends AstNode {
    constructor(private _funcName:FunctionIdentifier,
                private _argument:Expr,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get funcName():FunctionIdentifier {
        return this._funcName
    }

    get argument():Expr {
        return this._argument
    }
}

// TODO: rename to HexColor as in the spec
// TODO: extend Literal? create abstract Literal?
export class HashColorLiteral extends AstNode {
    constructor(private _value:string,
                _parent:AstNode = NIL,
                _syntaxBox:Token[] = []) {
        super(_parent, _syntaxBox)
    }

    get value():string {
        return this._value
    }
}

export type ElementName = Identifier | Star

export class Star extends AstNode {}

