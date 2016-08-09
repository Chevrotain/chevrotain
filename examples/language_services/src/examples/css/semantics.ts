import * as _ from "lodash"
import {Declaration, CharsetHeader, UnaryMinusOperator} from "./ast"
import {ISemanticIssue, ERROR, WARNING, ISemanticCheckConfig} from "../../pudu/semantics"


export const DEFAULT_SEMANTIC_CHECKS_CONFIG:ISemanticCheckConfig = [
    {
        clazz: Declaration,
        checks: [ERROR(checkNegativeValue)]
    },
    {
        clazz: CharsetHeader,
        checks: [WARNING(checkInvalidCharset)]
    }
]
Object.freeze(DEFAULT_SEMANTIC_CHECKS_CONFIG)


// TODO: perhaps / probably this belong in PUDU ?
function NO_ISSUES_FOUND() {
    return []
}


const ATTRIBUTES_WHICH_MAY_NOT_BE_NEGATIVE = ["height", "width"]
Object.freeze(ATTRIBUTES_WHICH_MAY_NOT_BE_NEGATIVE)

export function checkNegativeValue(node:Declaration):ISemanticIssue[] {

    let propName = node.property.name

    if (_.includes(ATTRIBUTES_WHICH_MAY_NOT_BE_NEGATIVE, propName)) {
        let expr = node.expr

        // can only (easily) detect negative values in constant expressions
        if (expr.operands.length === 1) {
            let singleTerm = _.first(expr.operands)
            if (singleTerm.unaryOperator instanceof UnaryMinusOperator) {
                return [
                    {
                        message: `CSS property '${propName}' does not support negative values`,
                        astNode: singleTerm
                    }
                ]
            }
        }
    }

    return NO_ISSUES_FOUND()
}

// full list is defined here:
// http://www.iana.org/assignments/character-sets/character-sets.xhtml
const VALID_CHARSETS = ["US-ASCII", "UTF-8", "ISO-8859-1"]
Object.freeze(VALID_CHARSETS)

export function checkInvalidCharset(node:CharsetHeader):ISemanticIssue[] {

    let charsetName = node.charset.value

    if (!_.includes(VALID_CHARSETS, charsetName)) {
        return [
            {
                message: `Invalid Charset Header '${charsetName}'`,
                astNode: node.charset
            }
        ]
    }

    return NO_ISSUES_FOUND()
}
