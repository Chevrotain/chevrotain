import {ParseTree} from "./parse_tree"
import * as utils from "./utils"
import {Token} from "chevrotain"
import * as _ from "lodash"

export interface IMatchCase {
    CASE:Function, // a Token Constructor
    THEN:Function  // The Action to perform
}

export function MATCH_CHILDREN(root:ParseTree, ...cases:IMatchCase[]):void {
    _.forEach(root.children, (currChild) => {
        matchSingleChild(currChild, cases)
    })
}

export function MATCH_ONLY_CHILD(root:ParseTree, ...cases:IMatchCase[]):void {

    if (root.children.length !== 1) {
        throw Error("When using 'MATCH_ONLY_CHILD' the root ParseTree must have exactly one child")
    }

    let currChild = _.first(root.children)
    return matchSingleChild(currChild, cases)
}

// TODO: use generics in return type and with IMatchCase interface
function matchSingleChild(currChild:ParseTree, cases:IMatchCase[]):any {
    let matchingCase = _.find(cases,
        (currCase) => currChild.payload instanceof currCase.CASE)

    if (_.isUndefined(matchingCase)) {
        let childClassName = utils.getClassNameFromInstance(currChild.payload)
        throw Error(`non exhaustive match, no case for <${childClassName}>`)
    }
    return matchingCase.THEN.call(null, currChild)
}

export function buildSyntaxBox(tree:ParseTree):Token[] {
    return _.map(tree.children, (subtree) => subtree.payload)
}
