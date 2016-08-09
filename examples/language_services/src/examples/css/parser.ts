import {Parser} from "chevrotain"
import {
    cssTokens,
    CharsetSym,
    SemiColon,
    ImportSym,
    Uri,
    MediaSym,
    Ident,
    PageSym,
    Minus,
    Plus,
    Hash,
    Star,
    Equals,
    Includes,
    Dasmatch,
    RSquare,
    Func,
    RParen,
    ImportantSym,
    Num,
    Percentage,
    Length,
    Ems,
    Exs,
    Angle,
    Time,
    Freq,
    Slash,
    GreaterThan,
    StringLiteral,
    LCurly,
    RCurly,
    Comma,
    Colon,
    LSquare,
    Dot
} from "./lexer"
import {
    ParseTreeToken,
    CHILDREN,
    PT, SYNTAX_BOX
} from "../../pudu/parse_tree"

export class StylesheetPT extends ParseTreeToken {}
export class CharsetHeaderPT extends ParseTreeToken {}
export class CssImportPT extends ParseTreeToken {}
export class CssImportTargetPT extends ParseTreeToken {}
export class MediaPT extends ParseTreeToken {}
export class MediaListPT extends ParseTreeToken {}
export class PagePT extends ParseTreeToken {}
export class DeclarationsGroupPT extends ParseTreeToken {}
export class PseudoPagePT extends ParseTreeToken {}
export class RulesetPT extends ParseTreeToken {}
export class SelectorPT extends ParseTreeToken {}
export class SimpleSelectorPT extends ParseTreeToken {}
export class ClassSelectorPT extends ParseTreeToken {}
export class SimpleSelectorSuffixPT extends ParseTreeToken {}
export class ElementNamePT extends ParseTreeToken {}
export class AttribPT extends ParseTreeToken {}
export class AttribRelationPT extends ParseTreeToken {}
export class AttribValuePT extends ParseTreeToken {}
export class PseudoClassNamePT extends ParseTreeToken {}
export class PseudoFuncPT extends ParseTreeToken {}
export class DeclarationPT extends ParseTreeToken {}
export class ExprPT extends ParseTreeToken {}
export class TermPT extends ParseTreeToken {}
export class CssFunctionPT extends ParseTreeToken {}
export class ValuePT extends ParseTreeToken {}
export class PseudoPT extends ParseTreeToken {}

export class ContentsPT extends ParseTreeToken {}
export class BinaryOperatorPT extends ParseTreeToken {}
export class CombinatorPT extends ParseTreeToken {}
export class UnaryOperatorPT extends ParseTreeToken {}


export class CssParser extends Parser {

    constructor(input) {
        super(input, cssTokens, {maxLookahead: 2})
        Parser.performSelfAnalysis(this)
    }

    stylesheet = this.RULE("stylesheet", () => {
        let header = undefined, imports = [], contents = []

        // [ CHARSET_SYM STRING "" ]?
        this.OPTION(() => {
            header =
                this.SUBRULE(this.charsetHeader)
        })

        // [ import [ CDO S* | CDC S* ]* ]*
        this.MANY(() => {
            imports.push(
                this.SUBRULE(this.cssImport))
        })

        // [ [ ruleset | media | page ] [ CDO S* | CDC S* ]* ]*
        this.MANY2(() => {
            contents.push(
                this.SUBRULE(this.contents))
        })

        return PT(StylesheetPT,
            CHILDREN(header, imports, contents))
    })

    charsetHeader = this.RULE("charsetHeader", () => {
        let charsetSymTok, charsetTok, semicolonTok

        charsetSymTok =
            this.CONSUME(CharsetSym)
        charsetTok =
            this.CONSUME(StringLiteral)
        semicolonTok =
            this.CONSUME(SemiColon)

        return PT(CharsetHeaderPT,
            CHILDREN(charsetTok,
                SYNTAX_BOX(charsetSymTok, semicolonTok)))
    })

    contents = this.RULE("contents", () => {
        let contents

        contents =
            this.OR([
                {ALT: () => this.SUBRULE(this.ruleset)},
                {ALT: () => this.SUBRULE(this.media)},
                {ALT: () => this.SUBRULE(this.page)}
            ])

        return PT(ContentsPT,
            CHILDREN(contents))
    })

    // IMPORT_SYM S*
    // [STRING|URI] S* media_list? "" S*
    cssImport = this.RULE("cssImport", () => {
        let importSymTok, target, mediaList = undefined, semicolonTok

        importSymTok =
            this.CONSUME(ImportSym)

        target =
            this.SUBRULE(this.cssImportTarget)

        this.OPTION(() => {
            mediaList =
                this.SUBRULE(this.media_list)
        })

        semicolonTok =
            this.CONSUME(SemiColon)

        return PT(CssImportPT,
            CHILDREN(target, mediaList,
                SYNTAX_BOX(importSymTok, semicolonTok)))
    })

