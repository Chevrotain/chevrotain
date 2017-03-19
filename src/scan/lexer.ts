import {ISimpleTokenOrIToken, Token, tokenName} from "./tokens_public"
import {
    ILexerDefinitionError,
    IMultiModeLexerDefinition,
    IRegExpExec,
    Lexer,
    LexerDefinitionErrorType,
    TokenConstructor
} from "./lexer_public"
import {
    compact,
    contains,
    difference,
    every,
    filter,
    first,
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
    reduce,
    reject,
    some,
    uniq
} from "../utils/utils"
import {isLazyTokenType, isSimpleTokenType} from "./tokens"

const PATTERN = "PATTERN"
export const DEFAULT_MODE = "defaultMode"
export const MODES = "modes"

export interface IAnalyzeResult {
    allPatterns:IRegExpExec[]
    patternIdxToClass:Function[]
    patternIdxToGroup:any[]
    patternIdxToLongerAltIdx:number[]
    patternIdxToCanLineTerminator:boolean[]
    patternIdxToIsCustom:boolean[]
    patternIdxToPushMode:string[]
    patternIdxToPopMode:boolean[]
    emptyGroups:{ [groupName:string]:Token[] }
}

const CONTAINS_LINE_TERMINATOR = "containsLineTerminator"

export let SUPPORT_STICKY = typeof (<any>new RegExp("(?:)")).sticky === "boolean"

export function disableSticky() {
    SUPPORT_STICKY = false
}

export function enableSticky() {
    SUPPORT_STICKY = true
}

export function analyzeTokenClasses(tokenClasses:TokenConstructor[], useSticky:boolean = SUPPORT_STICKY):IAnalyzeResult {

    let onlyRelevantClasses = reject(tokenClasses, (currClass) => {
        return currClass[PATTERN] === Lexer.NA
    })

    let allTransformedPatterns = map(onlyRelevantClasses, (currClass) => {
        let currPattern = currClass[PATTERN]

        if (isRegExp(currPattern)) {
            return useSticky ?
                addStickyFlag(currPattern) :
                addStartOfInput(currPattern)
        }
        // CustomPatternMatcherFunc - custom patterns do not require any transformations, only wrapping in a RegExp Like object
        else if (isFunction(currPattern)) {
            return {exec: currPattern}
        }
        // ICustomPattern
        else if (has(currPattern, "exec")) {
            return currPattern
        }
        else {
            throw Error("non exhaustive match")
        }

    })

    let patternIdxToClass = onlyRelevantClasses

    let patternIdxToGroup = map(onlyRelevantClasses, (clazz:any) => {
        let groupName = clazz.GROUP
        if (groupName === Lexer.SKIPPED) {
            return undefined
        }
        else if (isString(groupName)) {
            return groupName
        }
        else if (isUndefined(groupName)) {
            return false
        }
        else {
            throw Error("non exhaustive match")
        }
    })

    let patternIdxToLongerAltIdx:any = map(onlyRelevantClasses, (clazz:any) => {
        let longerAltClass = clazz.LONGER_ALT

        if (longerAltClass) {
            let longerAltIdx = indexOf(onlyRelevantClasses, longerAltClass)
            return longerAltIdx
        }
    })

    let patternIdxToPushMode = map(onlyRelevantClasses, (clazz:any) => clazz.PUSH_MODE)

    let patternIdxToPopMode = map(onlyRelevantClasses, (clazz:any) => has(clazz, "POP_MODE"))

    let patternIdxToCanLineTerminator = map(allTransformedPatterns, (pattern:RegExp) => {
        if (isRegExp(pattern)) {
            // TODO: unicode escapes of line terminators too?
            return /\\n|\\r|\\s/g.test(pattern.source)
        }
        else {
            if (has(pattern, CONTAINS_LINE_TERMINATOR)) {
                return pattern[CONTAINS_LINE_TERMINATOR]
            }
            return false
        }
    })

    let patternIdxToIsCustom = map(onlyRelevantClasses, isCustomPattern)

    let emptyGroups = reduce(onlyRelevantClasses, (acc, clazz:any) => {
        let groupName = clazz.GROUP
        if (isString(groupName) && !(groupName === Lexer.SKIPPED)) {
            acc[groupName] = []
        }
        return acc
    }, {})

    return {
        allPatterns:                   allTransformedPatterns,
        patternIdxToClass:             patternIdxToClass,
        patternIdxToGroup:             patternIdxToGroup,
        patternIdxToLongerAltIdx:      patternIdxToLongerAltIdx,
        patternIdxToCanLineTerminator: patternIdxToCanLineTerminator,
        patternIdxToIsCustom:          patternIdxToIsCustom,
        patternIdxToPushMode:          patternIdxToPushMode,
        patternIdxToPopMode:           patternIdxToPopMode,
        emptyGroups:                   emptyGroups
    }
}

