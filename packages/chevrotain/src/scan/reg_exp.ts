import { VERSION, BaseRegExpVisitor } from "regexp-to-ast"
import {
    flatten,
    map,
    forEach,
    contains,
    PRINT_ERROR,
    PRINT_WARNING,
    find,
    isArray,
    every
} from "../utils/utils"
import { getRegExpAst } from "./reg_exp_parser"

const complementErrorMessage =
    "Complement Sets are not supported for first char optimization"
export const failedOptimizationPrefixMsg =
    'Unable to use "first char" lexer optimizations:\n'

export function getStartCodes(
    regExp: RegExp,
    ensureOptimizations = false
): number[] {
    try {
        const ast = getRegExpAst(regExp)
        let firstChars = firstChar(ast.value)
        if (ast.flags.ignoreCase) {
            firstChars = applyIgnoreCase(firstChars)
        }

        return firstChars
    } catch (e) {
        /* istanbul ignore next */
        // Testing this relies on the regexp-to-ast library having a bug... */
        // TODO: only the else branch needs to be ignored, try to fix with newer prettier / tsc
        if (e.message === complementErrorMessage) {
            if (ensureOptimizations) {
                PRINT_WARNING(
                    `${failedOptimizationPrefixMsg}` +
                        `\tUnable to optimize: < ${regExp.toString()} >\n` +
                        "\tComplement Sets cannot be automatically optimized.\n" +
                        "\tThis will disable the lexer's first char optimizations.\n" +
                        "\tSee: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#COMPLEMENT for details."
                )
            }
        } else {
            let msgSuffix = ""
            if (ensureOptimizations) {
                msgSuffix =
                    "\n\tThis will disable the lexer's first char optimizations.\n" +
                    "\tSee: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#REGEXP_PARSING for details."
            }
            PRINT_ERROR(
                `${failedOptimizationPrefixMsg}\n` +
                    `\tFailed parsing: < ${regExp.toString()} >\n` +
                    `\tUsing the regexp-to-ast library version: ${VERSION}\n` +
                    "\tPlease open an issue at: https://github.com/bd82/regexp-to-ast/issues" +
                    msgSuffix
            )
        }
    }

    return []
}

export function firstChar(ast): number[] {
    switch (ast.type) {
        case "Disjunction":
            return flatten(map(ast.value, firstChar))
        case "Alternative":
            const startChars = []
            const terms = ast.value
            for (let i = 0; i < terms.length; i++) {
                const term = terms[i]

                if (
                    contains(
                        [
                            // A group back reference cannot affect potential starting char.
                            // because if a back reference is the first production than automatically
                            // the group being referenced has had to come BEFORE so its codes have already been added
                            "GroupBackReference",
                            // assertions do not affect potential starting codes
                            "Lookahead",
                            "NegativeLookahead",
                            "StartAnchor",
                            "EndAnchor",
                            "WordBoundary",
                            "NonWordBoundary"
                        ],
                        term.type
                    )
                ) {
                    continue
                }

                const atom = term
                switch (atom.type) {
                    case "Character":
                        startChars.push(atom.value)
                        break
                    case "Set":
                        if (atom.complement === true) {
                            throw Error(complementErrorMessage)
                        }

                        // TODO: this may still be slow when there are many codes
                        forEach(atom.value, code => {
                            if (typeof code === "number") {
                                startChars.push(code)
                            } else {
                                //range
                                const range = code
                                for (
                                    let rangeCode = range.from;
                                    rangeCode <= range.to;
                                    rangeCode++
                                ) {
                                    startChars.push(rangeCode)
                                }
                            }
                        })
                        break
                    case "Group":
                        const groupCodes = firstChar(atom.value)
                        forEach(groupCodes, code => startChars.push(code))
                        break
                    /* istanbul ignore next */
                    default:
                        throw Error("Non Exhaustive Match")
                }

                // reached a mandatory production, no more **start** codes can be found on this alternative
                const isOptionalQuantifier =
                    atom.quantifier !== undefined &&
                    atom.quantifier.atLeast === 0
                if (
                    // A group may be optional due to empty contents /(?:)/
                    // or if everything inside it is optional /((a)?)/
                    (atom.type === "Group" &&
                        isWholeOptional(atom) === false) ||
                    // If this term is not a group it may only be optional if it has an optional quantifier
                    (atom.type !== "Group" && isOptionalQuantifier === false)
                ) {
                    break
                }
            }

            return startChars
        /* istanbul ignore next */
        default:
            throw Error("non exhaustive match!")
    }
}

export function applyIgnoreCase(firstChars: number[]): number[] {
    const firstCharsCase = []
    forEach(firstChars, charCode => {
        firstCharsCase.push(charCode)

        const char = String.fromCharCode(charCode)
        /* istanbul ignore else */
        if (char.toUpperCase() !== char) {
            firstCharsCase.push(char.toUpperCase().charCodeAt(0))
        } else if (char.toLowerCase() !== char) {
            firstCharsCase.push(char.toLowerCase().charCodeAt(0))
        }
    })

    return firstCharsCase
}

function findCode(setNode, targetCharCodes) {
    return find(setNode.value, codeOrRange => {
        if (typeof codeOrRange === "number") {
            return contains(targetCharCodes, codeOrRange)
        } else {
            // range
            const range = <any>codeOrRange
            return (
                find(
                    targetCharCodes,
                    targetCode =>
                        range.from <= targetCode && targetCode <= range.to
                ) !== undefined
            )
        }
    })
}

function isWholeOptional(ast) {
    if (ast.quantifier && ast.quantifier.atLeast === 0) {
        return true
    }

    if (!ast.value) {
        return false
    }

    return isArray(ast.value)
        ? every(ast.value, isWholeOptional)
        : isWholeOptional(ast.value)
}

class CharCodeFinder extends BaseRegExpVisitor {
    found: boolean = false

    constructor(private targetCharCodes: number[]) {
        super()
    }

    visitChildren(node) {
        // switch lookaheads as they do not actually consume any characters thus
        // finding a charCode at lookahead context does not mean that regexp can actually contain it in a match.
        switch (node.type) {
            case "Lookahead":
                this.visitLookahead(node)
                return
            case "NegativeLookahead":
                this.visitNegativeLookahead(node)
                return
        }

        super.visitChildren(node)
    }

    visitCharacter(node) {
        if (contains(this.targetCharCodes, node.value)) {
            this.found = true
        }
    }

    visitSet(node) {
        if (node.complement) {
            if (findCode(node, this.targetCharCodes) === undefined) {
                this.found = true
            }
        } else {
            if (findCode(node, this.targetCharCodes) !== undefined) {
                this.found = true
            }
        }
    }
}

export function canMatchCharCode(
    charCodes: number[],
    pattern: RegExp | string
) {
    if (pattern instanceof RegExp) {
        const ast = getRegExpAst(pattern)
        const charCodeFinder = new CharCodeFinder(charCodes)
        charCodeFinder.visit(ast)
        return charCodeFinder.found
    } else {
        return (
            find(<any>pattern, char => {
                return contains(charCodes, (<string>char).charCodeAt(0))
            }) !== undefined
        )
    }
}
