import * as _ from "lodash"
import {
    ObjectNode,
    ObjectItemNode
} from "./ast"
import {
    ISemanticIssue,
    ERROR,
    WARNING,
    ISemanticCheckConfig
} from "../../pudu/semantics"


export const DEFAULT_SEMANTIC_CHECKS_CONFIG:ISemanticCheckConfig = [
    {
        clazz:  ObjectNode,
        checks: [ERROR(checkDuplicateKeys)]
    },
    {
        clazz:  ObjectItemNode,
        checks: [WARNING(checkReservedJavascriptKeyword)]
    }
]
Object.freeze(DEFAULT_SEMANTIC_CHECKS_CONFIG)


function NO_ISSUES_FOUND() {
    return []
}

export function checkDuplicateKeys(node:ObjectNode):ISemanticIssue[] {

    let keys = _.map(node.items, (currItem) => currItem.key.value)
    let groupedKeys = _.groupBy(keys)

    let issues = _.reduce(node.items, (result, currItem) => {

        let currKey = currItem.key.value
        if (groupedKeys[currKey].length > 1) {
            result.push({
                message: `Duplicate Key ->${currKey}<- found in JSON Object`,
                astNode: currItem.key
            })
        }

        return result
    }, [])


    return issues
}

// TODO: fill this up, maybe separate into the different categories of reserved keywords?
// ES6 / ES7 / future reserved keywords / strict mode reserved keywords / ...?
const RESERVED_KEYWORDS = ["if", "else", "for", "instanceof"]
Object.freeze(RESERVED_KEYWORDS)

export function checkReservedJavascriptKeyword(node:ObjectItemNode):ISemanticIssue[] {

    if (_.includes(RESERVED_KEYWORDS, node.key.value)) {
        return [
            {
                message: `A Javascript Reserved Keyword ->${node.key.value}<- is used as the key of a JSON property`,
                astNode: node.key
            }
        ]
    }

    return NO_ISSUES_FOUND()
}