export function validatePatterns(tokenClasses:TokenConstructor[], validModesNames:string[]):ILexerDefinitionError[] {
    let errors = []

    let missingResult = findMissingPatterns(tokenClasses)
    errors = errors.concat(missingResult.errors)

    let invalidResult = findInvalidPatterns(missingResult.valid)
    let validTokenClasses = invalidResult.valid
    errors = errors.concat(invalidResult.errors)

    errors = errors.concat(validateRegExpPattern(validTokenClasses))

    errors = errors.concat(findInvalidGroupType(validTokenClasses))

    errors = errors.concat(findModesThatDoNotExist(validTokenClasses, validModesNames))

    return errors
}

function validateRegExpPattern(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
    let errors = []
    let withRegExpPatterns = filter(tokenClasses, (currTokClass) => isRegExp(currTokClass[PATTERN]))

    errors = errors.concat(findEndOfInputAnchor(withRegExpPatterns))

    errors = errors.concat(findStartOfInputAnchor(withRegExpPatterns))

    errors = errors.concat(findUnsupportedFlags(withRegExpPatterns))

    errors = errors.concat(findDuplicatePatterns(withRegExpPatterns))

    return errors
}

export interface ILexerFilterResult {
    errors:ILexerDefinitionError[]
    valid:TokenConstructor[]
}

export function findMissingPatterns(tokenClasses:TokenConstructor[]):ILexerFilterResult {
    let tokenClassesWithMissingPattern = filter(tokenClasses, (currClass) => {
        return !has(currClass, PATTERN)
    })

    let errors = map(tokenClassesWithMissingPattern, (currClass) => {
        return {
            message:      "Token class: ->" + tokenName(currClass) + "<- missing static 'PATTERN' property",
            type:         LexerDefinitionErrorType.MISSING_PATTERN,
            tokenClasses: [currClass]
        }
    })

    let valid = difference(tokenClasses, tokenClassesWithMissingPattern)
    return {errors, valid}
}

export function findInvalidPatterns(tokenClasses:TokenConstructor[]):ILexerFilterResult {
    let tokenClassesWithInvalidPattern = filter(tokenClasses, (currClass) => {
        let pattern = currClass[PATTERN]
        return !isRegExp(pattern) && !isFunction(pattern) && !has(pattern, "exec")
    })

    let errors = map(tokenClassesWithInvalidPattern, (currClass) => {
        return {
            message:      "Token class: ->" + tokenName(currClass) + "<- static 'PATTERN' can only be a RegExp, a" +
                          " Function matching the {CustomPatternMatcherFunc} type or an Object matching the {ICustomPattern} interface.",
            type:         LexerDefinitionErrorType.INVALID_PATTERN,
            tokenClasses: [currClass]
        }
    })

    let valid = difference(tokenClasses, tokenClassesWithInvalidPattern)
    return {errors, valid}
}

const end_of_input = /[^\\][\$]/

