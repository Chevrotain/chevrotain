import { hasTokenLabel, tokenLabel, tokenName } from "../scan/tokens_public"
import * as utils from "../utils/utils"
import { first, map, reduce } from "../utils/utils"
import {
    Alternation,
    NonTerminal,
    Rule,
    Terminal
} from "./grammar/gast/gast_public"
import { getProductionDslName } from "./grammar/gast/gast"
import { validNestedRuleName } from "./grammar/checks"
import { VERSION } from "../version"
import {
    IGrammarResolverErrorMessageProvider,
    IGrammarValidatorErrorMessageProvider,
    IOptionallyNamedProduction,
    IParserErrorMessageProvider,
    IProductionWithOccurrence,
    TokenType
} from "../../api"
import { DEFAULT_PARSER_CONFIG } from "./parser/parser"

export const defaultParserErrorProvider: IParserErrorMessageProvider = {
    buildMismatchTokenMessage({
        expected,
        actual,
        previous,
        ruleName
    }): string {
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
        previous,
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

export const defaultGrammarResolverErrorProvider: IGrammarResolverErrorMessageProvider = {
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
    }
}

export const defaultGrammarValidatorErrorProvider: IGrammarValidatorErrorMessageProvider = {
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
                  
                  For further details see: https://sap.github.io/chevrotain/docs/FAQ.html#NUMERICAL_SUFFIXES 
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
            `Invalid nested rule name: ->${nestedProd.name}<- inside rule: ->${topLevelRule.name}<-\n` +
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
            `Duplicate nested rule name: ->${duplicateName}<- inside rule: ->${topLevelRule.name}<-\n` +
            `A nested name must be unique in the scope of a top level grammar rule.`

        return errMsg
    },

    buildNamespaceConflictError(rule: Rule): string {
        const errMsg =
            `Namespace conflict found in grammar.\n` +
            `The grammar has both a Terminal(Token) and a Non-Terminal(Rule) named: <${rule.name}>.\n` +
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
            `in <OR${occurrence}> inside <${options.topLevelRule.name}> Rule,\n` +
            `<${pathMsg}> may appears as a prefix path in all these alternatives.\n` +
            `See: https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#COMMON_PREFIX\n` +
            `For Further details.`

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
            `Ambiguous Alternatives Detected: <${options.ambiguityIndices.join(
                " ,"
            )}> in <OR${occurrence}>` +
            ` inside <${options.topLevelRule.name}> Rule,\n` +
            `<${pathMsg}> may appears as a prefix path in all these alternatives.\n`

        currMessage =
            currMessage +
            `See: https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#AMBIGUOUS_ALTERNATIVES\n` +
            `For Further details.`
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
            `The repetition <${dslName}> within Rule <${options.topLevelRule.name}> can never consume any tokens.\n` +
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
            ` in <OR${options.alternation.idx}> inside <${options.topLevelRule.name}> Rule.\n` +
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

        const errMsg = `Duplicate definition, rule: ->${ruleName}<- is already defined in the grammar: ->${options.grammarName}<-`

        return errMsg
    }
}
