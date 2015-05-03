/// <reference path="../lang/lang_extensions.ts" />
/// <reference path="../scan/tokens.ts" />

module chevrotain.lexer {

    import tok = chevrotain.tokens

    var PATTERN = "PATTERN"
    var IGNORE = "IGNORE"
    export var NA = /NOT_APPLICIABLE/

    export interface ILexingResult {
        tokens:tok.Token[]
        ignored:tok.Token[]
        errors:string[]
    }

    export type TokenConstructor = Function

    /**
     * A RegExp lexer meant to be used for quick prototyping and/or simple grammars.
     * This is NOT meant to be used in commercial compilers/tooling.
     * concerns such as performance/extendability/modularity are ignored in this implementation.
     *
     */
    export class SimpleLexer {

        protected matchPatterns:RegExp[]
        protected ignorePatterns:RegExp[]
        protected allPatterns:RegExp[]
        protected patternToClass = {}

        /**
         * @param {Function[]} tokenClasses constructor functions for the Tokens types this scanner will support
         *                     These constructors must be in one of three forms:
         *
         *  1. With a PATTERN property that has a RegExp value for tokens to match:
         *     example: -->class Integer extends tok.Token { static PATTERN = /[1-9]\d }<--
         *
         *  2. With a PATTERN property that has a RegExp value AND an IGNORE property with boolean value true.
         *     These tokens will be matched but not as part of the main token vector.
         *     this is usually used for ignoring whitespace/comments
         *     example: -->    class Whitespace extends tok.Token { static PATTERN = /(\t| )/; static IGNORE = true}<--
         *
         *  3. With a PATTERN property that has the value of the var NA define in this module.
         *     This is a convenience form used to avoid matching Token classes that only act as categories.
         *     example: -->class Keyword extends tok.Token { static PATTERN = NA }<--
         *
         *
         *   The following RegExp patterns are not supported:
         *   a. '$' for match at end of input
         *   b. /b global flag
         *   c. /m multi-line flag
         *
         *   The Lexer will try to locate the longest match each time. if two patterns both match and with the same match length
         *   The pattern defined first will "win". for example: if an Identifier's pattern is /\w+/ and we also have keywords such
         *   as /while/ /for/ ... the Identifier constructor must appear AFTER all keywords constructors in the 'tokenClasses' arg.
         *
         */
        constructor(protected tokenClasses:TokenConstructor[]) {
            validatePatterns(tokenClasses)
            var analyzeResult = analyzeTokenClasses(tokenClasses)
            this.matchPatterns = analyzeResult.matchPatterns
            this.ignorePatterns = analyzeResult.ignorePatterns
            this.patternToClass = analyzeResult.patternToClass
            this.allPatterns = this.ignorePatterns.concat(this.matchPatterns)
        }

