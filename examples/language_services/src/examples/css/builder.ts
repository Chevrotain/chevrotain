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

export function buildBinaryOperator(tree:ParseTree):ast.BinaryOperator {
    let isSlash
    let isComma
    let syntaxBox = []


    MATCH_CHILDREN(tree,
        {CASE: tok.Slash, THEN: (childTree) => isSlash = true},
        {CASE: tok.Comma, THEN: (childTree) => isComma = true},
        {CASE: SyntaxBoxPT, THEN: (childTree) => syntaxBox = buildSyntaxBox(childTree)}
    )

    let astNode

    if (isSlash) {
        astNode = new ast.SlashOperator(NIL, syntaxBox)
    }
    else if (isComma) {
        astNode = new ast.CommaOperator(NIL, syntaxBox)
    }
    else {
        throw Error("non exhaustive match")
    }

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
        {CASE: tok.GreaterThan, THEN: (childTree) => isMinus = true},
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
        {CASE: tok.Ident, THEN: (childTree) => declarationGroup = buildDeclarationGroup(childTree)},
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


// ------ temp



export function buildSimpleSelectorSuffix(tree:ParseTree):ast.SimpleSelectorSuffix {
    return null
}

export function buildElementName(tree:ParseTree):ast.ElementName {
    return null
}

export function buildDeclaration(tree:ParseTree) {

}

export function buildIdentifier(tree:ParseTree) {

}
export function buildUri(tree:ParseTree) {

}

export function buildStringLiteral(tree:ParseTree):ast.CssImport {
    return null
}





