import {ISimpleTokenOrIToken} from "../../scan/tokens_public"

export type CstElement = ISimpleTokenOrIToken | CstNode
export type CstChildrenDictionary = { [identifier:string]:CstElement | CstElement[] }

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
}
