import {
    BaseBySuperTypeDispatcher,
    IAstPatternDispatcher,
    findHandleMethodsOnDispatcher,
    validateBaseDispatcher,
    findClassNamesThatNeedDispatcherImpel
} from "../../pudu/dispatcher"
import * as cssAst from "./ast"
import {
    CssStyleSheet,
    CharsetHeader,
    Contents,
    CssImport,
    Media,
    CssMediaList,
    Page,
    DeclarationsGroup,
    PseudoPage,
    RuleSet,
    Selector,
    Combinator,
    SimpleSelector,
    SimpleSelectorSuffix,
    ClassSelector,
    Attribute,
    Pseudo,
    PseudoFunc,
    Declaration,
    BinaryOperator,
    Expr,
    UnaryOperator,
    Term,
    NumericalLiteral,
    StringLiteral,
    Identifier,
    CssUri,
    CssFunction,
    HashColorLiteral,
    GreaterThanCombinator,
    IDSelector,
    AttributeRelation,
    EqualsRelation,
    IncludesRelation,
    BeginsRelation,
    SlashOperator,
    CommaOperator,
    UnaryPlusOperator,
    UnaryMinusOperator,
    FunctionIdentifier,
    PlusCombinator,
    Star,
    Important,
    EmsLiteral,
    ExsLiteral,
    LengthLiteral,
    PxLiteral,
    CmLiteral,
    MmLiteral,
    InLiteral,
    PtLiteral,
    PcLiteral,
    AngleLiteral,
    DegLiteral,
    RadLiteral,
    GradLiteral,
    TimeLiteral,
    MsLiteral,
    SecLiteral,
    FrequencyLiteral,
    HzLiteral,
    KhzLiteral,
    PlainNumberLiteral,
    PercentageLiteral
} from "./ast"
import {AstNode} from "../../pudu/ast"


// TODO: perhaps this should be an abstract class
export class BaseCssDispatcher<IN, OUT> extends BaseBySuperTypeDispatcher<IN, OUT> {

    private static performedBaseValidations = false

    constructor() {
        super()
        // TODO: why does this repeat in all dispatchers? can some of this code be included in the BaseBySuperTypeDispatcher
        if (!BaseCssDispatcher.performedBaseValidations) {
            BaseCssDispatcher.performedBaseValidations = true
            // don't worry the static flag prevents infinite recursion
            let baseDispatcher = new BaseCssDispatcher()
            let actualHandlerMethods = findHandleMethodsOnDispatcher(baseDispatcher)
            let classesThatNeedHandlers = this.getSupportedClassNames()
            validateBaseDispatcher(classesThatNeedHandlers, actualHandlerMethods)
        }
    }

    getSupportedClassNames():string[] {
        return findClassNamesThatNeedDispatcherImpel(cssAst).concat(super.getSupportedClassNames())
    }

    getBaseDispatcherInstance():IAstPatternDispatcher<IN, OUT> {
        return new BaseCssDispatcher<IN, OUT>()
    }

    handleCssStyleSheet(node:CssStyleSheet, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleCharsetHeader(node:CharsetHeader, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleContents(node:Contents, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleCssImport(node:CssImport, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleMedia(node:Media, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleCssMediaList(node:CssMediaList, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePage(node:Page, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleDeclarationsGroup(node:DeclarationsGroup, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePseudoPage(node:PseudoPage, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleRuleSet(node:RuleSet, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleSelector(node:Selector, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleCombinator(node:Combinator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleSimpleSelector(node:SimpleSelector, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleSimpleSelectorSuffix(node:SimpleSelectorSuffix, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleClassSelector(node:ClassSelector, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleAttribute(node:Attribute, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePseudo(node:Pseudo, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePseudoFunc(node:PseudoFunc, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleDeclaration(node:Declaration, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleBinaryOperator(node:BinaryOperator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleExpr(node:Expr, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleUnaryOperator(node:UnaryOperator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleTerm(node:Term, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleNumericalLiteral(node:NumericalLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleStringLiteral(node:StringLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleIdentifier(node:Identifier, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleCssUri(node:CssUri, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleCssFunction(node:CssFunction, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleHashColorLiteral(node:HashColorLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleGreaterThanCombinator(node:GreaterThanCombinator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePlusCombinator(node:PlusCombinator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleIDSelector(node:IDSelector, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleAttributeRelation(node:AttributeRelation, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleEqualsRelation(node:EqualsRelation, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleIncludesRelation(node:IncludesRelation, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleBeginsRelation(node:BeginsRelation, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleSlashOperator(node:SlashOperator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleCommaOperator(node:CommaOperator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleUnaryPlusOperator(node:UnaryPlusOperator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleUnaryMinusOperator(node:UnaryMinusOperator, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleFunctionIdentifier(node:FunctionIdentifier, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleStar(node:Star, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleImportant(node:Important, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleEmsLiteral(node:EmsLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleExsLiteral(node:ExsLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleLengthLiteral(node:LengthLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePxLiteral(node:PxLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleCmLiteral(node:CmLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleMmLiteral(node:MmLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleInLiteral(node:InLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePtLiteral(node:PtLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePcLiteral(node:PcLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleAngleLiteral(node:AngleLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleDegLiteral(node:DegLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleRadLiteral(node:RadLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleGradLiteral(node:GradLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleTimeLiteral(node:TimeLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleMsLiteral(node:MsLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleSecLiteral(node:SecLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleFrequencyLiteral(node:FrequencyLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleHzLiteral(node:HzLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handleKhzLiteral(node:KhzLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePlainNumberLiteral(node:PlainNumberLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }

    handlePercentageLiteral(node:PercentageLiteral, param?:IN, currClass?):OUT {
        return this.dispatchAsSuperClass(node, param, currClass)
    }
}

/**
 * convenience class to be used in situations where the same action needs to be invoked on all the nodes
 * alternatively just use a map/forEach... :)
 */
export class SameActionDispatcher<IN, OUT> extends BaseCssDispatcher<IN, OUT> {

    constructor(private action:(node:AstNode) => OUT) {
        super()
    }

    handleAstNode(node:AstNode):OUT {
        return this.action(node)
    }
}
