import {ILexingError, exceptions} from "chevrotain"
import {CssStyleSheet} from "./ast"
import {CssParser} from "./parser"
import {CssLexer} from "./lexer"
import {buildStyleSheet} from "./builder"
import {AstNode} from "../../pudu/ast"
import {ISemanticIssue, performSemanticChecks, ISemanticCheckConfig} from "../../pudu/semantics"
import {DEFAULT_SEMANTIC_CHECKS_CONFIG} from "../css/semantics"

// TODO: is this part of PUDU API?
export interface ITextAnalysisResult {
    lexErrors:ILexingError[],
    parseErrors:exceptions.IRecognitionException[],
    ast:CssStyleSheet
}

// "There can be only one"
let parser = new CssParser([])

export function analyzeText(text:string):ITextAnalysisResult {
    let lexResult = CssLexer.tokenize(text)
    parser.input = lexResult.tokens
    let parseTree = parser.stylesheet()

    let ast = undefined
    // TODO: until error recovery support the returned ast may be undefined
    if (parseTree !== undefined) {
        ast = buildStyleSheet(parseTree)
    }

    return {
        lexErrors: lexResult.errors,
        parseErrors: parser.errors,
        ast: ast
    }
}

// TODO: define return type
export function performCssSemanticChecks(node:AstNode,
                                         config:ISemanticCheckConfig = DEFAULT_SEMANTIC_CHECKS_CONFIG):ISemanticIssue[] {
    let nodeAndDecendants = [node].concat(node.descendants())
    return performSemanticChecks(nodeAndDecendants, config)
}

// TODO: define return type
export function getOutline(styleSheet:CssStyleSheet) {

}