    cssImportTarget = this.RULE("cssImportTarget", () => {
        let targetTok

        targetTok =
            this.OR([
                {ALT: () => this.CONSUME(StringLiteral)},
                {ALT: () => this.CONSUME(Uri)}
            ])

        return PT(CssImportTargetPT,
            CHILDREN(targetTok))
    })

    // MEDIA_SYM S* media_list "{" S* ruleset* "}" S*
    media = this.RULE("media", () => {
        let mediaSymTok, mediaList, lCurlyTok, ruleSet, rCurlyTok

        mediaSymTok =
            this.CONSUME(MediaSym)
        mediaList =
            this.SUBRULE(this.media_list)
        lCurlyTok =
            this.CONSUME(LCurly)
        ruleSet =
            this.SUBRULE(this.ruleset)
        rCurlyTok =
            this.CONSUME(RCurly)

        return PT(MediaPT,
            CHILDREN(mediaList, ruleSet,
                SYNTAX_BOX(mediaSymTok, lCurlyTok, rCurlyTok)))
    })

    // medium [ COMMA S* IDENT S]*
    media_list = this.RULE("media_list", () => {
        let commaToks, indents = []

        indents.push(
            this.CONSUME(Ident))

        commaToks =
            this.MANY_SEP(Comma, () => {
                indents.push(
                    this.CONSUME2(Ident))
            })

        return PT(MediaListPT,
            CHILDREN(indents,
                SYNTAX_BOX(commaToks)))
    })

    // PAGE_SYM S* pseudo_page?
    // "{" S* declaration? [ ";" S* declaration? ]* "}" S*
    page = this.RULE("page", () => {
        let pageSymTok, pseudoPage = undefined, declarationGroup

        pageSymTok =
            this.CONSUME(PageSym)

        this.OPTION(() => {
            pseudoPage =
                this.SUBRULE(this.pseudo_page)
        })

        declarationGroup =
            this.SUBRULE(this.declarationsGroup)

        return PT(PagePT,
            CHILDREN(pseudoPage, declarationGroup,
                SYNTAX_BOX(pageSymTok)))
    })

    // "{" S* declaration? [ ";" S* declaration? ]* "}" S*
    // factored out repeating grammar pattern
    declarationsGroup = this.RULE("declarationsGroup", () => {
        let lCurlyTok, rCurlyTok, semicolonToks = [], declarations = []

        lCurlyTok =
            this.CONSUME(LCurly)

        this.OPTION(() => {
            declarations.push(
                this.SUBRULE(this.declaration))
        })

        this.MANY(() => {
            semicolonToks.push(
                this.CONSUME(SemiColon))

            this.OPTION2(() => {
                declarations.push(
                    this.SUBRULE2(this.declaration))
            })
        })
        rCurlyTok =
            this.CONSUME(RCurly)

        return PT(DeclarationsGroupPT,
            CHILDREN(declarations,
                SYNTAX_BOX(lCurlyTok, semicolonToks, rCurlyTok)))
    })

    // ":" IDENT S*
    pseudo_page = this.RULE("pseudo_page", () => {
        let colonTok, ident

        colonTok =
            this.CONSUME(Colon)
        ident =
            this.CONSUME(Ident)

        return PT(PseudoPagePT,
            CHILDREN(ident,
                SYNTAX_BOX(colonTok)))
    })

    // "/" S* | "," S*
    binaryOperator = this.RULE("binaryOperator", () => {
        let opTok

        opTok = this.OR([
            {ALT: () => this.CONSUME(Slash)},
            {ALT: () => this.CONSUME(Comma)}
        ])

        return PT(BinaryOperatorPT,
            CHILDREN(opTok,
                SYNTAX_BOX(opTok)))
    })

    // "+" S* | ">" S*
    combinator = this.RULE("combinator", () => {
        let opTok

        opTok = this.OR([
            {ALT: () => this.CONSUME(Plus)},
            {ALT: () => this.CONSUME(GreaterThan)}
        ])

        return PT(CombinatorPT,
            CHILDREN(opTok,
                SYNTAX_BOX(opTok)))
    })

    // "-" | "+"
    unary_operator = this.RULE("unary_operator", () => {
        let opTok

        opTok = this.OR([
            {ALT: () => this.CONSUME(Minus)},
            {ALT: () => this.CONSUME(Plus)}
        ])

        return PT(UnaryOperatorPT,
            CHILDREN(opTok,
                SYNTAX_BOX(opTok)))
    })

