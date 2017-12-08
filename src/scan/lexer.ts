import { IToken, tokenName } from "./tokens_public"
import {
    ILexerDefinitionError,
    ILineTerminatorsTester,
    IMultiModeLexerDefinition,
    IRegExpExec,
    Lexer,
    LexerDefinitionErrorType,
    TokenType
} from "./lexer_public"
import {
    compact,
    contains,
    difference,
    filter,
    find,
    first,
    flatten,
    forEach,
    has,
    indexOf,
    isArray,
    isFunction,
    isRegExp,
    isString,
    isUndefined,
    keys,
    map,
    mapValues,
    reduce,
    reject
} from "../utils/utils"

const PATTERN = "PATTERN"
export const DEFAULT_MODE = "defaultMode"
export const MODES = "modes"

export interface IPatternConfig {
    pattern: IRegExpExec
    longerAlt: number
    canLineTerminator: boolean
    isCustom: boolean
    short: number | boolean
    group: any
    push: string
    pop: boolean
    tokenTypeIdx: number
}

export interface IAnalyzeResult {
    patternIdxToConfig: IPatternConfig[]
    emptyGroups: { [groupName: string]: IToken[] }
    hasCustom: boolean
}

export let SUPPORT_STICKY =
    typeof (<any>new RegExp("(?:)")).sticky === "boolean"

export function disableSticky() {
    SUPPORT_STICKY = false
}

export function enableSticky() {
    SUPPORT_STICKY = true
}

export function analyzeTokenTypes(
    tokenTypes: TokenType[],
    useSticky: boolean = SUPPORT_STICKY
): IAnalyzeResult {
    let onlyRelevantTypes = reject(tokenTypes, currType => {
        return currType[PATTERN] === Lexer.NA
    })

    let hasCustom = false
    let allTransformedPatterns = map(onlyRelevantTypes, currType => {
        let currPattern = currType[PATTERN]

        if (isRegExp(currPattern)) {
            let regExpSource = currPattern.source
            if (
                regExpSource.length === 1 &&
                // only these regExp meta characters which can appear in a length one regExp
                regExpSource !== "^" &&
                regExpSource !== "$" &&
                regExpSource !== "."
            ) {
                return regExpSource
            } else if (
                regExpSource.length === 2 &&
                regExpSource[0] === "\\" &&
                // not a meta character
                !contains(
                    [
                        "d",
                        "D",
                        "s",
                        "S",
                        "t",
                        "r",
                        "n",
                        "t",
                        "0",
                        "c",
                        "b",
                        "B",
                        "f",
                        "v",
                        "w",
                        "W"
                    ],
                    regExpSource[1]
                )
            ) {
                // escaped meta Characters: /\+/ /\[/
                // or redundant escaping: /\a/
                // without the escaping "\"
                return regExpSource[1]
            } else {
                return useSticky
                    ? addStickyFlag(currPattern)
                    : addStartOfInput(currPattern)
            }
        } else if (isFunction(currPattern)) {
            hasCustom = true
            // CustomPatternMatcherFunc - custom patterns do not require any transformations, only wrapping in a RegExp Like object
            return { exec: currPattern }
        } else if (has(currPattern, "exec")) {
            hasCustom = true
            // ICustomPattern
            return currPattern
        } else if (typeof currPattern === "string") {
            // IGNORE ABOVE ELSE
            if (currPattern.length === 1) {
                return currPattern
            } else {
                let escapedRegExpString = currPattern.replace(
                    /[\\^$.*+?()[\]{}|]/g,
                    "\\$&"
                )
                let wrappedRegExp = new RegExp(escapedRegExpString)
                // TODO: extract the "?" expression, it is duplicated
                return useSticky
                    ? addStickyFlag(wrappedRegExp)
                    : addStartOfInput(wrappedRegExp)
            }
        } else {
            /* istanbul ignore next */
            throw Error("non exhaustive match")
        }
    })

    let patternIdxToType = map(
        onlyRelevantTypes,
        currType => currType.tokenTypeIdx
    )

    let patternIdxToGroup = map(onlyRelevantTypes, (clazz: any) => {
        let groupName = clazz.GROUP
        if (groupName === Lexer.SKIPPED) {
            return undefined
        } else if (isString(groupName)) {
            return groupName
        } else if (isUndefined(groupName)) {
            return false
        } else {
            /* istanbul ignore next */
            throw Error("non exhaustive match")
        }
    })

    let patternIdxToLongerAltIdx: any = map(onlyRelevantTypes, (clazz: any) => {
        let longerAltType = clazz.LONGER_ALT

        if (longerAltType) {
            let longerAltIdx = indexOf(onlyRelevantTypes, longerAltType)
            return longerAltIdx
        }
    })

    let patternIdxToPushMode = map(
        onlyRelevantTypes,
        (clazz: any) => clazz.PUSH_MODE
    )

    let patternIdxToPopMode = map(onlyRelevantTypes, (clazz: any) =>
        has(clazz, "POP_MODE")
    )

    let patternIdxToCanLineTerminator = map(
        onlyRelevantTypes,
        clazz => clazz.LINE_BREAKS === true
    )

    let patternIdxToIsCustom = map(onlyRelevantTypes, isCustomPattern)
    let patternIdxToShort = map(allTransformedPatterns, isShortPattern)

    let emptyGroups = reduce(
        onlyRelevantTypes,
        (acc, clazz: any) => {
            let groupName = clazz.GROUP
            if (isString(groupName) && !(groupName === Lexer.SKIPPED)) {
                acc[groupName] = []
            }
            return acc
        },
        {}
    )

    let patternIdxToConfig = map(allTransformedPatterns, (x, idx) => {
        return {
            pattern: allTransformedPatterns[idx],
            longerAlt: patternIdxToLongerAltIdx[idx],
            canLineTerminator: patternIdxToCanLineTerminator[idx],
            isCustom: patternIdxToIsCustom[idx],
            short: patternIdxToShort[idx],
            group: patternIdxToGroup[idx],
            push: patternIdxToPushMode[idx],
            pop: patternIdxToPopMode[idx],
            tokenTypeIdx: patternIdxToType[idx],
            tokenType: onlyRelevantTypes[idx]
        }
    })

    return {
        emptyGroups: emptyGroups,
        patternIdxToConfig: patternIdxToConfig,
        hasCustom: hasCustom
    }
}

