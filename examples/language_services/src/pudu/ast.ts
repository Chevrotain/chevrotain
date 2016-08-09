/* tslint:disable:no-use-before-declare */

import * as _ from "lodash"
import {Token} from "chevrotain"
import {IAstPatternDispatcher} from "./dispatcher"

export interface ITextPosition {
    startOffset:number
    startLine:number
    startColumn:number
    endOffset:number
    endLine:number
    endColumn:number
}

export const NO_POSITION:ITextPosition = {
    startOffset:-1,
    startLine:  -1,
    startColumn:-1,
    endOffset:  -1,
    endLine:    -1,
    endColumn:  -1
}

// all your state is belong to us.
Object.freeze(NO_POSITION)

export abstract class AstNode {

    constructor(protected _parent:AstNode = NIL,
                protected _syntaxBox:Token[] = []) {}

    parent():AstNode {
        return this._parent
    }

    ancestors():AstNode[] {
        let ancestors = []
        let currAncestor = this._parent
        while (currAncestor !== NIL) {
            ancestors.push(currAncestor)
        }
        return ancestors
    }

    descendants():AstNode[] {
        let directChildren = this.children()
        let descendantsArrs = _.map(directChildren, (currChild:AstNode) => {
            return currChild.descendants()
        })
        return <any>directChildren.concat(_.flatten(descendantsArrs))
    }

    children():AstNode[] {

        let isDirectChild = (prop) => {
            return prop instanceof AstNode && !(prop instanceof Nil) &&
                prop.parent() === this
        }

        let allKids = _.reduce(<any>this, (result, prop) => {
            if (isDirectChild(prop)) {
                result.push(prop)
            }
            else if (_.isArray(prop)) {
                _.forEach(prop, (currElem) => {
                    if (isDirectChild(currElem)) {
                        result.push(currElem)
                    }
                })
            }
            return result
        }, [])

        return allKids
    }

    /**
     * Visitor implementation.
     * will invoke the provided dispatcher for each descendant in the AST
     * @param dispatcher
     * @returns {T[]}
     */
    visit<T>(dispatcher:IAstPatternDispatcher<void, T>):T[] {
        let myselfAndDescendants = [<any>this].concat(this.descendants())
        return _.map(myselfAndDescendants, (currNode) => {
            return dispatcher.dispatch(currNode)
        })
    }

    position():ITextPosition {
        let meAndDescendantsNodes = this.descendants().concat([this])
        let allTokens = _.flatten(_.map(meAndDescendantsNodes, (currChild) => currChild.syntaxBox))
        let allActualTokens = _.reject(allTokens, (currToken) => currToken.isInsertedInRecovery)

        if (_.isEmpty(allActualTokens)) {
            return NO_POSITION
        }

        let firstToken = _.first(allActualTokens)
        let lastToken = _.first(allActualTokens)

        // this assumes that tokens never overlap
        _.forEach(allActualTokens, (currToken:Token) => {
            if (currToken.offset < firstToken.offset) {
                firstToken = currToken
            }
            else if (currToken.offset > lastToken.offset) {
                lastToken = currToken
            }
        })

        return {
            startOffset:firstToken.offset,
            startLine:  firstToken.startLine,
            startColumn:firstToken.startColumn,
            endOffset:  lastToken.offset + lastToken.image.length,
            endLine:    lastToken.endLine,
            endColumn:  lastToken.endColumn
        }
    }

    get syntaxBox():Token[] {
        // TODO: this is mutable, perhaps freeze it in the constructor?
        return this._syntaxBox
    }
}

export class Nil extends AstNode {

    protected initialized = false

    constructor() {
        super(null)
        if (this.initialized) {
            throw Error("Nil Node can only be initialized once")
        }
        this.initialized = true
        this._parent = NIL
    }


    ancestors():AstNode[] {
        return []
    }

    descendants():AstNode[] {
        return []
    }
}

// TODO: rename? too similar to class name?
export const NIL:any = new Nil()
Object.freeze(NIL)

/**
 * Reflective utility to makes it easier setting the parents of an AstNode's children.
 * The children of an AstNode must have the parent property set, otherwise the most basic functionality
 * won't work (children()/descendants()/visit()/...)
 */
export function setParent(node:AstNode):void {

    function isDirectChild(prop) {
        return prop instanceof AstNode && !(prop instanceof Nil)
    }

    let allKids = _.reduce(node, (result, prop, name:string) => {
        if (isDirectChild(prop) && name !== "_parent") {
            result.push(prop)
        }
        else if (_.isArray(prop)) {
            _.forEach(prop, (currElem) => {
                if (isDirectChild(currElem)) {
                    result.push(currElem)
                }
            })
        }
        return result
    }, [])

    _.forEach(allKids, (currChild) => {
        (<any>currChild)._parent = node
    })
}
