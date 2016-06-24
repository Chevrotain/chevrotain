import {ObjectNode} from "./ast"
import {JsonLexer} from "./lexer"
import {JsonParser} from "./parser"
import {buildObjectNode} from "./builder"
import {
    ILexingError,
    exceptions
} from "chevrotain"

export interface ITextAnalysisResult {
    lexErrors:ILexingError[],
    parseErrors:exceptions.IRecognitionException[],
    ast:ObjectNode
}

export function analyzeText(text:string):ITextAnalysisResult {
    let lexResult = JsonLexer.tokenize(text)
    let parser = new JsonParser(lexResult.tokens)
    let parseTree = parser.object()
    let ast = buildObjectNode(parseTree)

    return {
        lexErrors: lexResult.errors,
        parseErrors: parser.errors,
        ast: ast
    }
}

// TODO: should there be an API that also includes running the semantic checks?
// if so what is the default configuration ?
