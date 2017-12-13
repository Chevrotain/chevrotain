import { TokenType } from "../scan/lexer_public"
import {
    hasTokenLabel,
    IToken,
    tokenLabel,
    tokenName
} from "../scan/tokens_public"
import { first, map, reduce } from "../utils/utils"

export interface IErrorMessageProvider {
    /**
     * Mismatched Token Error happens when the parser attempted to consume a terminal and failed.
     * It corresponds to a failed "CONSUME(expected)" in Chevrotain DSL terms.
     *
     * @param options.expected - The expected Token Type.
     *
     * @param options.actual - The actual Token "instance".
     *
     * @param options.ruleName - The rule in which the error occurred.
     */
    buildMismatchTokenMessage?(options: {
        expected: TokenType
        actual: IToken
        ruleName: string
    }): string

    /**
     * A Redundant Input Error happens when the parser has completed parsing but there
     * is still unprocessed input remaining.
     *
     * @param options.firstRedundant - The first unprocessed token "instance".
     *
     * @param options.ruleName - The rule in which the error occurred.
     */
    buildNotAllInputParsedMessage?(options: {
        firstRedundant: IToken
        ruleName: string
    }): string

    /**
     * A No Viable Alternative Error happens when the parser cannot detect any valid alternative in an alternation.
     * It corresponds to a failed "OR" in Chevrotain DSL terms.
     *
     * @param options.expectedPathsPerAlt - First level of the array represents each alternative
     *                           The next two levels represent valid (expected) paths in each alternative.
     *
     * @param options.actual - The actual sequence of tokens encountered.
     *
     * @param options.customUserDescription - A user may provide custom error message descriptor in the "OR" DSL method.
     *                                http://sap.github.io/chevrotain/documentation/0_29_0/interfaces/_chevrotain_d_.ormethodopts.html#err_msg
     *                                This is that custom message.
     *
     * @param options.ruleName - The rule in which the error occurred.
     */
    buildNoViableAltMessage?(options: {
        expectedPathsPerAlt: TokenType[][][]
        actual: IToken[]
        customUserDescription: string
        ruleName: string
    }): string

    /**
     * An Early Exit Error happens when the parser cannot detect the first mandatory iteration of a repetition.
     * It corresponds to a failed "AT_LEAST_ONE[_SEP]" in Chevrotain DSL terms.
     *
     * @param options.expectedIterationPaths - The valid (expected) paths in the first iteration.
     *
     * @param options.actual - The actual sequence of tokens encountered.
     *
     * @param options.previous - The previous token parsed.
     *                                This is useful if options.actual[0] is of type chevrotain.EOF and you need to know the last token parsed.
     *
     * @param options.customUserDescription - A user may provide custom error message descriptor in the "AT_LEAST_ONE" DSL method.
     *                                http://sap.github.io/chevrotain/documentation/0_29_0/interfaces/_chevrotain_d_.dslmethodoptswitherr.html#err_msg
     *                                This is that custom message.
     *
     * @param options.ruleName - The rule in which the error occurred.
     */
    buildEarlyExitMessage?(options: {
        expectedIterationPaths: TokenType[][]
        actual: IToken[]
        previous: IToken
        customUserDescription: string
        ruleName: string
    }): string
}

/**
 * This is the default logic Chevrotain uses to construct error messages.
 * When constructing a custom error message provider it may be used as a reference
 * or reused.
 */
export const defaultErrorProvider: IErrorMessageProvider = {
    buildMismatchTokenMessage({ expected, actual, ruleName }): string {
        let hasLabel = hasTokenLabel(expected)
        let expectedMsg = hasLabel
            ? `--> ${tokenLabel(expected)} <--`
            : `token of type --> ${tokenName(expected)} <--`

        let msg = `Expecting ${expectedMsg} but found --> '${actual.image}' <--`

        return msg
    },

    buildNotAllInputParsedMessage({ firstRedundant, ruleName }): string {
        return (
            "Redundant input, expecting EOF but found: " + firstRedundant.image
        )
    },

    buildNoViableAltMessage({
        expectedPathsPerAlt,
        actual,
        customUserDescription,
        ruleName
    }): string {
        let errPrefix = "Expecting: "
        // TODO: issue: No Viable Alternative Error may have incomplete details. #502
        let actualText = first(actual).image
        let errSuffix = "\nbut found: '" + actualText + "'"

        if (customUserDescription) {
            return errPrefix + customUserDescription + errSuffix
        } else {
            let allLookAheadPaths = reduce(
                expectedPathsPerAlt,
                (result, currAltPaths) => result.concat(currAltPaths),
                []
            )
            let nextValidTokenSequences = map(
                allLookAheadPaths,
                currPath =>
                    `[${map(currPath, currTokenType =>
                        tokenLabel(currTokenType)
                    ).join(", ")}]`
            )
            let nextValidSequenceItems = map(
                nextValidTokenSequences,
                (itemMsg, idx) => `  ${idx + 1}. ${itemMsg}`
            )
            let calculatedDescription = `one of these possible Token sequences:\n${nextValidSequenceItems.join(
                "\n"
            )}`

            return errPrefix + calculatedDescription + errSuffix
        }
    },

    buildEarlyExitMessage({
        expectedIterationPaths,
        actual,
        customUserDescription,
        ruleName
    }): string {
        let errPrefix = "Expecting: "
        // TODO: issue: No Viable Alternative Error may have incomplete details. #502
        let actualText = first(actual).image
        let errSuffix = "\nbut found: '" + actualText + "'"

        if (customUserDescription) {
            return errPrefix + customUserDescription + errSuffix
        } else {
            let nextValidTokenSequences = map(
                expectedIterationPaths,
                currPath =>
                    `[${map(currPath, currTokenType =>
                        tokenLabel(currTokenType)
                    ).join(",")}]`
            )
            let calculatedDescription =
                `expecting at least one iteration which starts with one of these possible Token sequences::\n  ` +
                `<${nextValidTokenSequences.join(" ,")}>`

            return errPrefix + calculatedDescription + errSuffix
        }
    }
}

Object.freeze(defaultErrorProvider)
