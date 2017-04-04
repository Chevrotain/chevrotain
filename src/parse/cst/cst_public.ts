import {IToken} from "../../scan/tokens_public"

export type CstElement = IToken | CstNode
export type CstChildrenDictionary = { [identifier:string]:CstElement[] }

/**
 * A Concrete Syntax Tree Node.
 * This structure represents the whole parse tree of the grammar
 * This means that information on each and every Token is present.
 * This is unlike an AST (Abstract Syntax Tree) where some of the syntactic information is missing.
 *
 * For example given an ECMAScript grammar, an AST would normally not contain information on the location
 * of Commas, Semi colons, redundant parenthesis ect, however a CST would have that information.
 */
export interface CstNode {
    readonly name:string

    readonly children:CstChildrenDictionary

    readonly recoveredNode?:boolean

    /**
     * Only for "in-lined" rules, the name of the top level rule containing this nested rule
     */
    readonly fullName?:string
}

// TODO: use default generics arguments in typescript 2.3
export interface ICstVisitor<IN, OUT> {
    // If an array is passed as the first argument it is equivalent to passing the first item of the array.
    visit(cstNode:CstNode | CstNode[], param?:IN):OUT
    validateVisitor():void
}

export interface CstVisitorConstructor extends Function {
    new<IN, OUT>(...args:any[]):ICstVisitor<IN, OUT>
}
