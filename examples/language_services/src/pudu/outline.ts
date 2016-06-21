import {IAstPatternDispatcher} from "./dispatcher"
import {AstNode, NIL} from "./ast"
import * as _ from "lodash"

export interface IOutlineNode {
    name: string
    astNode: AstNode
    children: IOutlineNode[]
}

export const EMPTY_OUTLINE:IOutlineNode = {
    name:     "",
    astNode:  NIL,
    children: []
}

Object.freeze(EMPTY_OUTLINE)

/**
 * returns the name in an outline of a
 */
export interface IOutlineDispatcher extends IAstPatternDispatcher<void, string> {}

/**
 * to explicitly say what you mean...
 */
export const NO_OUTLINE_FOR_NODE:string = undefined

export function buildOutline(astNode:AstNode, dispatcher:IOutlineDispatcher):IOutlineNode {

    let name = dispatcher.dispatch(astNode)

    if (name === NO_OUTLINE_FOR_NODE) {
        return EMPTY_OUTLINE
    }

    let children = _.map(astNode.children(), (astChild) => buildOutline(astChild, dispatcher))

    children = _.filter(children, (currchild) => currchild !== EMPTY_OUTLINE)

    let outlineNode:IOutlineNode = {
        name:     name,
        astNode:  astNode,
        children: children
    }

    return outlineNode
}

export type Comparator = (first:IOutlineNode, second:IOutlineNode) => number

export function compareAlphabetically(first:IOutlineNode, second:IOutlineNode):number {
    return first.name.toLocaleLowerCase().localeCompare(second.name.toLocaleLowerCase())
}

export function compareByPosition(first:IOutlineNode, second:IOutlineNode):number {
    // TODO: implement
    return null
}

export function sortOutline(unsortedOutline:IOutlineNode,
                            comparator:Comparator):IOutlineNode {

    let copyOfUnsortedOutline = cloneOutline(unsortedOutline)
    return sortOutlineInternal(copyOfUnsortedOutline, comparator)

}

function sortOutlineInternal(unsortedOutline:IOutlineNode,
                             comparator:Comparator):IOutlineNode {

    _.forEach(unsortedOutline.children, (currChild) => {
        sortOutlineInternal(currChild, comparator)
    })

    unsortedOutline.children.sort(comparator)

    return unsortedOutline
}


/**
 * Clones the outline (name/children), but not the AstNode property
 * whose reference is simply copied.
 */
export function cloneOutline(outlineToClone:IOutlineNode):IOutlineNode {

    let clonedChildren = _.map(outlineToClone.children, cloneOutline)

    let cloneOutlineNode = {
        name:     outlineToClone.name, // strings are immutable
        astNode:     outlineToClone.astNode, // only copy the reference to avoid inc
        children: clonedChildren
    }

    return cloneOutlineNode
}

/**
 * creates a new OutlineNode, without nested outlineNodes for which the application of the predicate is true
 */
export function removeOutlineNodes(outline:IOutlineNode,
                                   predicate:(outline:IOutlineNode) => boolean):IOutlineNode {

    let copyOfOutline = cloneOutline(outline)
    return removeOutlineNodesInternal(copyOfOutline, predicate)
}

function removeOutlineNodesInternal(outline:IOutlineNode,
                                    predicate:(outline:IOutlineNode) => boolean):IOutlineNode {

    let filteredChildren = _.reject(outline.children, predicate)
    outline.children = filteredChildren

    _.forEach(outline.children, (currChild) => removeOutlineNodesInternal(currChild, predicate))

    return outline
}

/**
 * creates a new OutlineNode, in which nested nodes will be replaced by the result of calling replacementFunc.
 * Note that the replacement func may be the identity function for some set of inputs.
 */
export function replaceOutlineNodes(outline:IOutlineNode, replacementFunc:(outline:IOutlineNode) => IOutlineNode):IOutlineNode {
    let copyOfOutline = cloneOutline(outline)
    return replaceOutlineNodesInternal(copyOfOutline, replacementFunc)
}


function replaceOutlineNodesInternal(outline:IOutlineNode, replacementFunc:(outline:IOutlineNode) => IOutlineNode):IOutlineNode {
    outline.children = _.map(outline.children, replacementFunc)

    _.forEach(outline.children, (currChild) => replaceOutlineNodesInternal(currChild, replacementFunc))

    return outline
}

/**
 * returns an array composed of all the outlines nodes in the input outline "tree".
 */
export function flattenOutline(outline:IOutlineNode):IOutlineNode[] {

    let result = []
    result.push(outline)

    _.forEach(outline.children, (currChild) => result.concat(flattenOutline(currChild)))

    return result
}
