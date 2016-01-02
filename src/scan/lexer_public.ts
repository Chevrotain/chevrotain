// using only root namespace name ('chevrotain') and not a longer name ('chevrotain.lexer')
// because the external and internal API must have the same names for d.ts definition files to be valid
namespace chevrotain {

    import lang = chevrotain.lang

    export type TokenConstructor = Function

    export interface ILexingResult {
        tokens:Token[]
        groups:{ [groupName: string] : Token }
        errors:ILexingError[]
    }

    export enum LexerDefinitionErrorType {
        MISSING_PATTERN,
        INVALID_PATTERN,
        EOI_ANCHOR_FOUND,
        UNSUPPORTED_FLAGS_FOUND,
        DUPLICATE_PATTERNS_FOUND,
        INVALID_GROUP_TYPE_FOUND
    }

    export interface ILexerDefinitionError {
        message:string
        type:LexerDefinitionErrorType
        tokenClasses:Function[]
    }

    export interface ILexingError {
        line:number
        column:number
        length:number
        message:string
    }

    export class Lexer {

        public static SKIPPED = {
            description: "This marks a skipped Token pattern, this means each token identified by it will" +
                         "be consumed and then throw into oblivion, this can be used to for example: skip whitespace."
        }

        public static NA = /NOT_APPLICABLE/
        public lexerDefinitionErrors = []

        protected allPatterns:RegExp[]
        protected patternIdxToClass:Function[]
        protected patternIdxToGroup:boolean[]
        protected patternIdxToLongerAltIdx:number[]
        protected patternIdxToCanLineTerminator:boolean[]
        protected emptyGroups:{ [groupName: string] : Token }

        /**
         * @param {Function[]} tokenClasses constructor functions for the Tokens types this scanner will support
         *                     These constructors must be in one of three forms:
         *
         *  1. With a PATTERN property that has a RegExp value for tokens to match:
         *     example: -->class Integer extends Token { static PATTERN = /[1-9]\d }<--
         *
         *  2. With a PATTERN property that has a RegExp value AND an IGNORE property with boolean value true.
         *     These tokens will be matched but not as part of the main token vector.
         *     this is usually used for ignoring whitespace/comments
         *     example: -->    class Whitespace extends Token { static PATTERN = /(\t| )/; static IGNORE = true}<--
         *
         *  3. With a PATTERN property that has the value of the var Lexer.NA defined above.
         *     This is a convenience form used to avoid matching Token classes that only act as categories.
         *     example: -->class Keyword extends Token { static PATTERN = NA }<--
         *
         *
         *   The following RegExp patterns are not supported:
         *   a. '$' for match at end of input
         *   b. /b global flag
         *   c. /m multi-line flag
         *
         *   The Lexer will identify the first pattern the matches, Therefor the order of Token Constructors passed
         *   To the SimpleLexer's constructor is meaningful. If two patterns may match the same string, the longer one
         *   should be before the shorter one.
         *
         *   Note that there are situations in which we may wish to place the longer pattern after the shorter one.
         *   For example: keywords vs Identifiers.
         *   'do'(/do/) and 'done'(/w+)
         *
         *   * If the Identifier pattern appears before the 'do' pattern both 'do' and 'done'
         *     will be lexed as an Identifier.
         *
         *   * If the 'do' pattern appears before the Identifier pattern 'do' will be lexed correctly as a keyword.
         *     however 'done' will be lexed as TWO tokens keyword 'do' and identifier 'ne'.
         *
         *   To resolve this problem, add a static property on the keyword's Tokens constructor named: LONGER_ALT
         *   example:
         *
         *       export class Identifier extends Keyword { static PATTERN = /[_a-zA-Z][_a-zA-Z0-9]/ }
         *       export class Keyword extends Token {
         *          static PATTERN = lex.NA
         *          static LONGER_ALT = Identifier
         *       }
         *       export class Do extends Keyword { static PATTERN = /do/ }
         *       export class While extends Keyword { static PATTERN = /while/ }
         *       export class Return extends Keyword { static PATTERN = /return/ }
         *
         *   The lexer will then also attempt to match a (longer) Identifier each time a keyword is matched
         *
         *
         * @param {boolean} [deferDefinitionErrorsHandling=false]
         *                  an optional flag indicating that lexer definition errors
         *                  should not automatically cause an error to be raised.
         *                  This can be useful when wishing to indicate lexer errors in another manner
         *                  than simply throwing an error (for example in an online playground).
         */
        constructor(protected tokenClasses:TokenConstructor[], deferDefinitionErrorsHandling:boolean = false) {
            this.lexerDefinitionErrors = validatePatterns(tokenClasses)
            if (!utils.isEmpty(this.lexerDefinitionErrors) && !deferDefinitionErrorsHandling) {
                let allErrMessages = utils.map(this.lexerDefinitionErrors, (error) => {
                    return error.message
                })
                let allErrMessagesString = allErrMessages.join("-----------------------\n")
                throw new Error("Errors detected in definition of Lexer:\n" + allErrMessagesString)
            }

            // If definition errors were encountered, the analysis phase may fail unexpectedly/
            // Considering a lexer with definition errors may never be used, there is no point
            // to performing the analysis anyhow...
            if (utils.isEmpty(this.lexerDefinitionErrors)) {
                let analyzeResult = analyzeTokenClasses(tokenClasses)
                this.allPatterns = analyzeResult.allPatterns
                this.patternIdxToClass = analyzeResult.patternIdxToClass
                this.patternIdxToGroup = analyzeResult.patternIdxToGroup
                this.patternIdxToLongerAltIdx = analyzeResult.patternIdxToLongerAltIdx
                this.patternIdxToCanLineTerminator = analyzeResult.patternIdxToCanLineTerminator
                this.emptyGroups = analyzeResult.emptyGroups
            }
        }

