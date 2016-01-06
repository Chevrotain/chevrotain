// using only root namespace name ('chevrotain') and not a longer name ('chevrotain.lexer')
// because the external and internal API must have the same names for d.ts definition files to be valid
namespace chevrotain {

    import lang = chevrotain.lang

    let PATTERN = "PATTERN"

    export interface IAnalyzeResult {
        allPatterns: RegExp[]
        patternIdxToClass: Function[]
        patternIdxToGroup : any[]
        patternIdxToLongerAltIdx : number[]
        patternIdxToCanLineTerminator: boolean[]
        emptyGroups: { [groupName: string] : Token }
    }

    export function analyzeTokenClasses(tokenClasses:TokenConstructor[]):IAnalyzeResult {

        let onlyRelevantClasses = _.reject(tokenClasses, (currClass) => {
            return currClass[PATTERN] === Lexer.NA
        })

        let allTransformedPatterns = utils.map(onlyRelevantClasses, (currClass) => {
            return addStartOfInput(currClass[PATTERN])
        })

        let allPatternsToClass = _.zipObject(<any>allTransformedPatterns, onlyRelevantClasses)

        let patternIdxToClass:any = utils.map(allTransformedPatterns, (pattern) => {
            return allPatternsToClass[pattern.toString()]
        })

        let patternIdxToGroup = utils.map(onlyRelevantClasses, (clazz:any) => {
            let groupName = clazz.GROUP
            if (groupName === Lexer.SKIPPED) {
                return undefined
            }
            else if (utils.isString(groupName)) {
                return groupName
            }
            else if (utils.isUndefined(groupName)) {
                return "default"
            }
            else {
                throw Error("non exhaustive match")
            }
        })

        let patternIdxToLongerAltIdx:any = utils.map(onlyRelevantClasses, (clazz:any) => {
            let longerAltClass = clazz.LONGER_ALT

            if (longerAltClass) {
                let longerAltIdx = _.indexOf(onlyRelevantClasses, longerAltClass)
                return longerAltIdx
            }
        })

        let patternIdxToCanLineTerminator = utils.map(allTransformedPatterns, (pattern:RegExp) => {
            // TODO: unicode escapes of line terminators too?
            return /\\n|\\r|\\s/g.test(pattern.source)
        })

        let emptyGroups = _.reduce(onlyRelevantClasses, (acc, clazz:any) => {
            let groupName = clazz.GROUP
            if (utils.isString(groupName)) {
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
            emptyGroups:                   emptyGroups
        }
    }

    export function validatePatterns(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
        let errors = []

        let missingResult = findMissingPatterns(tokenClasses)
        let validTokenClasses = missingResult.validTokenClasses
        errors = errors.concat(missingResult.errors)

        let invalidResult = findInvalidPatterns(validTokenClasses)
        validTokenClasses = invalidResult.validTokenClasses
        errors = errors.concat(invalidResult.errors)

        errors = errors.concat(findEndOfInputAnchor(validTokenClasses))

        errors = errors.concat(findUnsupportedFlags(validTokenClasses))

        errors = errors.concat(findDuplicatePatterns(validTokenClasses))

        errors = errors.concat(findInvalidGroupType(validTokenClasses))

        return errors
    }

    export function findMissingPatterns(tokenClasses:TokenConstructor[]) {
        let tokenClassesWithMissingPattern = utils.filter(tokenClasses, (currClass) => {
            return !utils.has(currClass, PATTERN)
        })

        let errors = utils.map(tokenClassesWithMissingPattern, (currClass) => {
            return {
                message:      "Token class: ->" + tokenName(currClass) + "<- missing static 'PATTERN' property",
                type:         LexerDefinitionErrorType.MISSING_PATTERN,
                tokenClasses: [currClass]
            }
        })

        let validTokenClasses = _.difference(tokenClasses, tokenClassesWithMissingPattern)
        return {errors: errors, validTokenClasses}
    }

    export function findInvalidPatterns(tokenClasses:TokenConstructor[]) {
        let tokenClassesWithInvalidPattern = utils.filter(tokenClasses, (currClass) => {
            let pattern = currClass[PATTERN]
            return !_.isRegExp(pattern)
        })

        let errors = utils.map(tokenClassesWithInvalidPattern, (currClass) => {
            return {
                message:      "Token class: ->" + tokenName(currClass) + "<- static 'PATTERN' can only be a RegExp",
                type:         LexerDefinitionErrorType.INVALID_PATTERN,
                tokenClasses: [currClass]
            }
        })

        let validTokenClasses = _.difference(tokenClasses, tokenClassesWithInvalidPattern)
        return {errors: errors, validTokenClasses}
    }

    let end_of_input = /[^\\][\$]/

    export function findEndOfInputAnchor(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
        let invalidRegex = utils.filter(tokenClasses, (currClass) => {
            let pattern = currClass[PATTERN]
            return end_of_input.test(pattern.source)
        })

        let errors = utils.map(invalidRegex, (currClass) => {
            return {
                message:      "Token class: ->" + tokenName(currClass) + "<- static 'PATTERN' cannot contain end of input anchor '$'",
                type:         LexerDefinitionErrorType.EOI_ANCHOR_FOUND,
                tokenClasses: [currClass]
            }
        })

        return errors
    }

    export function findUnsupportedFlags(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
        let invalidFlags = utils.filter(tokenClasses, (currClass) => {
            let pattern = currClass[PATTERN]
            return pattern instanceof RegExp && (pattern.multiline || pattern.global)
        })

        let errors = utils.map(invalidFlags, (currClass) => {
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
        let identicalPatterns = utils.map(tokenClasses, (outerClass:any) => {
            return _.reduce(tokenClasses, (result, innerClass:any) => {
                if ((outerClass.PATTERN.source === innerClass.PATTERN.source) && !utils.contains(found, innerClass) &&
                    innerClass.PATTERN !== Lexer.NA) {
                    // this avoids duplicates in the result, each class may only appear in one "set"
                    // in essence we are creating Equivalence classes on equality relation.
                    found.push(innerClass)
                    return _.union(result, [innerClass])
                }
                return result
            }, [])
        })

        identicalPatterns = _.compact(identicalPatterns)

        let duplicatePatterns = utils.filter(identicalPatterns, (currIdenticalSet) => {
            return currIdenticalSet.length > 1
        })

        let errors = utils.map(duplicatePatterns, (setOfIdentical:any) => {
            let classNames = utils.map(setOfIdentical, (currClass:any) => {
                return tokenName(currClass)
            })

            let dupPatternSrc = (<any>utils.first(setOfIdentical)).PATTERN
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
        let invalidTypes = utils.filter(tokenClasses, (clazz:any) => {
            if (!utils.has(clazz, "GROUP")) {
                return false
            }
            let group = clazz.GROUP

            return group !== Lexer.SKIPPED &&
                group !== Lexer.NA && !utils.isString(group)
        })

        let errors = utils.map(invalidTypes, (currClass) => {
            return {
                message:      "Token class: ->" + tokenName(currClass) + "<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String",
                type:         LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND,
                tokenClasses: [currClass]
            }
        })

        return errors
    }

    export function addStartOfInput(pattern:RegExp):RegExp {
        let flags = pattern.ignoreCase ? "i" : ""
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
}