    // selector [ "," S* selector ]*
    // "{" S* declaration? [ "" S* declaration? ]* "}" S*
    ruleset = this.RULE("ruleset", () => {
        let declarationGroup, commaToks, selectors = []

        commaToks =
            this.MANY_SEP(Comma, () => {
                selectors.push(
                    this.SUBRULE(this.selector))
            })

        declarationGroup =
            this.SUBRULE(this.declarationsGroup)

        return PT(RulesetPT,
            CHILDREN(selectors, declarationGroup,
                SYNTAX_BOX(commaToks)))
    })

    // simple_selector [ combinator selector | S+ [ combinator? selector ]? ]?
    // TODO: consider factoring out to a loop instead of right recursion?
    // TODO: looks like whitespace as combinator is in this grammar rule
    // is it possible to figure out the existence of the whitespace combinator
    // during ast building?
    selector = this.RULE("selector", () => {
        let simpleSelector, combinator = undefined, selector = undefined

        simpleSelector =
            this.SUBRULE(this.simple_selector)

        this.OPTION(() => {
            this.OPTION2(() => {
                combinator =
                    this.SUBRULE(this.combinator)
            })
            selector =
                this.SUBRULE(this.selector)
        })

        return PT(SelectorPT,
            CHILDREN(simpleSelector, combinator, selector))
    })

    // element_name [ HASH | classSelector | attrib | pseudo ]*
    // | [ HASH | class | attrib | pseudo ]+
    simple_selector = this.RULE("simple_selector", () => {
        let elementName = undefined, selectorSuffixes = []

        // @formatter:off
        this.OR([
            {
                ALT: () => {
                    elementName =
                        this.SUBRULE(this.element_name)

                    this.MANY(() => {
                        selectorSuffixes.push(
                            this.SUBRULE(this.simple_selector_suffix))
                    })

                }
            },
            {
                ALT: () => {
                    this.AT_LEAST_ONE(() => {
                        selectorSuffixes.push(
                            this.SUBRULE2(this.simple_selector_suffix))
                    }, "selector suffix")
                }
            }
        ])
        // @formatter:on

        return PT(SimpleSelectorPT,
            CHILDREN(elementName, selectorSuffixes))
    })

    // helper grammar rule to avoid repetition
    // [ HASH | classSelector | attrib | pseudo ]+
    simple_selector_suffix = this.RULE("simple_selector_suffix", () => {
        let selectorSuffix

        selectorSuffix = this.OR<any>([
            {ALT: () => this.CONSUME(Hash)},
            {ALT: () => this.SUBRULE(this.classSelector)},
            {ALT: () => this.SUBRULE(this.attrib)},
            {ALT: () => this.SUBRULE(this.pseudo)}
        ])

        return PT(SimpleSelectorSuffixPT,
            CHILDREN(selectorSuffix))
    })

    // "." IDENT
    classSelector = this.RULE("classSelector", function () {
        let dotTok, identTok

        dotTok =
            this.CONSUME(Dot)
        identTok =
            this.CONSUME(Ident)

        return PT(ClassSelectorPT,
            CHILDREN(identTok,
                SYNTAX_BOX(dotTok)))
    })

    // IDENT | "*"
    element_name = this.RULE("element_name", function () {
        let elementNameTok

        elementNameTok = this.OR([
            {ALT: () => this.CONSUME(Ident)},
            {ALT: () => this.CONSUME(Star)}
        ])

        return PT(ElementNamePT,
            CHILDREN(elementNameTok))
    })

    // "[" S* IDENT S* [ [ "=" | INCLUDES | DASHMATCH ] S* [ IDENT | STRING ] S* ]? "]"
    attrib = this.RULE("attrib", function () {
        let lSquareTok, identTok, relation = undefined, value = undefined, rSquareTok

        lSquareTok =
            this.CONSUME(LSquare)
        identTok =
            this.CONSUME(Ident)

        this.OPTION(() => {
            relation =
                this.SUBRULE(this.attrib_relation)

            value =
                this.SUBRULE(this.attrib_value)
        })
        rSquareTok =
            this.CONSUME(RSquare)

        return PT(AttribPT,
            CHILDREN(identTok, relation, value,
                SYNTAX_BOX(lSquareTok, rSquareTok)))
    })

    attrib_relation = this.RULE("attrib_relation", function () {
        let operatorTok

        operatorTok =
            this.OR([
                {ALT: () => this.CONSUME(Equals)},
                {ALT: () => this.CONSUME(Includes)},
                {ALT: () => this.CONSUME(Dasmatch)}
            ])

        return PT(AttribRelationPT,
            CHILDREN(operatorTok,
                SYNTAX_BOX(operatorTok)))
    })