        /**
         * Will lex(Tokenize) a string.
         * Note that this can be called repeatedly on different strings as this method
         * does not modify the state of the Lexer.
         *
         * @param {string} text the string to lex
         * @returns {{tokens: {Token}[], errors: string[]}}
         */
        public tokenize(text:string):ILexingResult {
            let match, i, j, matchAlt, longerAltIdx, matchedImage, imageLength, group, tokClass, newToken, errLength,
                canMatchedContainLineTerminator, fixForEndingInLT, c, droppedChar, lastLTIdx, errorMessage, lastCharIsLT
            let orgInput = text
            let offset = 0
            let matchedTokens = []
            let errors:ILexingError[] = []
            let line = 1
            let column = 1
            let groups:any = _.clone(this.emptyGroups)

            if (!utils.isEmpty(this.lexerDefinitionErrors)) {
                let allErrMessages = utils.map(this.lexerDefinitionErrors, (error) => {
                    return error.message
                })
                let allErrMessagesString = allErrMessages.join("-----------------------\n")
                throw new Error("Unable to Tokenize because Errors detected in definition of Lexer:\n" + allErrMessagesString)
            }

            while (text.length > 0) {

                match = null
                for (i = 0; i < this.allPatterns.length; i++) {
                    match = this.allPatterns[i].exec(text)
                    if (match !== null) {
                        // even though this pattern matched we must try a another longer alternative.
                        // this can be used to prioritize keywords over identifers
                        longerAltIdx = this.patternIdxToLongerAltIdx[i]
                        if (longerAltIdx) {
                            matchAlt = this.allPatterns[longerAltIdx].exec(text)
                            if (matchAlt && matchAlt[0].length > match[0].length) {
                                match = matchAlt
                                i = longerAltIdx
                            }
                        }
                        break
                    }
                }
                if (match !== null) {
                    matchedImage = match[0]
                    imageLength = matchedImage.length
                    group = this.patternIdxToGroup[i]
                    if (group !== undefined) {
                        tokClass = this.patternIdxToClass[i]
                        newToken = new tokClass(matchedImage, offset, line, column);
                        if (group === "default") {
                            matchedTokens.push(newToken)
                        }
                        else {
                            groups[group].push(newToken)
                        }
                    }
                    text = text.slice(imageLength)
                    offset = offset + imageLength
                    column = column + imageLength // TODO: with newlines the column may be assigned twice
                    canMatchedContainLineTerminator = this.patternIdxToCanLineTerminator[i]
                    if (canMatchedContainLineTerminator) {
                        let lineTerminatorsInMatch = countLineTerminators(matchedImage)
                        // TODO: identify edge case of one token ending in '\r' and another one starting with '\n'
                        if (lineTerminatorsInMatch !== 0) {
                            line = line + lineTerminatorsInMatch

                            lastLTIdx = imageLength - 1
                            while (lastLTIdx >= 0) {
                                c = matchedImage.charCodeAt(lastLTIdx)
                                // scan in reverse to find last lineTerminator in image
                                if (c === 13 || c === 10) { // '\r' or '\n'
                                    break;
                                }
                                lastLTIdx--
                            }
                            column = imageLength - lastLTIdx

                            if (group !== undefined) { // a none skipped multi line Token, need to update endLine/endColumn
                                lastCharIsLT = lastLTIdx === imageLength - 1
                                fixForEndingInLT = lastCharIsLT ? -1 : 0

                                if (!(lineTerminatorsInMatch === 1 && lastCharIsLT)) {
                                    // if a token ends in a LT that last LT only affects the line numbering of following Tokens
                                    newToken.endLine = line + fixForEndingInLT
                                    // the last LT in a token does not affect the endColumn either as the [columnStart ... columnEnd)
                                    // inclusive to exclusive range.
                                    newToken.endColumn = column - 1 + -fixForEndingInLT
                                }
                                // else single LT in the last character of a token, no need to modify the endLine/EndColumn
                            }
                        }
                    }

                }
                else { // error recovery, drop characters until we identify a valid token's start point
                    let errorStartOffset = offset
                    let errorLine = line
                    let errorColumn = column
                    let foundResyncPoint = false
                    while (!foundResyncPoint && text.length > 0) {
                        // drop chars until we succeed in matching something
                        droppedChar = text.charCodeAt(0)
                        if (droppedChar === 10 || // '\n'
                            (droppedChar === 13 &&
                            (text.length === 1 || (text.length > 1 && text.charCodeAt(1) !== 10)))) { //'\r' not followed by '\n'
                            line++
                            column = 1
                        }
                        else { // this else also matches '\r\n' which is fine, the '\n' will be counted
                            // either when skipping the next char, or when consuming the following pattern
                            // (which will have to start in a '\n' if we manage to consume it)
                            column++
                        }

                        text = text.substr(1)
                        offset++;
                        for (j = 0; j < this.allPatterns.length; j++) {
                            foundResyncPoint = this.allPatterns[j].test(text)
                            if (foundResyncPoint) {
                                break
                            }
                        }
                    }

                    errLength = offset - errorStartOffset
                    // at this point we either re-synced or reached the end of the input text
                    errorMessage = `unexpected character: ->${orgInput.charAt(errorStartOffset)}<- at offset: ${errorStartOffset},` +
                        ` skipped ${offset - errorStartOffset} characters.`
                    errors.push({line: errorLine, column: errorColumn, length: errLength, message: errorMessage})
                }
            }

            return {tokens: matchedTokens, groups: groups, errors: errors}
        }
    }
}