export function validatePatterns(
    tokenTypes: TokenType[],
    validModesNames: string[]
): ILexerDefinitionError[] {
    let errors = []

    let missingResult = findMissingPatterns(tokenTypes)
    errors = errors.concat(missingResult.errors)

    let invalidResult = findInvalidPatterns(missingResult.valid)
    let validTokenTypes = invalidResult.valid
    errors = errors.concat(invalidResult.errors)

    errors = errors.concat(validateRegExpPattern(validTokenTypes))

    errors = errors.concat(findInvalidGroupType(validTokenTypes))

    errors = errors.concat(
        findModesThatDoNotExist(validTokenTypes, validModesNames)
    )

    errors = errors.concat(findUnreachablePatterns(validTokenTypes))

    return errors
}

function validateRegExpPattern(
    tokenTypes: TokenType[]
): ILexerDefinitionError[] {
    let errors = []
    let withRegExpPatterns = filter(tokenTypes, currTokType =>
        isRegExp(currTokType[PATTERN])
    )

    errors = errors.concat(findEndOfInputAnchor(withRegExpPatterns))

    errors = errors.concat(findStartOfInputAnchor(withRegExpPatterns))

    errors = errors.concat(findUnsupportedFlags(withRegExpPatterns))

    errors = errors.concat(findDuplicatePatterns(withRegExpPatterns))

    errors = errors.concat(findEmptyMatchRegExps(withRegExpPatterns))

    return errors
}

export interface ILexerFilterResult {
    errors: ILexerDefinitionError[]
    valid: TokenType[]
}

export function findMissingPatterns(
    tokenTypes: TokenType[]
): ILexerFilterResult {
    let tokenTypesWithMissingPattern = filter(tokenTypes, currType => {
        return !has(currType, PATTERN)
    })

    let errors = map(tokenTypesWithMissingPattern, currType => {
        return {
            message:
                "Token Type: ->" +
                tokenName(currType) +
                "<- missing static 'PATTERN' property",
            type: LexerDefinitionErrorType.MISSING_PATTERN,
            tokenTypes: [currType]
        }
    })

    let valid = difference(tokenTypes, tokenTypesWithMissingPattern)
    return { errors, valid }
}

export function findInvalidPatterns(
    tokenTypes: TokenType[]
): ILexerFilterResult {
    let tokenTypesWithInvalidPattern = filter(tokenTypes, currType => {
        let pattern = currType[PATTERN]
        return (
            !isRegExp(pattern) &&
            !isFunction(pattern) &&
            !has(pattern, "exec") &&
            !isString(pattern)
        )
    })

    let errors = map(tokenTypesWithInvalidPattern, currType => {
        return {
            message:
                "Token Type: ->" +
                tokenName(currType) +
                "<- static 'PATTERN' can only be a RegExp, a" +
                " Function matching the {CustomPatternMatcherFunc} type or an Object matching the {ICustomPattern} interface.",
            type: LexerDefinitionErrorType.INVALID_PATTERN,
            tokenTypes: [currType]
        }
    })

    let valid = difference(tokenTypes, tokenTypesWithInvalidPattern)
    return { errors, valid }
}