export function findEndOfInputAnchor(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
    let invalidRegex = filter(tokenClasses, (currClass) => {
        let pattern = currClass[PATTERN]
        return end_of_input.test(pattern.source)
    })

    let errors = map(invalidRegex, (currClass) => {
        return {
            message:      "Token class: ->" + tokenName(currClass) + "<- static 'PATTERN' cannot contain end of input anchor '$'",
            type:         LexerDefinitionErrorType.EOI_ANCHOR_FOUND,
            tokenClasses: [currClass]
        }
    })

    return errors
}

const start_of_input = /[^\\[][\^]|^\^/

export function findStartOfInputAnchor(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
    let invalidRegex = filter(tokenClasses, (currClass) => {
        let pattern = currClass[PATTERN]
        return start_of_input.test(pattern.source)
    })

    let errors = map(invalidRegex, (currClass) => {
        return {
            message:      "Token class: ->" + tokenName(currClass) + "<- static 'PATTERN' cannot contain start of input anchor '^'",
            type:         LexerDefinitionErrorType.SOI_ANCHOR_FOUND,
            tokenClasses: [currClass]
        }
    })

    return errors
}

export function findUnsupportedFlags(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
    let invalidFlags = filter(tokenClasses, (currClass) => {
        let pattern = currClass[PATTERN]
        return pattern instanceof RegExp && (pattern.multiline || pattern.global)
    })

    let errors = map(invalidFlags, (currClass) => {
        return {
            message:      "Token class: ->" + tokenName(currClass) +
                          "<- static 'PATTERN' may NOT contain global('g') or multiline('m')",
            type:         LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND,
            tokenClasses: [currClass]
        }
    })

    return errors
}

// This can only test for identical duplicate RegExps, not semantically equivalent ones.
export function findDuplicatePatterns(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {

    let found = []
    let identicalPatterns = map(tokenClasses, (outerClass:any) => {
        return reduce(tokenClasses, (result, innerClass:any) => {
            if ((outerClass.PATTERN.source === innerClass.PATTERN.source) && !contains(found, innerClass) &&
                innerClass.PATTERN !== Lexer.NA) {
                // this avoids duplicates in the result, each class may only appear in one "set"
                // in essence we are creating Equivalence classes on equality relation.
                found.push(innerClass)
                result.push(innerClass)
                return result
            }
            return result
        }, [])
    })

    identicalPatterns = compact(identicalPatterns)

    let duplicatePatterns = filter(identicalPatterns, (currIdenticalSet) => {
        return currIdenticalSet.length > 1
    })

    let errors = map(duplicatePatterns, (setOfIdentical:any) => {
        let classNames = map(setOfIdentical, (currClass:any) => {
            return tokenName(currClass)
        })

        let dupPatternSrc = (<any>first(setOfIdentical)).PATTERN
        return {
            message:      `The same RegExp pattern ->${dupPatternSrc}<-` +
                          `has been used in all the following classes: ${classNames.join(", ")} <-`,
            type:         LexerDefinitionErrorType.DUPLICATE_PATTERNS_FOUND,
            tokenClasses: setOfIdentical
        }
    })

    return errors
}

export function findInvalidGroupType(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
    let invalidTypes = filter(tokenClasses, (clazz:any) => {
        if (!has(clazz, "GROUP")) {
            return false
        }
        let group = clazz.GROUP

        return group !== Lexer.SKIPPED &&
            group !== Lexer.NA && !isString(group)
    })

    let errors = map(invalidTypes, (currClass) => {
        return {
            message:      "Token class: ->" + tokenName(currClass) + "<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String",
            type:         LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND,
            tokenClasses: [currClass]
        }
    })

    return errors
}

export function findModesThatDoNotExist(tokenClasses:TokenConstructor[], validModes:string[]):ILexerDefinitionError[] {
    let invalidModes = filter(tokenClasses, (clazz:any) => {
        return clazz.PUSH_MODE !== undefined && !contains(validModes, clazz.PUSH_MODE)
    })

    let errors = map(invalidModes, (clazz) => {
        let msg = `Token class: ->${tokenName(clazz)}<- static 'PUSH_MODE' value cannot refer to a Lexer Mode ->${clazz.PUSH_MODE}<-` +
            `which does not exist`
        return {
            message:      msg,
            type:         LexerDefinitionErrorType.PUSH_MODE_DOES_NOT_EXIST,
            tokenClasses: [clazz]
        }
    })

    return errors
}

export function addStartOfInput(pattern:RegExp):RegExp {
    let flags = pattern.ignoreCase ?
        "i" :
        ""
    // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
    // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
    return new RegExp(`^(?:${pattern.source})`, flags)
}

export function addStickyFlag(pattern:RegExp):RegExp {
    let flags = pattern.ignoreCase ?
        "iy" :
        "y"
    // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
    // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
    return new RegExp(`${pattern.source}`, flags)
}

export function countLineTerminators(text:string):number {
    let lineTerminators = 0
    let currOffset = 0

    while (currOffset < text.length) {
        let c = text.charCodeAt(currOffset)
        if (c === 10) { // "\n"
            lineTerminators++
        }
        else if (c === 13) { // \r
            if (currOffset !== text.length - 1 &&
                text.charCodeAt(currOffset + 1) === 10) { // "\n"
            }
            else {
                lineTerminators++
            }
        }

        currOffset++
    }

    return lineTerminators
}

export function performRuntimeChecks(lexerDefinition:IMultiModeLexerDefinition):ILexerDefinitionError[] {

    let errors = []

    // some run time checks to help the end users.
    if (!has(lexerDefinition, DEFAULT_MODE)) {
        errors.push({
            message: "A MultiMode Lexer cannot be initialized without a <" + DEFAULT_MODE + "> property in its definition\n",
            type:    LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE
        })
    }
    if (!has(lexerDefinition, MODES)) {
        errors.push({
            message: "A MultiMode Lexer cannot be initialized without a <" + MODES + "> property in its definition\n",
            type:    LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY
        })
    }

    if (has(lexerDefinition, MODES) &&
        has(lexerDefinition, DEFAULT_MODE) && !has(lexerDefinition.modes, lexerDefinition.defaultMode)) {
        errors.push({
            message: `A MultiMode Lexer cannot be initialized with a ${DEFAULT_MODE}: <${lexerDefinition.defaultMode}>`
                     + `which does not exist\n`,
            type:    LexerDefinitionErrorType.MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST
        })
    }

    if (has(lexerDefinition, MODES)) {
        forEach(lexerDefinition.modes, (currModeValue, currModeName) => {
            forEach(currModeValue, (currTokClass, currIdx) => {
                if (isUndefined(currTokClass)) {
                    errors.push({
                        message: `A Lexer cannot be initialized using an undefined Token Class. Mode:` +
                                 `<${currModeName}> at index: <${currIdx}>\n`,
                        type:    LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED
                    })
                }
            })
        })
    }

    return errors
}

export interface LazyCheckResult {
    isLazy:boolean
    errors:ILexerDefinitionError[]
}

export function checkLazyMode(allTokenTypes:TokenConstructor[]):LazyCheckResult {
    let errors = []
    let allTokensTypeSet = uniq(allTokenTypes, (currTokType) => tokenName(currTokType))

    let areAllLazy = every(allTokensTypeSet, (currTokType) => isLazyTokenType(currTokType))
    // TODO: why is this second check required?
    let areAllNotLazy = every(allTokensTypeSet, (currTokType) => !isLazyTokenType(currTokType))

    if (!areAllLazy && !areAllNotLazy) {

        let lazyTokens = filter(allTokensTypeSet, (currTokType) => isLazyTokenType(currTokType))
        let lazyTokensNames = map(lazyTokens, tokenName)
        let lazyTokensString = lazyTokensNames.join("\n\t")
        let notLazyTokens = filter(allTokensTypeSet, (currTokType) => !isLazyTokenType(currTokType))
        let notLazyTokensNames = map(notLazyTokens, tokenName)
        let notLazyTokensString = notLazyTokensNames.join("\n\t")

        errors.push({
            message: `A Lexer cannot be defined using a mix of both Lazy and Non-Lazy Tokens:\n` +
                     `Lazy Tokens:\n\t` +
                     lazyTokensString +
                     `\nNon-Lazy Tokens:\n\t` +
                     notLazyTokensString,
            type:    LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_MIX_LAZY_AND_NOT_LAZY
        })
    }

    return {
        isLazy: areAllLazy,
        errors: errors
    }
}

export interface SimpleCheckResult {
    isSimple:boolean
    errors:ILexerDefinitionError[]
}

export function checkSimpleMode(allTokenTypes:TokenConstructor[]):SimpleCheckResult {
    let errors = []
    let allTokensTypeSet = uniq(allTokenTypes, (currTokType) => tokenName(currTokType))

    let areAllSimple = every(allTokensTypeSet, (currTokType) => isSimpleTokenType(currTokType))
    // TODO: why is the second check required?
    let areAllNotSimple = every(allTokensTypeSet, (currTokType) => !isSimpleTokenType(currTokType))

    if (!areAllSimple && !areAllNotSimple) {

        let simpleTokens = filter(allTokensTypeSet, (currTokType) => isSimpleTokenType(currTokType))
        let simpleTokensNames = map(simpleTokens, tokenName)
        let simpleTokensString = simpleTokensNames.join("\n\t")
        let notSimpleTokens = filter(allTokensTypeSet, (currTokType) => !isSimpleTokenType(currTokType))
        let notSimpleTokensNames = map(notSimpleTokens, tokenName)
        let notSimpleTokensString = notSimpleTokensNames.join("\n\t")

        errors.push({
            message: `A Lexer cannot be defined using a mix of both Simple and Non-Simple Tokens:\n` +
                     `Simple Tokens:\n\t` +
                     simpleTokensString +
                     `\nNon-Simple Tokens:\n\t` +
                     notSimpleTokensString,
            type:    LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_MIX_SIMPLE_AND_NOT_SIMPLE
        })
    }

    return {
        isSimple: areAllSimple,
        errors:   errors
    }
}

export function checkFastMode(allTokenTypes:TokenConstructor[]):boolean {
    let noLongerALTs = every(allTokenTypes, (currTokType) => currTokType.LONGER_ALT === undefined)
    let noModes = every(allTokenTypes, (currTokType) => currTokType.POP_MODE === undefined && currTokType.PUSH_MODE === undefined)

    return noLongerALTs && noModes
}

export function checkHasCustomTokenPatterns(allTokenTypes:TokenConstructor[]):boolean {
    return some(allTokenTypes, (currTokType) => {
        let pattern = currTokType.PATTERN
        return (!isRegExp(currTokType.PATTERN) && (isFunction(pattern) || has(pattern, "exec")))
    })
}

export function cloneEmptyGroups(emptyGroups:{ [groupName:string]:ISimpleTokenOrIToken }):{ [groupName:string]:ISimpleTokenOrIToken } {
    let clonedResult:any = {}
    let groupKeys = keys(emptyGroups)

    forEach(groupKeys, (currKey) => {
        let currGroupValue = emptyGroups[currKey]

        /* istanbul ignore else */
        if (isArray(currGroupValue)) {
            clonedResult[currKey] = []
        }
        else {
            throw Error("non exhaustive match")
        }
    })

    return clonedResult
}

// TODO: refactor to avoid duplication
export function isCustomPattern(tokenType:any):boolean {
    let pattern = tokenType.PATTERN
    if (isRegExp(pattern)) {
        return false
    }
    // CustomPatternMatcherFunc - custom patterns do not require any transformations, only wrapping in a RegExp Like object
    else if (isFunction(pattern)) {
        return true
    }
    // ICustomPattern
    else if (has(pattern, "exec")) {
        return true
    }
    else {
        throw Error("non exhaustive match")
    }
}