    attrib_value = this.RULE("attrib_value", function () {
        let valueTok

        valueTok =
            this.OR([
                {ALT: () => this.CONSUME(Ident)},
                {ALT: () => this.CONSUME(StringLiteral)}
            ])

        return PT(AttribValuePT,
            CHILDREN(valueTok))
    })

    // ":" [ IDENT | FUNCTION S* [IDENT S*]? ")" ]
    pseudo = this.RULE("pseudo", function () {
        let colonTok, pseudoClassName

        colonTok =
            this.CONSUME(Colon)

        pseudoClassName = this.SUBRULE(this.pseudoClassName)

        return PT(PseudoPT,
            CHILDREN(pseudoClassName,
                SYNTAX_BOX(colonTok)))
    })

    pseudoClassName = this.RULE("pseudoClassName", function () {
        let className

        className =
            this.OR([
                {ALT: () => this.CONSUME(Ident)},
                {ALT: () => this.SUBRULE(this.pseudoFunc)}
            ])

        return PT(PseudoClassNamePT,
            CHILDREN(className))
    })

    pseudoFunc = this.RULE("pseudoFunc", function () {
        let funcNameTok, argumentTok = undefined, rParenTok

        funcNameTok =
            this.CONSUME(Func)

        this.OPTION(() => {
            argumentTok =
                this.CONSUME(Ident)
        })
        rParenTok =
            this.CONSUME(RParen)

        return PT(PseudoFuncPT,
            CHILDREN(funcNameTok, argumentTok,
                SYNTAX_BOX(rParenTok)))
    })

    // IDENT S* ":" S* expr [IMPORTANT_SYM S*]?
    declaration = this.RULE("declaration", () => {
        let identTok, colonTok, exp, importantSymTok = undefined

        identTok =
            this.CONSUME(Ident)
        colonTok =
            this.CONSUME(Colon)
        exp =
            this.SUBRULE(this.expr)

        this.OPTION(() => {
            importantSymTok =
                this.CONSUME(ImportantSym)
        })

        return PT(DeclarationPT,
            CHILDREN(identTok, exp, importantSymTok,
                SYNTAX_BOX(colonTok)))
    })

    // term [ binaryOperator? term ]*
    expr = this.RULE("expr", () => {
        let terms = [], operators = []

        terms.push(
            this.SUBRULE(this.term))

        this.MANY(() => {
            // TODO: if none present does this mean whitespace operator is added?
            this.OPTION(() => {
                operators.push(
                    this.SUBRULE(this.binaryOperator))
            })
            terms.push(this.SUBRULE2(this.term))
        })

        return PT(ExprPT,
            CHILDREN(terms, operators))
    })

    // unary_operator?
    // [ NUMBER S* | PERCENTAGE S* | LENGTH S* | EMS S* | EXS S* | ANGLE S* |
    // TIME S* | FREQ S* ]
    // | STRING S* | IDENT S* | URI S* | hexcolor | function
    term = this.RULE("term", () => {
        let unaryOp = undefined, value

        this.OPTION(() => {
            unaryOp =
                this.SUBRULE(this.unary_operator)
        })

        value =
            this.SUBRULE(this.value)

        return PT(TermPT,
            CHILDREN(unaryOp, value))
    })

    value = this.RULE("value", () => {
        let val

        val =
            this.OR<any>([
                {ALT: () => this.CONSUME(Num)},
                {ALT: () => this.CONSUME(Percentage)},
                {ALT: () => this.CONSUME(Length)},
                {ALT: () => this.CONSUME(Ems)},
                {ALT: () => this.CONSUME(Exs)},
                {ALT: () => this.CONSUME(Angle)},
                {ALT: () => this.CONSUME(Time)},
                {ALT: () => this.CONSUME(Freq)},
                {ALT: () => this.CONSUME(StringLiteral)},
                {ALT: () => this.CONSUME(Ident)},
                {ALT: () => this.CONSUME(Uri)},
                {ALT: () => this.CONSUME(Hash)},
                {ALT: () => this.SUBRULE(this.cssFunction)}
            ])

        return PT(ValuePT,
            CHILDREN(val))
    })

    // FUNCTION S* expr ")" S*
    cssFunction = this.RULE("cssFunction", () => {
        let funcTok, arg, rParenTok

        // TODO: split up the rParen and the Ident in the func?
        funcTok =
            this.CONSUME(Func)
        arg =
            this.SUBRULE(this.expr)
        rParenTok =
            this.CONSUME(RParen)

        return PT(CssFunctionPT,
            CHILDREN(funcTok, arg,
                SYNTAX_BOX(rParenTok)))
    })

}