const end_of_input = /[^\\][\$]/

export function findEndOfInputAnchor(
    tokenTypes: TokenType[]
): ILexerDefinitionError[] {
    let invalidRegex = filter(tokenTypes, currType => {
        let pattern = currType[PATTERN]
        return end_of_input.test(pattern.source)
    })

    let errors = map(invalidRegex, currType => {
        return {
            message:
                "Unexpected RegExp Anchor Error:\n" +
                "\tToken Type: ->" +
                tokenName(currType) +
                "<- static 'PATTERN' cannot contain end of input anchor '$'\n" +
                "\tSee https://github.com/SAP/chevrotain/blob/master/docs/resolving_lexer_errors.md#ANCHORS \n" +
                "\tfor details.",
            type: LexerDefinitionErrorType.EOI_ANCHOR_FOUND,
            tokenTypes: [currType]
        }
    })

    return errors
}

export function findEmptyMatchRegExps(
    tokenTypes: TokenType[]
): ILexerDefinitionError[] {
    let matchesEmptyString = filter(tokenTypes, currType => {
        let pattern = currType[PATTERN]
        return pattern.test("")
    })

    let errors = map(matchesEmptyString, currType => {
        return {
            message:
                "Token Type: ->" +
                tokenName(currType) +
                "<- static 'PATTERN' must not match an empty string",
            type: LexerDefinitionErrorType.EMPTY_MATCH_PATTERN,
            tokenTypes: [currType]
        }
    })

    return errors
}

