// using only root module name ('chevrotain') and not a longer name ('chevrotain.lexer')
// because the external and internal API must have the same names for d.ts definition files to be valid
// TODO: examine module in module to reduce spam on chevrotain namespace
module chevrotain {

    import lang = chevrotain.lang

    var PATTERN = "PATTERN"

    export interface IAnalyzeResult {
        allPatterns: RegExp[]
        patternIdxToClass: Function[]
        patternIdxToGroup : any[]
        patternIdxToLongerAltIdx : number[]
        patternIdxToCanLineTerminator: boolean[]
        emptyGroups: { [groupName: string] : Token }
    }

    export function analyzeTokenClasses(tokenClasses:TokenConstructor[]):IAnalyzeResult {

        var onlyRelevantClasses = _.reject(tokenClasses, (currClass) => {
            return currClass[PATTERN] === Lexer.NA
        })

        var allTransformedPatterns = _.map(onlyRelevantClasses, (currClass) => {
            return addStartOfInput(currClass[PATTERN])
        })

        var allPatternsToClass = _.zipObject(<any>allTransformedPatterns, onlyRelevantClasses)

        var patternIdxToClass:any = _.map(allTransformedPatterns, (pattern) => {
            return allPatternsToClass[pattern.toString()]
        })

        var patternIdxToGroup = _.map(onlyRelevantClasses, (clazz:any) => {
            var groupName = clazz.GROUP
            if (groupName === Lexer.SKIPPED) {
                return undefined
            }
            else if (_.isString(groupName)) {
                return groupName
            }
            else if (_.isUndefined(groupName)) {
                return "default"
            }
            else {
                throw Error("non exhaustive match")
            }
        })

        var patternIdxToLongerAltIdx:any = _.map(onlyRelevantClasses, (clazz:any, idx) => {
            var longerAltClass = clazz.LONGER_ALT

            if (longerAltClass) {
                var longerAltIdx = _.indexOf(onlyRelevantClasses, longerAltClass)
                return longerAltIdx
            }
        })

        var patternIdxToCanLineTerminator = _.map(allTransformedPatterns, (pattern:RegExp) => {
            // TODO: unicode escapes of line terminators too?
            return /\\n|\\r|\\s/g.test(pattern.source)
        })

        var emptyGroups = _.reduce(onlyRelevantClasses, (acc, clazz:any) => {
            var groupName = clazz.GROUP
            if (_.isString(groupName)) {
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
        var errors = []

        var missingResult = findMissingPatterns(tokenClasses)
        var validTokenClasses = missingResult.validTokenClasses
        errors = errors.concat(missingResult.errors)

        var invalidResult = findInvalidPatterns(validTokenClasses)
        validTokenClasses = invalidResult.validTokenClasses
        errors = errors.concat(invalidResult.errors)

        errors = errors.concat(findEndOfInputAnchor(validTokenClasses))

        errors = errors.concat(findUnsupportedFlags(validTokenClasses))

        errors = errors.concat(findDuplicatePatterns(validTokenClasses))

        errors = errors.concat(findInvalidGroupType(validTokenClasses))

        return errors
    }

    export function findMissingPatterns(tokenClasses:TokenConstructor[]) {
        var tokenClassesWithMissingPattern = _.filter(tokenClasses, (currClass) => {
            return !_.has(currClass, PATTERN)
        })

        var errors = _.map(tokenClassesWithMissingPattern, (currClass) => {
            return {
                message:      "Token class: ->" + tokenName(currClass) + "<- missing static 'PATTERN' property",
                type:         LexerDefinitionErrorType.MISSING_PATTERN,
                tokenClasses: [currClass]
            }
        })

        var validTokenClasses = _.difference(tokenClasses, tokenClassesWithMissingPattern)
        return {errors: errors, validTokenClasses}
    }

    export function findInvalidPatterns(tokenClasses:TokenConstructor[]) {
        var tokenClassesWithInvalidPattern = _.filter(tokenClasses, (currClass) => {
            var pattern = currClass[PATTERN]
            return !_.isRegExp(pattern)
        })

        var errors = _.map(tokenClassesWithInvalidPattern, (currClass) => {
            return {
                message:      "Token class: ->" + tokenName(currClass) + "<- static 'PATTERN' can only be a RegExp",
                type:         LexerDefinitionErrorType.INVALID_PATTERN,
                tokenClasses: [currClass]
            }
        })

        var validTokenClasses = _.difference(tokenClasses, tokenClassesWithInvalidPattern)
        return {errors: errors, validTokenClasses}
    }

    var end_of_input = /[^\\][\$]/

    export function findEndOfInputAnchor(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
        var invalidRegex = _.filter(tokenClasses, (currClass) => {
            var pattern = currClass[PATTERN]
            return end_of_input.test(pattern.source)
        })

        var errors = _.map(invalidRegex, (currClass) => {
            return {
                message:      "Token class: ->" + tokenName(currClass) + "<- static 'PATTERN' cannot contain end of input anchor '$'",
                type:         LexerDefinitionErrorType.EOI_ANCHOR_FOUND,
                tokenClasses: [currClass]
            }
        })

        return errors
    }

    export function findUnsupportedFlags(tokenClasses:TokenConstructor[]):ILexerDefinitionError[] {
        var invalidFlags = _.filter(tokenClasses, (currClass) => {
            var pattern = currClass[PATTERN]
            return pattern instanceof RegExp && (pattern.multiline || pattern.global)
        })

        var errors = _.map(invalidFlags, (currClass) => {
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

        var found = []
        var identicalPatterns = _.map(tokenClasses, (outerClass:any) => {
            return _.reduce(tokenClasses, (result, innerClass:any) => {
                if ((outerClass.PATTERN.source === innerClass.PATTERN.source) && !_.contains(found, innerClass) &&
                    innerClass.PATTERN !== Lexer.NA) {
                    // this avoids duplicates in the result, each class may only appear in one "set"
                    // in essence we are creating Equivalence classes on equality relation.
                    found.push(innerClass)
                    return _.union(result, [innerClass])
                }
            }, [])
        })

        identicalPatterns = _.compact(identicalPatterns)

        var duplicatePatterns = _.filter(identicalPatterns, (currIdenticalSet) => {
            return _.size(currIdenticalSet) > 1
        })

        var errors = _.map(duplicatePatterns, (setOfIdentical:any) => {
            var classNames = _.map(setOfIdentical, (currClass:any) => {
                return tokenName(currClass)
            })

            var dupPatternSrc = (<any>_.first(setOfIdentical)).PATTERN
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
        var invalidTypes = _.filter(tokenClasses, (clazz:any) => {
            if (!_.has(clazz, "GROUP")) {
                return false
            }
            var group = clazz.GROUP

            return group !== Lexer.SKIPPED &&
                group !== Lexer.NA && !_.isString(group)
        })

        var errors = _.map(invalidTypes, (currClass) => {
            return {
                message:      "Token class: ->" + tokenName(currClass) + "<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String",
                type:         LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND,
                tokenClasses: [currClass]
            }
        })

        return errors
    }

    export function addStartOfInput(pattern:RegExp):RegExp {
        var flags = pattern.ignoreCase ? "i" : ""
        // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
        // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
        return new RegExp(`^(?:${pattern.source})`, flags)
    }

    export function countLineTerminators(text:string):number {
        var lineTerminators = 0
        var currOffset = 0

        while (currOffset < text.length) {
            var c = text.charCodeAt(currOffset)
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

