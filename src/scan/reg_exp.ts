import { RegExpParser, regexpToAstVersion } from "regexp-to-ast"
import {
    flatten,
    map,
    forEach,
    contains,
    PRINT_ERROR,
    PRINT_WARNNING
} from "../utils/utils"

const parser = new RegExpParser()
const complementErrorMessage =
    "Complement Sets are not supported for first char optimization"
export const failedOptimizationPrefixMsg =
    'Unable to use "first char" lexer optimizations:\n'

export function getStartCodes(
    regExp: RegExp,
    ensureOptimizations = false
): number[] {
    try {
        const ast = parser.pattern(regExp.toString())
        return firstChar(ast.value)
    } catch (e) {
        /* istanbul ignore next */
        // Testing this relies on the regexp-to-ast library having a bug... */
        // TODO: only the else branch needs to be ignored, try to fix with newer prettier / tsc
        if (e.message === complementErrorMessage) {
            if (ensureOptimizations) {
                PRINT_WARNNING(
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
                    `\tUsing the regexp-to-ast library version: ${regexpToAstVersion}\n` +
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
                        forEach(atom.value, code => startChars.push(code))
                        break
                    case "Group":
                        const groupCodes = firstChar(atom.value)
                        forEach(groupCodes, code => startChars.push(code))
                        break
                    /* istanbul ignore next */
                    default:
                        throw Error("Non Exhaustive Match")
                }

                // reached a mandatory production, no more start codes can be found on this alternative
                if (
                    //
                    atom.quantifier === undefined ||
                    (atom.quantifier !== undefined &&
                        atom.quantifier.atLeast > 0)
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