const start_of_input = /[^\\[][\^]|^\^/

export function findStartOfInputAnchor(
    tokenTypes: TokenType[]
): ILexerDefinitionError[] {
    let invalidRegex = filter(tokenTypes, currType => {
        let pattern = currType[PATTERN]
        return start_of_input.test(pattern.source)
    })

    let errors = map(invalidRegex, currType => {
        return {
            message:
                "Unexpected RegExp Anchor Error:\n" +
                "\tToken Type: ->" +
                tokenName(currType) +
                "<- static 'PATTERN' cannot contain start of input anchor '^'\n" +
                "\tSee https://github.com/SAP/chevrotain/blob/master/docs/resolving_lexer_errors.md#ANCHORS\n" +
                "\tfor details.",
            type: LexerDefinitionErrorType.SOI_ANCHOR_FOUND,
            tokenTypes: [currType]
        }
    })

    return errors
}

export function findUnsupportedFlags(
    tokenTypes: TokenType[]
): ILexerDefinitionError[] {
    let invalidFlags = filter(tokenTypes, currType => {
        let pattern = currType[PATTERN]
        return (
            pattern instanceof RegExp && (pattern.multiline || pattern.global)
        )
    })

    let errors = map(invalidFlags, currType => {
        return {
            message:
                "Token Type: ->" +
                tokenName(currType) +
                "<- static 'PATTERN' may NOT contain global('g') or multiline('m')",
            type: LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND,
            tokenTypes: [currType]
        }
    })

    return errors
}

// This can only test for identical duplicate RegExps, not semantically equivalent ones.
export function findDuplicatePatterns(
    tokenTypes: TokenType[]
): ILexerDefinitionError[] {
    let found = []
    let identicalPatterns = map(tokenTypes, (outerType: any) => {
        return reduce(
            tokenTypes,
            (result, innerType: any) => {
                if (
                    outerType.PATTERN.source === innerType.PATTERN.source &&
                    !contains(found, innerType) &&
                    innerType.PATTERN !== Lexer.NA
                ) {
                    // this avoids duplicates in the result, each Token Type may only appear in one "set"
                    // in essence we are creating Equivalence classes on equality relation.
                    found.push(innerType)
                    result.push(innerType)
                    return result
                }
                return result
            },
            []
        )
    })

    identicalPatterns = compact(identicalPatterns)

    let duplicatePatterns = filter(identicalPatterns, currIdenticalSet => {
        return currIdenticalSet.length > 1
    })

    let errors = map(duplicatePatterns, (setOfIdentical: any) => {
        let tokenTypeNames = map(setOfIdentical, (currType: any) => {
            return tokenName(currType)
        })

        let dupPatternSrc = (<any>first(setOfIdentical)).PATTERN
        return {
            message:
                `The same RegExp pattern ->${dupPatternSrc}<-` +
                `has been used in all of the following Token Types: ${tokenTypeNames.join(
                    ", "
                )} <-`,
            type: LexerDefinitionErrorType.DUPLICATE_PATTERNS_FOUND,
            tokenTypes: setOfIdentical
        }
    })

    return errors
}

export function findInvalidGroupType(
    tokenTypes: TokenType[]
): ILexerDefinitionError[] {
    let invalidTypes = filter(tokenTypes, (clazz: any) => {
        if (!has(clazz, "GROUP")) {
            return false
        }
        let group = clazz.GROUP

        return group !== Lexer.SKIPPED && group !== Lexer.NA && !isString(group)
    })

    let errors = map(invalidTypes, currType => {
        return {
            message:
                "Token Type: ->" +
                tokenName(currType) +
                "<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String",
            type: LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND,
            tokenTypes: [currType]
        }
    })

    return errors
}

export function findModesThatDoNotExist(
    tokenTypes: TokenType[],
    validModes: string[]
): ILexerDefinitionError[] {
    let invalidModes = filter(tokenTypes, (clazz: any) => {
        return (
            clazz.PUSH_MODE !== undefined &&
            !contains(validModes, clazz.PUSH_MODE)
        )
    })

    let errors = map(invalidModes, clazz => {
        let msg =
            `Token Type: ->${tokenName(
                clazz
            )}<- static 'PUSH_MODE' value cannot refer to a Lexer Mode ->${clazz.PUSH_MODE}<-` +
            `which does not exist`
        return {
            message: msg,
            type: LexerDefinitionErrorType.PUSH_MODE_DOES_NOT_EXIST,
            tokenTypes: [clazz]
        }
    })

    return errors
}

export function findUnreachablePatterns(
    tokenTypes: TokenType[]
): ILexerDefinitionError[] {
    const errors = []

    const canBeTested = reduce(
        tokenTypes,
        (result, tokType, idx) => {
            const pattern = tokType.PATTERN

            if (pattern === Lexer.NA) {
                return result
            }

            // a more comprehensive validation for all forms of regExps would require
            // deeper regExp analysis capabilities
            if (isString(pattern)) {
                result.push({ str: pattern, idx, tokenType: tokType })
            } else if (isRegExp(pattern) && noMetaChar(pattern)) {
                result.push({ str: pattern.source, idx, tokenType: tokType })
            }
            return result
        },
        []
    )

    forEach(tokenTypes, (tokType, testIdx) => {
        forEach(canBeTested, ({ str, idx, tokenType }) => {
            if (testIdx < idx && testTokenType(str, tokType.PATTERN)) {
                let msg =
                    `Token: ->${tokenName(
                        tokenType
                    )}<- can never be matched.\n` +
                    `Because it appears AFTER the Token Type ->${tokenName(
                        tokType
                    )}<-` +
                    `in the lexer's definition.\n` +
                    `See https://github.com/SAP/chevrotain/blob/master/docs/resolving_lexer_errors.md#UNREACHABLE`
                errors.push({
                    message: msg,
                    type: LexerDefinitionErrorType.UNREACHABLE_PATTERN,
                    tokenTypes: [tokType, tokenType]
                })
            }
        })
    })

    return errors
}

function testTokenType(str: string, pattern: any): boolean {
    if (isRegExp(pattern)) {
        const regExpArray = pattern.exec(str)
        return regExpArray !== null && regExpArray.index === 0
    } else if (isFunction(pattern)) {
        // maintain the API of custom patterns
        return pattern(str, 0, [], {})
    } else if (has(pattern, "exec")) {
        // maintain the API of custom patterns
        return pattern.exec(str, 0, [], {})
    } else if (typeof pattern === "string") {
        return pattern === str
    } else {
        /* istanbul ignore next */
        throw Error("non exhaustive match")
    }
}

function noMetaChar(regExp: RegExp): boolean {
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
    const metaChars = [
        ".",
        "\\",
        "[",
        "]",
        "|",
        "^",
        "$",
        "(",
        ")",
        "?",
        "*",
        "+",
        "{"
    ]
    return (
        find(metaChars, char => regExp.source.indexOf(char) !== -1) ===
        undefined
    )
}

export function addStartOfInput(pattern: RegExp): RegExp {
    let flags = pattern.ignoreCase ? "i" : ""
    // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
    // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
    return new RegExp(`^(?:${pattern.source})`, flags)
}

export function addStickyFlag(pattern: RegExp): RegExp {
    let flags = pattern.ignoreCase ? "iy" : "y"
    // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
    // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
    return new RegExp(`${pattern.source}`, flags)
}

export function performRuntimeChecks(
    lexerDefinition: IMultiModeLexerDefinition,
    trackLines: boolean
): ILexerDefinitionError[] {
    let errors = []

    // some run time checks to help the end users.
    if (!has(lexerDefinition, DEFAULT_MODE)) {
        errors.push({
            message:
                "A MultiMode Lexer cannot be initialized without a <" +
                DEFAULT_MODE +
                "> property in its definition\n",
            type: LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE
        })
    }
    if (!has(lexerDefinition, MODES)) {
        errors.push({
            message:
                "A MultiMode Lexer cannot be initialized without a <" +
                MODES +
                "> property in its definition\n",
            type:
                LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY
        })
    }

    if (
        has(lexerDefinition, MODES) &&
        has(lexerDefinition, DEFAULT_MODE) &&
        !has(lexerDefinition.modes, lexerDefinition.defaultMode)
    ) {
        errors.push({
            message:
                `A MultiMode Lexer cannot be initialized with a ${DEFAULT_MODE}: <${lexerDefinition.defaultMode}>` +
                `which does not exist\n`,
            type:
                LexerDefinitionErrorType.MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST
        })
    }

    if (has(lexerDefinition, MODES)) {
        forEach(lexerDefinition.modes, (currModeValue, currModeName) => {
            forEach(currModeValue, (currTokType, currIdx) => {
                if (isUndefined(currTokType)) {
                    errors.push({
                        message:
                            `A Lexer cannot be initialized using an undefined Token Type. Mode:` +
                            `<${currModeName}> at index: <${currIdx}>\n`,
                        type:
                            LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED
                    })
                }
            })
        })
    }

    let allTokenTypes = flatten(
        mapValues(lexerDefinition.modes, tokTypes => tokTypes)
    )
    if (
        trackLines &&
        find(
            allTokenTypes,
            (currTokType: TokenType) => currTokType.LINE_BREAKS
        ) === undefined
    ) {
        errors.push({
            message:
                "No LINE_BREAKS Error:\n" +
                "\tThis Lexer has been defined to track line and column information,\n" +
                "\tyet none of the Token definitions contain a LINE_BREAK flag.\n" +
                "\tSee https://github.com/SAP/chevrotain/blob/master/docs/resolving_lexer_errors.md#LINE_BREAKS \n" +
                "\tfor details.",
            type: LexerDefinitionErrorType.NO_LINE_BREAKS_FLAGS
        })
    }

    return errors
}

export function cloneEmptyGroups(emptyGroups: {
    [groupName: string]: IToken
}): { [groupName: string]: IToken } {
    let clonedResult: any = {}
    let groupKeys = keys(emptyGroups)

    forEach(groupKeys, currKey => {
        let currGroupValue = emptyGroups[currKey]

        /* istanbul ignore else */
        if (isArray(currGroupValue)) {
            clonedResult[currKey] = []
        } else {
            /* istanbul ignore next */
            throw Error("non exhaustive match")
        }
    })

    return clonedResult
}

// TODO: refactor to avoid duplication
export function isCustomPattern(tokenType: any): boolean {
    let pattern = tokenType.PATTERN
    if (isRegExp(pattern)) {
        return false
    } else if (isFunction(pattern)) {
        // CustomPatternMatcherFunc - custom patterns do not require any transformations, only wrapping in a RegExp Like object
        return true
    } else if (has(pattern, "exec")) {
        // ICustomPattern
        return true
    } else if (isString(pattern)) {
        return false
    } else {
        /* istanbul ignore next */
        throw Error("non exhaustive match")
    }
}

export function isShortPattern(pattern: any): number | boolean {
    if (isString(pattern) && pattern.length === 1) {
        return pattern.charCodeAt(0)
    } else {
        return false
    }
}

/**
 * Faster than using a RegExp for default newline detection during lexing.
 */
export const LineTerminatorOptimizedTester: ILineTerminatorsTester = {
    // implements /\n|\r\n?/g.test
    test: function(text) {
        let len = text.length
        for (let i = this.lastIndex; i < len; i++) {
            let c = text.charCodeAt(i)
            if (c === 10) {
                this.lastIndex = i + 1
                return true
            } else if (c === 13) {
                if (text.charCodeAt(i + 1) === 10) {
                    this.lastIndex = i + 2
                } else {
                    this.lastIndex = i + 1
                }
                return true
            }
        }
        return false
    },

    lastIndex: 0
}
