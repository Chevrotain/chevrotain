import { TokenType } from "../scan/lexer_public"
import {
    hasTokenLabel,
    IToken,
    tokenLabel,
    tokenName
} from "../scan/tokens_public"
import * as utils from "../utils/utils"
import { first, map, reduce } from "../utils/utils"
import {
    Alternation,
    IOptionallyNamedProduction,
    IProductionWithOccurrence,
    NonTerminal,
    Rule,
    Terminal
} from "./grammar/gast/gast_public"
import { getProductionDslName } from "./grammar/gast/gast"
import { validNestedRuleName } from "./grammar/checks"
import { VERSION } from "../version"

export interface IParserErrorMessageProvider {
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
     *                                http://sap.github.io/chevrotain/documentation/1_0_1/interfaces/ormethodopts.html#err_msg
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
     *                                http://sap.github.io/chevrotain/documentation/1_0_1/interfaces/dslmethodoptswitherr.html#err_msg
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
export const defaultParserErrorProvider: IParserErrorMessageProvider = {
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

Object.freeze(defaultParserErrorProvider)

export interface IGrammarResolverErrorMessageProvider {
    buildRuleNotFoundError(
        topLevelRule: Rule,
        undefinedRule: NonTerminal
    ): string
}

export interface IGrammarErrorMessageProvider
    extends IGrammarResolverErrorMessageProvider {
    buildDuplicateFoundError(
        topLevelRule: Rule,
        duplicateProds: IProductionWithOccurrence[]
    ): string

    buildInvalidNestedRuleNameError(
        topLevelRule: Rule,
        nestedProd: IOptionallyNamedProduction
    ): string

    buildDuplicateNestedRuleNameError(
        topLevelRule: Rule,
        nestedProd: IOptionallyNamedProduction[]
    ): string

    buildNamespaceConflictError(topLevelRule: Rule): string

    buildAlternationPrefixAmbiguityError(options: {
        topLevelRule: Rule
        prefixPath: TokenType[]
        ambiguityIndices: number[]
        alternation: Alternation
    }): string

    buildAlternationAmbiguityError(options: {
        topLevelRule: Rule
        prefixPath: TokenType[]
        ambiguityIndices: number[]
        alternation: Alternation
    }): string

    buildEmptyRepetitionError(options: {
        topLevelRule: Rule
        repetition: IProductionWithOccurrence
    }): string

    buildTokenNameError(options: {
        tokenType: TokenType
        expectedPattern: RegExp
    })

    buildEmptyAlternationError(options: {
        topLevelRule: Rule
        alternation: Alternation
        emptyChoiceIdx: number
    })

    buildTooManyAlternativesError(options: {
        topLevelRule: Rule
        alternation: Alternation
    }): string

    buildLeftRecursionError(options: {
        topLevelRule: Rule
        leftRecursionPath: Rule[]
    }): string

    buildInvalidRuleNameError(options: {
        topLevelRule: Rule
        expectedPattern: RegExp
    }): string

    buildDuplicateRuleNameError(options: {
        topLevelRule: Rule | string
        grammarName: string
    }): string
}

export const defaultGrammarErrorProvider: IGrammarErrorMessageProvider = {
    buildRuleNotFoundError(
        topLevelRule: Rule,
        undefinedRule: NonTerminal
    ): string {
        const msg =
            "Invalid grammar, reference to a rule which is not defined: ->" +
            undefinedRule.nonTerminalName +
            "<-\n" +
            "inside top level rule: ->" +
            topLevelRule.name +
            "<-"
        return msg
    },

    buildDuplicateFoundError(
        topLevelRule: Rule,
        duplicateProds: IProductionWithOccurrence[]
    ): string {
        function getExtraProductionArgument(
            prod: IProductionWithOccurrence
        ): string {
            if (prod instanceof Terminal) {
                return tokenName(prod.terminalType)
            } else if (prod instanceof NonTerminal) {
                return prod.nonTerminalName
            } else {
                return ""
            }
        }

        const topLevelName = topLevelRule.name
        const duplicateProd = first(duplicateProds)
        const index = duplicateProd.idx
        const dslName = getProductionDslName(duplicateProd)
        let extraArgument = getExtraProductionArgument(duplicateProd)

        let msg = `->${dslName}<- with numerical suffix: ->${index}<-
                  ${extraArgument ? `and argument: ->${extraArgument}<-` : ""}
                  appears more than once (${
                      duplicateProds.length
                  } times) in the top level rule: ->${topLevelName}<-.
                  ${
                      index === 0
                          ? `Also note that numerical suffix 0 means ${dslName} without any suffix.`
                          : ""
                  }
                  To fix this make sure each usage of ${dslName} ${
            extraArgument ? `with the argument: ->${extraArgument}<-` : ""
        }
                  in the rule ->${topLevelName}<- has a different occurrence index (0-5), as that combination acts as a unique
                  position key in the grammar, which is needed by the parsing engine.
                  
                  For further details see: http://sap.github.io/chevrotain/website/FAQ.html#NUMERICAL_SUFFIXES 
                  `

        // white space trimming time! better to trim afterwards as it allows to use WELL formatted multi line template strings...
        msg = msg.replace(/[ \t]+/g, " ")
        msg = msg.replace(/\s\s+/g, "\n")

        return msg
    },

    buildInvalidNestedRuleNameError(
        topLevelRule: Rule,
        nestedProd: IOptionallyNamedProduction
    ): string {
        const msg =
            `Invalid nested rule name: ->${nestedProd.name}<- inside rule: ->${
                topLevelRule.name
            }<-\n` +
            `it must match the pattern: ->${validNestedRuleName.toString()}<-.\n` +
            `Note that this means a nested rule name must start with the '$'(dollar) sign.`

        return msg
    },

    buildDuplicateNestedRuleNameError(
        topLevelRule: Rule,
        nestedProd: IOptionallyNamedProduction[]
    ): string {
        const duplicateName = first(nestedProd).name
        const errMsg =
            `Duplicate nested rule name: ->${duplicateName}<- inside rule: ->${
                topLevelRule.name
            }<-\n` +
            `A nested name must be unique in the scope of a top level grammar rule.`

        return errMsg
    },

    buildNamespaceConflictError(rule: Rule): string {
        const errMsg =
            `Namespace conflict found in grammar.\n` +
            `The grammar has both a Terminal(Token) and a Non-Terminal(Rule) named: <${
                rule.name
            }>.\n` +
            `To resolve this make sure each Terminal and Non-Terminal names are unique\n` +
            `This is easy to accomplish by using the convention that Terminal names start with an uppercase letter\n` +
            `and Non-Terminal names start with a lower case letter.`

        return errMsg
    },
    buildAlternationPrefixAmbiguityError(options: {
        topLevelRule: Rule
        prefixPath: TokenType[]
        ambiguityIndices: number[]
        alternation: Alternation
    }): string {
        const pathMsg = map(options.prefixPath, currTok =>
            tokenLabel(currTok)
        ).join(", ")
        const occurrence =
            options.alternation.idx === 0 ? "" : options.alternation.idx
        const errMsg =
            `Ambiguous alternatives: <${options.ambiguityIndices.join(
                " ,"
            )}> due to common lookahead prefix\n` +
            `in <OR${occurrence}> inside <${
                options.topLevelRule.name
            }> Rule,\n` +
            `<${pathMsg}> may appears as a prefix path in all these alternatives.\n` +
            `http://sap.github.io/chevrotain/website/Building_Grammars/resolving_grammar_errors.html#COMMON_PREFIX ` +
            `For farther details.`

        return errMsg
    },

    buildAlternationAmbiguityError(options: {
        topLevelRule: Rule
        prefixPath: TokenType[]
        ambiguityIndices: number[]
        alternation: Alternation
    }): string {
        let pathMsg = map(options.prefixPath, currtok =>
            tokenLabel(currtok)
        ).join(", ")
        let occurrence =
            options.alternation.idx === 0 ? "" : options.alternation.idx
        let currMessage =
            `Ambiguous alternatives: <${options.ambiguityIndices.join(
                " ,"
            )}> in <OR${occurrence}>` +
            ` inside <${options.topLevelRule.name}> Rule,\n` +
            `<${pathMsg}> may appears as a prefix path in all these alternatives.\n`

        let docs_version = VERSION.replace(/\./g, "_")
        // Should this information be on the error message or in some common errors docs?
        currMessage =
            currMessage +
            "To Resolve this, try one of of the following: \n" +
            "1. Refactor your grammar to be LL(K) for the current value of k (by default k=5)\n" +
            "2. Increase the value of K for your grammar by providing a larger 'maxLookahead' value in the parser's config\n" +
            "3. This issue can be ignored (if you know what you are doing...), see" +
            " http://sap.github.io/chevrotain/documentation/" +
            docs_version +
            "/interfaces/iparserconfig.html#ignoredissues for more" +
            " details\n"
        return currMessage
    },

    buildEmptyRepetitionError(options: {
        topLevelRule: Rule
        repetition: IProductionWithOccurrence
    }): string {
        let dslName = getProductionDslName(options.repetition)
        if (options.repetition.idx !== 0) {
            dslName += options.repetition.idx
        }

        const errMsg =
            `The repetition <${dslName}> within Rule <${
                options.topLevelRule.name
            }> can never consume any tokens.\n` +
            `This could lead to an infinite loop.`

        return errMsg
    },

    buildTokenNameError(options: {
        tokenType: TokenType
        expectedPattern: RegExp
    }): string {
        const tokTypeName = tokenName(options.tokenType)
        const errMsg = `Invalid Grammar Token name: ->${tokTypeName}<- it must match the pattern: ->${options.expectedPattern.toString()}<-`
        return errMsg
    },

    buildEmptyAlternationError(options: {
        topLevelRule: Rule
        alternation: Alternation
        emptyChoiceIdx: number
    }): string {
        const errMsg =
            `Ambiguous empty alternative: <${options.emptyChoiceIdx + 1}>` +
            ` in <OR${options.alternation.idx}> inside <${
                options.topLevelRule.name
            }> Rule.\n` +
            `Only the last alternative may be an empty alternative.`

        return errMsg
    },

    buildTooManyAlternativesError(options: {
        topLevelRule: Rule
        alternation: Alternation
    }): string {
        const errMsg =
            `An Alternation cannot have more than 256 alternatives:\n` +
            `<OR${options.alternation.idx}> inside <${
                options.topLevelRule.name
            }> Rule.\n has ${options.alternation.definition.length +
                1} alternatives.`

        return errMsg
    },

    buildLeftRecursionError(options: {
        topLevelRule: Rule
        leftRecursionPath: Rule[]
    }): string {
        const ruleName = options.topLevelRule.name
        let pathNames = utils.map(
            options.leftRecursionPath,
            currRule => currRule.name
        )
        let leftRecursivePath = `${ruleName} --> ${pathNames
            .concat([ruleName])
            .join(" --> ")}`
        let errMsg =
            `Left Recursion found in grammar.\n` +
            `rule: <${ruleName}> can be invoked from itself (directly or indirectly)\n` +
            `without consuming any Tokens. The grammar path that causes this is: \n ${leftRecursivePath}\n` +
            ` To fix this refactor your grammar to remove the left recursion.\n` +
            `see: https://en.wikipedia.org/wiki/LL_parser#Left_Factoring.`

        return errMsg
    },

    buildInvalidRuleNameError(options: {
        topLevelRule: Rule
        expectedPattern: RegExp
    }): string {
        const ruleName = options.topLevelRule.name
        const expectedPatternString = options.expectedPattern.toString()
        const errMsg = `Invalid grammar rule name: ->${ruleName}<- it must match the pattern: ->${expectedPatternString}<-`
        return errMsg
    },

    buildDuplicateRuleNameError(options: {
        topLevelRule: Rule | string
        grammarName: string
    }): string {
        let ruleName
        if (options.topLevelRule instanceof Rule) {
            ruleName = options.topLevelRule.name
        } else {
            ruleName = options.topLevelRule
        }

        const errMsg = `Duplicate definition, rule: ->${ruleName}<- is already defined in the grammar: ->${
            options.grammarName
        }<-`

        return errMsg
    }
}