        /**
         * Will lex(Tokenize) a string.
         * Note that this can be called repeatedly on different strings as this method
         * does not modify the state of the Lexer.
         *
         * @param {string} text the string to lex
         * @returns {{tokens: {Token}[], ignored: {Token}[], errors: string[]}}
         */
        public tokenize(text:string):ILexingResult {
            var orgInput = text
            var offset = 0
            var offSetToLC = buildOffsetToLineColumnDict(text)

            function addLineColumnInfoTo(token:tok.Token):tok.Token {
                var lc:any = offSetToLC[offset]
                token.startLine = lc.line
                token.startColumn = lc.column
                return token
            }

            var ignoredTokens = []
            var matchedTokens = []
            var errors = []
            var matchedIgnore = true

            while (text.length > 0) {

                while (matchedIgnore) {
                    var oneIgnoreResult = tokenizeOne(text, offset, this.ignorePatterns, this.patternToClass)
                    if (oneIgnoreResult !== NOTHING_CONSUMED()) {
                        ignoredTokens.push(addLineColumnInfoTo(oneIgnoreResult.token))
                        text = oneIgnoreResult.remainingInput
                        offset = oneIgnoreResult.offset
                    }
                    else {
                        matchedIgnore = false
                    }
                }

                var oneMatchResult = tokenizeOne(text, offset, this.matchPatterns, this.patternToClass)
                if (oneMatchResult !== NOTHING_CONSUMED()) {
                    matchedTokens.push(addLineColumnInfoTo(oneMatchResult.token))
                    text = oneMatchResult.remainingInput
                    offset = oneMatchResult.offset
                }
                else {
                    var errorStart = offset
                    var foundResyncPoint = false
                    while (!foundResyncPoint && text.length > 0) {
                        // drop chars until we can match something
                        text = text.substr(1)
                        offset++
                        var res = tokenizeOne(text, offset, this.allPatterns, this.patternToClass)
                        if (res !== NOTHING_CONSUMED()) {
                            foundResyncPoint = true
                        }
                    }
                    if (res !== NOTHING_CONSUMED() || text.length === 0) {
                        errors.push(`unexpected character: ->${orgInput.charAt(errorStart)}<- at offset: ${errorStart},` +
                        ` skipped ${offset - errorStart} characters.`)
                    }
                }
                matchedIgnore = true
            }

            return {tokens: matchedTokens, ignored: ignoredTokens, errors: errors}
        }
    }

    export interface IConsumeResult {
        token:tok.Token
        remainingInput:string
        offset:number
    }

    // poor man's const
    var nothing_consumed = {token: undefined, remainingInput: "", offset: -1}
    Object.freeze(nothing_consumed)
    export function NOTHING_CONSUMED():IConsumeResult {
        return nothing_consumed
    }

    export function tokenizeOne(input:string,
                                offset:number,
                                patterns:RegExp[],
                                patternsToConstructor:any):IConsumeResult {
        var matches = _.map(patterns, (pattern) => {
            return pattern.exec(input)
        })

        var maxLength = 0
        var biggestMatchIdx = _.reduce(matches, (maxIdx, possibleMatch, currIdx) => {
            //noinspection JSReferencingMutableVariableFromClosure
            if (_.isArray(possibleMatch) && possibleMatch[0].length > maxLength) {
                maxLength = possibleMatch[0].length
                return currIdx
            }
            return maxIdx
        }, -1)

        if (biggestMatchIdx !== -1) {
            var matchedPattern = patterns[biggestMatchIdx]
            var matchedImage = matches[biggestMatchIdx][0]
            var matchedClass = patternsToConstructor[matchedPattern.toString()]
            var matchedToken = new matchedClass(-1, -1, matchedImage)
            var newInput = input.substr(matchedImage.length)
            var newOffset = offset + matchedImage.length
            return {token: matchedToken, remainingInput: newInput, offset: newOffset}
        }

        return NOTHING_CONSUMED()
    }

    export interface IAnalyzeResult {
        matchPatterns: RegExp[]
        ignorePatterns: RegExp[]
        patternToClass: { [pattern: string] : RegExp }

    }

    export function analyzeTokenClasses(tokenClasses:TokenConstructor[]):IAnalyzeResult {

        var onlyRelevant = _.reject(tokenClasses, (currClass) => {
            return currClass[PATTERN] === NA
        })

        var matchedClasses = _.filter(onlyRelevant, (currClass) => {
            return _.has(currClass, PATTERN) && !_.has(currClass, IGNORE)
        })

        var matchPatterns = _.map(matchedClasses, (currClass) => {
            return addStartOfInput(currClass[PATTERN])
        })

        var ignoredClasses = _.filter(onlyRelevant, (currClass) => {
            return _.has(currClass, PATTERN) && _.has(currClass, IGNORE)
        })

        var ignorePatterns = _.map(ignoredClasses, (currClass) => {
            return addStartOfInput(currClass[PATTERN])
        })

        var matchedPatternsToClass = _.zipObject(<any>matchPatterns, matchedClasses)
        var ignoredPatternsToClass = _.zipObject(<any>ignorePatterns, ignoredClasses)

        var patternToClass:{ [pattern: string] : RegExp } = {}
        _.assign(patternToClass, matchedPatternsToClass)
        _.assign(patternToClass, ignoredPatternsToClass)

        return {matchPatterns: matchPatterns, ignorePatterns: ignorePatterns, patternToClass: patternToClass}
    }

