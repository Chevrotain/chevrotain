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
        let matchingCase = _.find(cases,
            (currCase) => currChild.payload instanceof currCase.CASE)

        if (_.isUndefined(matchingCase)) {
            let childClassName = utils.getClassNameFromInstance(currChild)
            throw Error(`non exhaustive match, no case for <${childClassName}>`)
        }
        matchingCase.THEN.call(null, currChild)
    })
}

export function buildSyntaxBox(tree:ParseTree):Token[] {
    return _.map(tree.children, (subtree) => subtree.payload)
}
