import {Token, tokenName} from "./tokens_public"
import {
    TokenConstructor,
    ILexerDefinitionError,
    LexerDefinitionErrorType,
    Lexer,
    IMultiModeLexerDefinition
} from "./lexer_public"
import {
    reject,
    indexOf,
    map,
    zipObject,
    isString,
    isUndefined,
    reduce,
    has,
    filter,
    difference,
    isRegExp,
    compact,
    contains,
    first, forEach
} from "../utils/utils"

const PATTERN = "PATTERN"
export const DEFAULT_MODE = "defaultMode"
export const MODES = "modes"

export interface IAnalyzeResult {
    allPatterns:RegExp[]
    patternIdxToClass:Function[]
    patternIdxToGroup:any[]
    patternIdxToLongerAltIdx:number[]
    patternIdxToCanLineTerminator:boolean[]
    patternIdxToPushMode:string[]
    patternIdxToPopMode:boolean[]
    emptyGroups:{ [groupName:string]:Token[] }
}

export function analyzeTokenClasses(tokenClasses:TokenConstructor[]):IAnalyzeResult {

    let onlyRelevantClasses = reject(tokenClasses, (currClass) => {
        return currClass[PATTERN] === Lexer.NA
    })

    let allTransformedPatterns = map(onlyRelevantClasses, (currClass) => {
        return addStartOfInput(currClass[PATTERN])
    })

    let allPatternsToClass = zipObject(<any>allTransformedPatterns, onlyRelevantClasses)

    let patternIdxToClass:any = map(allTransformedPatterns, (pattern) => {
        return allPatternsToClass[pattern.toString()]
    })

    let patternIdxToGroup = map(onlyRelevantClasses, (clazz:any) => {
        let groupName = clazz.GROUP
        if (groupName === Lexer.SKIPPED) {
            return undefined
        }
        else if (isString(groupName)) {
            return groupName
        }
        else if (isUndefined(groupName)) {
            return "default"
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
        // TODO: unicode escapes of line terminators too?
        return /\\n|\\r|\\s/g.test(pattern.source)
    })

    let emptyGroups = reduce(onlyRelevantClasses, (acc, clazz:any) => {
        let groupName = clazz.GROUP
        if (isString(groupName)) {
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
        patternIdxToPushMode:          patternIdxToPushMode,
        patternIdxToPopMode:           patternIdxToPopMode,
        emptyGroups:                   emptyGroups
    }
}

export function validatePatterns(tokenClasses:TokenConstructor[], validModesNames:string[]):ILexerDefinitionError[] {
    let errors = []

    let missingResult = findMissingPatterns(tokenClasses)
    let validTokenClasses = missingResult.valid
    errors = errors.concat(missingResult.errors)

    let invalidResult = findInvalidPatterns(validTokenClasses)
    validTokenClasses = invalidResult.valid
    errors = errors.concat(invalidResult.errors)

    errors = errors.concat(findEndOfInputAnchor(validTokenClasses))

    errors = errors.concat(findUnsupportedFlags(validTokenClasses))

    errors = errors.concat(findDuplicatePatterns(validTokenClasses))

    errors = errors.concat(findInvalidGroupType(validTokenClasses))

    errors = errors.concat(findModesThatDoNotExist(validTokenClasses, validModesNames))

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
        return !isRegExp(pattern)
    })

    let errors = map(tokenClassesWithInvalidPattern, (currClass) => {
        return {
            message:      "Token class: ->" + tokenName(currClass) + "<- static 'PATTERN' can only be a RegExp",
            type:         LexerDefinitionErrorType.INVALID_PATTERN,
            tokenClasses: [currClass]
        }
    })

    let valid = difference(tokenClasses, tokenClassesWithInvalidPattern)
    return {errors, valid}
}

let end_of_input = /[^\\][\$]/

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

            // lexerDefinition.modes[currModeName] = reject<Function>(currModeValue, (currTokClass) => isUndefined(currTokClass))
        })
    }

    return errors
}