    export function validatePatterns(tokenClasses:TokenConstructor[]) {
        var missingErrors = findMissingPatterns(tokenClasses)
        if (!_.isEmpty(missingErrors)) {
            throw new Error(missingErrors.join("\n ---------------- \n"))
        }

        var invalidPatterns = findInvalidPatterns(tokenClasses)
        if (!_.isEmpty(invalidPatterns)) {
            throw new Error(invalidPatterns.join("\n ---------------- \n"))
        }

        var invalidFlags = findUnsupportedFlags(tokenClasses)
        if (!_.isEmpty(invalidFlags)) {
            throw new Error(invalidFlags.join("\n ---------------- \n"))
        }
    }

    export function findMissingPatterns(tokenClasses:TokenConstructor[]):string[] {
        var noPatternClasses = _.filter(tokenClasses, (currClass) => {
            return !_.has(currClass, PATTERN)
        })

        var errors = _.map(noPatternClasses, (currClass) => {
            return "Token class: ->" + lang.functionName(currClass) + "<- missing static 'PATTERN' property"
        })

        return errors
    }

    export function findInvalidPatterns(tokenClasses:TokenConstructor[]):string[] {
        var invalidRegex = _.filter(tokenClasses, (currClass) => {
            var pattern = currClass[PATTERN]
            return !_.isRegExp(pattern)
        })

        var errors = _.map(invalidRegex, (currClass) => {
            return "Token class: ->" + lang.functionName(currClass) + "<- static 'PATTERN' can only be a RegEx"
        })

        return errors
    }

    export function findUnsupportedFlags(tokenClasses:TokenConstructor[]):string[] {
        var invalidFlags = _.filter(tokenClasses, (currClass) => {
            var pattern = currClass[PATTERN]
            return pattern instanceof RegExp && (pattern.multiline || pattern.global)
        })

        var errors = _.map(invalidFlags, (currClass) => {
            return "Token class: ->" + lang.functionName(currClass) + "<- static 'PATTERN' may NOT contain global('g') or multiline('m')"
        })

        return errors
    }

    // TODO: find duplicate patterns

    export function addStartOfInput(pattern:RegExp):RegExp {
        var flags = pattern.ignoreCase ? "i" : ""
        // always wrapping in a none capturing group preceded by '^' to make sure matching can only work on start of input.
        // duplicate/redundant start of input markers have no meaning (/^^^^A/ === /^A/)
        return new RegExp(`^(?:${pattern.source})`, flags)
    }

    export interface ILineColumn {
        line:number
        column:number
    }

    export type OffsetToLineColumn = ILineColumn[]

    export function buildOffsetToLineColumnDict(text:string):OffsetToLineColumn {
        var offSetToLineColumn = new Array(text.length)
        var column = 1
        var line = 1
        var currOffset = 0

        offSetToLineColumn[currOffset] = {line: line, column: column}

        while (currOffset < text.length - 1) {
            var c = text.charAt(currOffset)
            var c2 = text.charAt(currOffset + 1)
            var nextIsSlashN = c2 === "\n"

            if (c === "\n") {
                line++
                column = 1
            }
            else if (c === "\r" && nextIsSlashN) {
                column++
            }
            else if (c === "\r") {
                line++
                column = 1
            }
            else {
                column++
            }
            currOffset++
            offSetToLineColumn[currOffset] = {line: line, column: column}
        }

        return offSetToLineColumn
    }
}
