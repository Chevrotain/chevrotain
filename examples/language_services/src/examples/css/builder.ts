import {ParseTree, SyntaxBoxPT} from "../../pudu/parse_tree"
import * as ast from "./ast"
import * as tok from "./lexer"
import {buildSyntaxBox, MATCH_CHILDREN, MATCH_ONLY_CHILD} from "../../pudu/builder"
import {NIL} from "../../pudu/ast"
import * as pt from "./parser"

export function buildStyleSheet(tree:ParseTree):ast.CssStyleSheet {
    let header = NIL
    let imports = []
    let contents = []
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.CharsetHeaderPT, THEN: (childTree) => header = buildCharsetHeader(childTree)},
        {CASE: pt.CssImportPT, THEN: (childTree) => imports.push(buildImport(childTree))},
        {CASE: pt.ContentsPT, THEN: (childTree) => contents.push(buildContents(childTree))},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let node = new ast.CssStyleSheet(header, imports, contents, NIL, syntaxBox)
    return node
}

export function buildCharsetHeader(tree:ParseTree):ast.CharsetHeader {
    let chartsetName = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.StringLiteral, THEN: (childTree) => chartsetName = buildStringLiteral(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.CharsetHeader(chartsetName, NIL, syntaxBox)
    return astNode
}

export function buildContents(tree:ParseTree):ast.CharsetHeader {
    let astNode

    astNode = MATCH_ONLY_CHILD(tree,
        {CASE: pt.RulesetPT, THEN: buildRuleset},
        {CASE: pt.MediaPT, THEN: buildMedia},
        {CASE: pt.PagePT, THEN: buildPage}
    )

    return astNode
}

export function buildImport(tree:ParseTree):ast.CssImport {
    let target = NIL
    let mediaList = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.CssImportTargetPT, THEN: (childTree) => target = buildCssImportTarget(childTree)},
        {CASE: pt.MediaListPT, THEN: (childTree) => mediaList = buildMediaList(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.CssImport(target, mediaList, NIL, syntaxBox)
    return astNode
}

export function buildCssImportTarget(tree:ParseTree):ast.CssImportTarget {
    let astNode

    astNode = MATCH_ONLY_CHILD(tree,
        {CASE: tok.StringLiteral, THEN: buildStringLiteral},
        {CASE: tok.Uri, THEN: buildUri}
    )

    return astNode
}

export function buildMedia(tree:ParseTree):ast.Media {
    let mediaList = NIL
    let ruleSet = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.MediaListPT, THEN: (childTree) => mediaList = buildMediaList(childTree)},
        {CASE: pt.RulesetPT, THEN: (childTree) => mediaList = buildRuleset(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.Media(mediaList, ruleSet, NIL, syntaxBox)
    return astNode
}

export function buildMediaList(tree:ParseTree):ast.CssMediaList {
    let mediums = []
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Ident, THEN: (childTree) => mediums.push(buildIdentifier(childTree))},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.CssMediaList(mediums, NIL, syntaxBox)
    return astNode
}

export function buildPage(tree:ParseTree):ast.Page {
    let pseudoPage = NIL
    let declarationGroup = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.PseudoPagePT, THEN: (childTree) => pseudoPage = buildPseudoPage(childTree)},
        {CASE: pt.DeclarationsGroupPT, THEN: (childTree) => declarationGroup = buildDeclarationGroup(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.Page(pseudoPage, declarationGroup, NIL, syntaxBox)
    return astNode
}

export function buildDeclarationGroup(tree:ParseTree):ast.DeclarationsGroup {
    let declarations = []
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.DeclarationPT, THEN: (childTree) => declarations.push(buildDeclaration(childTree))},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.DeclarationsGroup(declarations, NIL, syntaxBox)
    return astNode
}

export function buildPseudoPage(tree:ParseTree) {
    let name = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Ident, THEN: (childTree) => name = buildIdentifier(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.PseudoPage(name, NIL, syntaxBox)
    return astNode
}

export function buildCombinator(tree:ParseTree):ast.Combinator {
    let isPlus
    let isGreaterThan
    let syntaxBox = []


    MATCH_CHILDREN(tree,
        {CASE: tok.Plus, THEN: (childTree) => isPlus = true},
        {CASE: tok.GreaterThan, THEN: (childTree) => isGreaterThan = true},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode

    if (isPlus) {
        astNode = new ast.PlusCombinator(NIL, syntaxBox)
    }
    else if (isGreaterThan) {
        astNode = new ast.GreaterThanCombinator(NIL, syntaxBox)
    }
    else {
        throw Error("non exhaustive match")
    }

    return astNode
}

export function buildUnaryOperator(tree:ParseTree):ast.UnaryOperator {
    let isPlus
    let isMinus
    let syntaxBox = []


    MATCH_CHILDREN(tree,
        {CASE: tok.Plus, THEN: (childTree) => isPlus = true},
        {CASE: tok.Minus, THEN: (childTree) => isMinus = true},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode

    if (isPlus) {
        astNode = new ast.UnaryPlusOperator(NIL, syntaxBox)
    }
    else if (isMinus) {
        astNode = new ast.UnaryMinusOperator(NIL, syntaxBox)
    }
    else {
        throw Error("non exhaustive match")
    }

    return astNode
}

export function buildRuleset(tree:ParseTree):ast.RuleSet {
    let selectors = []
    let declarationGroup = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.SelectorPT, THEN: (childTree) => selectors.push(buildSelector(childTree))},
        {CASE: pt.DeclarationsGroupPT, THEN: (childTree) => declarationGroup = buildDeclarationGroup(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.RuleSet(selectors, declarationGroup, NIL, syntaxBox)
    return astNode
}

export function buildSelector(tree:ParseTree):ast.Selector {
    let simpleSelector = NIL
    let combinator = NIL
    let rhsSelector = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.SimpleSelectorPT, THEN: (childTree) => simpleSelector = buildSimpleSelector(childTree)},
        {CASE: pt.CombinatorPT, THEN: (childTree) => combinator = buildCombinator(childTree)},
        {CASE: pt.SelectorPT, THEN: (childTree) => rhsSelector = buildSelector(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.Selector(simpleSelector, combinator, rhsSelector, NIL, syntaxBox)
    return astNode
}

export function buildSimpleSelector(tree:ParseTree):ast.SimpleSelector {
    let elementName = NIL
    let selectorsSuffixes = []
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.ElementNamePT, THEN: (childTree) => elementName = buildElementName(childTree)},
        {CASE: pt.SelectorPT, THEN: (childTree) => selectorsSuffixes.push(buildSimpleSelectorSuffix(childTree))},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.SimpleSelector(elementName, selectorsSuffixes, NIL, syntaxBox)
    return astNode
}

export function buildSimpleSelectorSuffix(tree:ParseTree):ast.SimpleSelectorSuffix {
    let astNode

    astNode = MATCH_ONLY_CHILD(tree,
        {CASE: tok.Hash, THEN: buildIDSelector},
        {CASE: pt.ClassSelectorPT, THEN: buildClassSelector},
        {CASE: pt.AttribPT, THEN: buildAttribute},
        {CASE: pt.PseudoPT, THEN: buildPseudo}
    )

    return astNode
}

export function buildClassSelector(tree:ParseTree):ast.ClassSelector {
    let identifier = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Ident, THEN: (childTree) => identifier = buildSimpleSelector(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.ClassSelector(identifier, NIL, syntaxBox)
    return astNode
}

export function buildElementName(tree:ParseTree):ast.ElementName {
    let astNode

    astNode = MATCH_ONLY_CHILD(tree,
        {CASE: tok.Star, THEN: buildStar},
        {CASE: tok.Ident, THEN: buildIdentifier}
    )

    return astNode
}

export function buildAttribute(tree:ParseTree):ast.Attribute {
    let identifier = NIL
    let relation = NIL
    let value = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Ident, THEN: (childTree) => identifier = buildIdentifier(childTree)},
        {CASE: pt.AttribRelationPT, THEN: (childTree) => relation = buildAttributeRelation(childTree)},
        {CASE: pt.AttribValuePT, THEN: (childTree) => value = buildAttributeValue(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.Attribute(identifier, relation, value, NIL, syntaxBox)
    return astNode
}

export function buildAttributeRelation(tree:ParseTree):ast.AttributeRelation {
    let relationType = ""
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Equals, THEN: (childTree) => relationType = "equals"},
        {CASE: tok.Includes, THEN: (childTree) => relationType = "includes"},
        {CASE: tok.Dasmatch, THEN: (childTree) => relationType = "dasmatch"},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    switch (relationType) {
        case "equals" :
            return new ast.EqualsRelation(NIL, syntaxBox)
        case "includes" :
            return new ast.IncludesRelation(NIL, syntaxBox)
        case "dasmatch" :
            return new ast.BeginsRelation(NIL, syntaxBox)
        default:
            throw Error("non exhaustive match")
    }
}

export function buildAttributeValue(tree:ParseTree):ast.AttributeValue {
    let astNode

    astNode = MATCH_ONLY_CHILD(tree,
        {CASE: tok.StringLiteral, THEN: buildStringLiteral},
        {CASE: tok.Ident, THEN: buildIdentifier}
    )

    return astNode
}

export function buildPseudo(tree:ParseTree):ast.Pseudo {
    let pseudoClassName = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.PseudoClassNamePT, THEN: (childTree) => pseudoClassName = buildPseudoClassName(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.Pseudo(pseudoClassName, NIL, syntaxBox)
    return astNode
}

export function buildPseudoClassName(tree:ParseTree):ast.PseudoClassName {
    let astNode

    astNode = MATCH_ONLY_CHILD(tree,
        {CASE: tok.Ident, THEN: buildIdentifier},
        {CASE: pt.PseudoFuncPT, THEN: buildPseudoFunc}
    )

    return astNode
}

export function buildPseudoFunc(tree:ParseTree):ast.PseudoFunc {
    let funcName = NIL
    let argument = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Func, THEN: (childTree) => funcName = buildFunctionIdentifier(childTree)},
        {CASE: tok.Ident, THEN: (childTree) => argument = buildIdentifier(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.PseudoFunc(funcName, argument, NIL, syntaxBox)
    return astNode
}

export function buildDeclaration(tree:ParseTree):ast.Declaration {
    let propName = NIL
    let propValue = NIL
    let important = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Ident, THEN: (childTree) => propName = buildIdentifier(childTree)},
        {CASE: pt.ExprPT, THEN: (childTree) => propValue = buildExpression(childTree)},
        {CASE: tok.ImportantSym, THEN: (childTree) => important = buildImportant(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.Declaration(propName, propValue, important, NIL, syntaxBox)
    return astNode
}

export function buildExpression(tree:ParseTree):ast.Expr {
    let terms = []
    let operators = []
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.TermPT, THEN: (childTree) => terms.push(buildTerm(childTree))},
        {CASE: pt.BinaryOperatorPT, THEN: (childTree) => operators.push(buildOperator(childTree))},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.Expr(terms, operators, NIL, syntaxBox)
    return astNode
}

export function buildTerm(tree:ParseTree):ast.Term {
    let unaryOp = NIL
    let value = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: pt.UnaryOperatorPT, THEN: (childTree) => unaryOp = buildUnaryOperator(childTree)},
        {CASE: pt.ValuePT, THEN: (childTree) => value = buildValue(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.Term(value, unaryOp, NIL, syntaxBox)
    return astNode
}

export function buildValue(tree:ParseTree):ast.Value {
    let astNode

    astNode = MATCH_ONLY_CHILD(tree,
        {CASE: tok.Num, THEN: buildPlainNum},
        {CASE: tok.Percentage, THEN: buildPercentage},
        {CASE: tok.Length, THEN: buildLength},
        {CASE: tok.Ems, THEN: buildEms},
        {CASE: tok.Exs, THEN: buildExs},
        {CASE: tok.Angle, THEN: buildAngle},
        {CASE: tok.Time, THEN: buildTime},
        {CASE: tok.Freq, THEN: buildFreq},
        {CASE: tok.StringLiteral, THEN: buildStringLiteral},
        {CASE: tok.Ident, THEN: buildIdentifier},
        {CASE: tok.Uri, THEN: buildUri},
        {CASE: tok.Hash, THEN: buildHashColorLiteral},
        {CASE: pt.CssFunctionPT, THEN: buildCssFunction}
    )

    return astNode
}

export function buildCssFunction(tree:ParseTree):ast.CssFunction {
    let funcName = NIL
    let argument = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Func, THEN: (childTree) => funcName = buildFunctionIdentifier(childTree)},
        {CASE: pt.ExprPT, THEN: (childTree) => argument = buildExpression(childTree)},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new ast.CssFunction(funcName, argument, NIL, syntaxBox)
    return astNode
}

export function buildPlainNum(tree:ParseTree):ast.PlainNumberLiteral {
    let token = tree.payload
    let value = token.image
    let syntaxBox = [token]
    let astNode = new ast.PlainNumberLiteral(value, NIL, syntaxBox)
    return astNode
}

export function buildPercentage(tree:ParseTree):ast.PercentageLiteral {
    let token = tree.payload
    let value = token.image.substring(0, token.image.length - 1)
    let syntaxBox = [token]
    let astNode = new ast.PercentageLiteral(value, NIL, syntaxBox)
    return astNode
}

export function buildLength(tree:ParseTree):ast.LengthLiteral {
    let token = tree.payload
    let value = token.image.substring(0, token.image.length - 2)
    let syntaxBox = [token]

    let astNodeConstructor

    if (token instanceof tok.Px) {
        astNodeConstructor = ast.PxLiteral
    }
    else if (token instanceof tok.Cm) {
        astNodeConstructor = ast.CmLiteral
    }
    else if (token instanceof tok.Mm) {
        astNodeConstructor = ast.MmLiteral
    }
    else if (token instanceof tok.In) {
        astNodeConstructor = ast.InLiteral
    }
    else if (token instanceof tok.Pt) {
        astNodeConstructor = ast.PtLiteral
    }
    else if (token instanceof tok.Pc) {
        astNodeConstructor = ast.PcLiteral
    }
    else {
        throw Error("non exhaustive match")
    }

    let astNode = new astNodeConstructor(value, NIL, syntaxBox)
    return astNode
}

export function buildEms(tree:ParseTree):ast.EmsLiteral {
    let token = tree.payload
    let value = token.image.substring(0, token.image.length - 2)
    let syntaxBox = [token]
    let astNode = new ast.EmsLiteral(value, NIL, syntaxBox)
    return astNode
}

export function buildExs(tree:ParseTree):ast.ExsLiteral {
    let token = tree.payload
    let value = token.image.substring(0, token.image.length - 2)
    let syntaxBox = [token]
    let astNode = new ast.ExsLiteral(value, NIL, syntaxBox)
    return astNode
}

export function buildAngle(tree:ParseTree):ast.AngleLiteral {
    let token = tree.payload
    let suffixLength
    let syntaxBox = [token]

    let astNodeConstructor

    if (token instanceof tok.Deg) {
        astNodeConstructor = ast.DegLiteral
        suffixLength = 3
    }
    else if (token instanceof tok.Rad) {
        astNodeConstructor = ast.RadLiteral
        suffixLength = 3
    }
    else if (token instanceof tok.Grad) {
        astNodeConstructor = ast.GradLiteral
        suffixLength = 2
    }
    else {
        throw Error("non exhaustive match")
    }

    let value = token.image.substring(0, token.image.length - suffixLength)
    let astNode = new astNodeConstructor(value, NIL, syntaxBox)
    return astNode
}

export function buildTime(tree:ParseTree):ast.TimeLiteral {
    let token = tree.payload
    let suffixLength
    let syntaxBox = [token]

    let astNodeConstructor

    if (token instanceof tok.Ms) {
        astNodeConstructor = ast.MsLiteral
        suffixLength = 2
    }
    else if (token instanceof tok.Sec) {
        astNodeConstructor = ast.SecLiteral
        suffixLength = 3
    }
    else {
        throw Error("non exhaustive match")
    }

    let value = token.image.substring(0, token.image.length - suffixLength)
    let astNode = new astNodeConstructor(value, NIL, syntaxBox)
    return astNode
}

export function buildFreq(tree:ParseTree):ast.FrequencyLiteral {
    let token = tree.payload
    let suffixLength
    let syntaxBox = [token]

    let astNodeConstructor

    if (token instanceof tok.Hz) {
        astNodeConstructor = ast.HzLiteral
        suffixLength = 2
    }
    else if (token instanceof tok.Khz) {
        astNodeConstructor = ast.KhzLiteral
        suffixLength = 3
    }
    else {
        throw Error("non exhaustive match")
    }

    let value = token.image.substring(0, token.image.length - suffixLength)
    let astNode = new astNodeConstructor(value, NIL, syntaxBox)
    return astNode
}

export function buildHashColorLiteral(tree:ParseTree):ast.HashColorLiteral {
    let token = tree.payload
    let value = token.image.substring(1, token.image.length)
    let syntaxBox = [token]
    let astNode = new ast.HashColorLiteral(value, NIL, syntaxBox)
    return astNode
}

export function buildOperator(tree:ParseTree):ast.BinaryOperator {
    let opConstructor = NIL
    let syntaxBox = []

    MATCH_CHILDREN(tree,
        {CASE: tok.Slash, THEN: (childTree) => opConstructor = ast.SlashOperator},
        {CASE: tok.Comma, THEN: (childTree) => opConstructor = ast.CommaOperator},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode = new opConstructor(NIL, syntaxBox)
    return astNode
}

export function buildImportant(tree:ParseTree):ast.Important {
    let syntaxBox = [tree.payload]
    let astNode = new ast.Important(NIL, syntaxBox)
    return astNode
}

export function buildFunctionIdentifier(tree:ParseTree):ast.FunctionIdentifier {
    let token = tree.payload
    let name = token.image.substring(0, token.image.length - 1)
    let syntaxBox = [token]
    let astNode = new ast.FunctionIdentifier(name, NIL, syntaxBox)
    return astNode
}

export function buildIDSelector(tree:ParseTree):ast.IDSelector {
    let token = tree.payload
    let name = token.image.substring(1, token.image.length)
    let syntaxBox = [token]
    let astNode = new ast.IDSelector(name, NIL, syntaxBox)
    return astNode
}

export function buildIdentifier(tree:ParseTree):ast.Identifier {
    let token = tree.payload
    let name = token.image
    let syntaxBox = [token]
    let astNode = new ast.Identifier(name, NIL, syntaxBox)
    return astNode
}

export function buildStar(tree:ParseTree):ast.Star {
    let syntaxBox = [tree.payload]
    let astNode = new ast.Star(NIL, syntaxBox)
    return astNode
}

export function buildUri(tree:ParseTree):ast.CssUri {
    let token = tree.payload
    // TODO: need to implement smart chopping of the URI's value
    // it can be a string literal (with either single or double quotes)
    // and it can also be a real url.
    // Note that it can include whitespace on both "ends" that will require chopping off
    let value = token.image
    let syntaxBox = [token]
    let astNode = new ast.CssUri(value, NIL, syntaxBox)
    return astNode
}

export function buildStringLiteral(tree:ParseTree):ast.StringLiteral {
    let token = tree.payload
    let value = token.image.substring(1, token.image.length - 1)
    let syntaxBox = [token]
    let astNode = new ast.StringLiteral(value, NIL, syntaxBox)
    return astNode
}

