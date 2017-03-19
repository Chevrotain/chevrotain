import {CustomPatternMatcherFunc, getImage, getStartColumn, getStartLine, ISimpleTokenOrIToken, LazyTokenCacheData} from "./tokens_public"
import {
    analyzeTokenClasses,
    checkFastMode,
    checkHasCustomTokenPatterns,
    checkLazyMode,
    checkSimpleMode,
    cloneEmptyGroups,
    countLineTerminators,
    DEFAULT_MODE,
    performRuntimeChecks, SUPPORT_STICKY,
    validatePatterns
} from "./lexer"
import {
    cloneArr,
    cloneObj,
    flatten,
    forEach,
    IDENTITY,
    isArray,
    isEmpty,
    isUndefined,
    keys,
    last,
    map,
    mapValues,
    merge, NOOP,
    reject
} from "../utils/utils"
import {
    augmentTokenClasses,
    createLazyTokenInstance,
    createSimpleLazyToken,
    fillUpLineToOffset,
    getStartColumnFromLineToOffset,
    getStartLineFromLineToOffset,
    LazyTokenCreator
} from "./tokens"

export interface TokenConstructor extends Function {
    GROUP?:string
    PATTERN?:RegExp
    LABEL?:string
    LONGER_ALT?:TokenConstructor
    POP_MODE?:boolean
    PUSH_MODE?:string

    tokenName?:string
    tokenType?:number
    extendingTokenTypes?:number[]

    new(...args:any[]):ISimpleTokenOrIToken
}

export interface ILexingResult {
    tokens:ISimpleTokenOrIToken[]
    groups:{ [groupName:string]:ISimpleTokenOrIToken[] }
    errors:ILexingError[]
}

export enum LexerDefinitionErrorType {
    MISSING_PATTERN,
    INVALID_PATTERN,
    EOI_ANCHOR_FOUND,
    UNSUPPORTED_FLAGS_FOUND,
    DUPLICATE_PATTERNS_FOUND,
    INVALID_GROUP_TYPE_FOUND,
    PUSH_MODE_DOES_NOT_EXIST,
    MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE,
    MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY,
    MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST,
    LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED,
    LEXER_DEFINITION_CANNOT_MIX_LAZY_AND_NOT_LAZY,
    LEXER_DEFINITION_CANNOT_MIX_SIMPLE_AND_NOT_SIMPLE,
    SOI_ANCHOR_FOUND
}

export interface ILexerDefinitionError {
    message:string
    type:LexerDefinitionErrorType
    tokenClasses?:Function[]
}

export interface ILexingError {
    line:number
    column:number
    length:number
    message:string
}

export type SingleModeLexerDefinition = TokenConstructor[]
export type MultiModesDefinition = { [modeName:string]:TokenConstructor[] }

export interface IMultiModeLexerDefinition {
    modes:MultiModesDefinition
    defaultMode:string
}

export interface IRegExpExec {
    exec:CustomPatternMatcherFunc
}

export class Lexer {

    public static SKIPPED = "This marks a skipped Token pattern, this means each token identified by it will" +
        "be consumed and then thrown into oblivion, this can be used to for example to completely ignore whitespace."

    public static NA = /NOT_APPLICABLE/
    public lexerDefinitionErrors:ILexerDefinitionError[] = []

    protected isLazyTokenMode
    protected isSimpleTokenMode
    // FastMode can be enabled when no Lexer Modes, no LONGER_ALTs have been used and we are using Lazy Tokens.
    protected isFastMode:boolean
    protected modes:string[] = []
    protected defaultMode:string
    protected allPatterns:{ [modeName:string]:IRegExpExec[] } = {}
    protected patternIdxToClass:{ [modeName:string]:Function[] } = {}
    protected patternIdxToGroup:{ [modeName:string]:string[] } = {}
    protected patternIdxToLongerAltIdx:{ [modeName:string]:number[] } = {}
    protected patternIdxToCanLineTerminator:{ [modeName:string]:boolean[] } = {}
    protected patternIdxToIsCustom:{ [modeName:string]:boolean[] } = {}
    protected patternIdxToPushMode:{ [modeName:string]:string[] } = {}
    protected patternIdxToPopMode:{ [modeName:string]:boolean[] } = {}
    protected emptyGroups:{ [groupName:string]:ISimpleTokenOrIToken } = {}
    protected hasCustomTokens:boolean


    /**
     * @param {SingleModeLexerDefinition | IMultiModeLexerDefinition} lexerDefinition -
     *  Structure composed of constructor functions for the Tokens types this lexer will support.
     *
     *  In the case of {SingleModeLexerDefinition} the structure is simply an array of Token constructors.
     *  In the case of {IMultiModeLexerDefinition} the structure is an object with two properties:
     *    1. a "modes" property where each value is an array of Token.
     *    2. a "defaultMode" property specifying the initial lexer mode.
     *
     *  constructors.
     *
     *  for example:
     *  {
     *     "modes" : {
     *     "modeX" : [Token1, Token2]
     *     "modeY" : [Token3, Token4]
     *     }
     *
     *     "defaultMode" : "modeY"
     *  }
     *
     *  A lexer with {MultiModesDefinition} is simply multiple Lexers where only one (mode) can be active at the same time.
     *  This is useful for lexing languages where there are different lexing rules depending on context.
     *
     *  The current lexing mode is selected via a "mode stack".
     *  The last (peek) value in the stack will be the current mode of the lexer.
     *
     *  Each Token class can define that it will cause the Lexer to (after consuming an instance of the Token):
     *  1. PUSH_MODE : push a new mode to the "mode stack"
     *  2. POP_MODE  : pop the last mode from the "mode stack"
     *
     *  Examples:
     *       export class Attribute extends Token {
     *          static PATTERN = ...
     *          static PUSH_MODE = "modeY"
     *       }
     *
     *       export class EndAttribute extends Token {
     *          static PATTERN = ...
     *          static POP_MODE = true
     *       }
     *
     *  The Token constructors must be in one of these forms:
     *
     *  1. With a PATTERN property that has a RegExp value for tokens to match:
     *     example: -->class Integer extends Token { static PATTERN = /[1-9]\d }<--
     *
     *  2. With a PATTERN property that has the value of the var Lexer.NA defined above.
     *     This is a convenience form used to avoid matching Token classes that only act as categories.
     *     example: -->class Keyword extends Token { static PATTERN = NA }<--
     *
     *
     *   The following RegExp patterns are not supported:
     *   a. '$' for match at end of input
     *   b. /b global flag
     *   c. /m multi-line flag
     *
     *   The Lexer will identify the first pattern that matches, Therefor the order of Token Constructors may be significant.
     *   For example when one pattern may match a prefix of another pattern.
     *
     *   Note that there are situations in which we may wish to order the longer pattern after the shorter one.
     *   For example: keywords vs Identifiers.
     *   'do'(/do/) and 'donald'(/w+)
     *
     *   * If the Identifier pattern appears before the 'do' pattern, both 'do' and 'donald'
     *     will be lexed as an Identifier.
     *
     *   * If the 'do' pattern appears before the Identifier pattern 'do' will be lexed correctly as a keyword.
     *     however 'donald' will be lexed as TWO separate tokens: keyword 'do' and identifier 'nald'.
     *
     *   To resolve this problem, add a static property on the keyword's constructor named: LONGER_ALT
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
     *   The lexer will then also attempt to match a (longer) Identifier each time a keyword is matched.
     *
     *
     * @param {boolean} [deferDefinitionErrorsHandling=false] -
     *                  An optional flag indicating that lexer definition errors
     *                  should not automatically cause an error to be raised.
     *                  This can be useful when wishing to indicate lexer errors in another manner
     *                  than simply throwing an error (for example in an online playground).
     */
    constructor(protected lexerDefinition:SingleModeLexerDefinition | IMultiModeLexerDefinition,
                deferDefinitionErrorsHandling:boolean = false) {

        let actualDefinition:IMultiModeLexerDefinition

        // Convert SingleModeLexerDefinition into a IMultiModeLexerDefinition.
        if (isArray(lexerDefinition)) {
            actualDefinition = <any>{modes: {}}
            actualDefinition.modes[DEFAULT_MODE] = cloneArr(<SingleModeLexerDefinition>lexerDefinition)
            actualDefinition[DEFAULT_MODE] = DEFAULT_MODE
        }
        // no conversion needed, input should already be a IMultiModeLexerDefinition
        else {
            actualDefinition = cloneObj(<IMultiModeLexerDefinition>lexerDefinition)
        }

        this.lexerDefinitionErrors = this.lexerDefinitionErrors.concat(performRuntimeChecks(actualDefinition))

        // for extra robustness to avoid throwing an none informative error message
        actualDefinition.modes = actualDefinition.modes ? actualDefinition.modes : {}

        // an error of undefined TokenClasses will be detected in "performRuntimeChecks" above.
        // this transformation is to increase robustness in the case of partially invalid lexer definition.
        forEach(actualDefinition.modes, (currModeValue, currModeName) => {
            actualDefinition.modes[currModeName] = reject<TokenConstructor>(currModeValue, (currTokClass) => isUndefined(currTokClass))
        })

        let allModeNames = keys(actualDefinition.modes)

        forEach(actualDefinition.modes, (currModDef:TokenConstructor[], currModName) => {
            this.modes.push(currModName)
            this.lexerDefinitionErrors = this.lexerDefinitionErrors.concat(
                validatePatterns(<SingleModeLexerDefinition>currModDef, allModeNames))

            // If definition errors were encountered, the analysis phase may fail unexpectedly/
            // Considering a lexer with definition errors may never be used, there is no point
            // to performing the analysis anyhow...
            if (isEmpty(this.lexerDefinitionErrors)) {
                augmentTokenClasses(currModDef)
                let currAnalyzeResult = analyzeTokenClasses(currModDef)
                this.allPatterns[currModName] = currAnalyzeResult.allPatterns
                this.patternIdxToClass[currModName] = currAnalyzeResult.patternIdxToClass
                this.patternIdxToGroup[currModName] = currAnalyzeResult.patternIdxToGroup
                this.patternIdxToLongerAltIdx[currModName] = currAnalyzeResult.patternIdxToLongerAltIdx
                this.patternIdxToCanLineTerminator[currModName] = currAnalyzeResult.patternIdxToCanLineTerminator
                this.patternIdxToIsCustom[currModName] = currAnalyzeResult.patternIdxToIsCustom
                this.patternIdxToPushMode[currModName] = currAnalyzeResult.patternIdxToPushMode
                this.patternIdxToPopMode[currModName] = currAnalyzeResult.patternIdxToPopMode
                this.emptyGroups = merge(this.emptyGroups, currAnalyzeResult.emptyGroups)
            }
        })

        this.defaultMode = actualDefinition.defaultMode
        let allTokensTypes:any = flatten(mapValues(actualDefinition.modes, (currModDef) => currModDef))

        // Lazy Mode handling
        let lazyCheckResult = checkLazyMode(allTokensTypes)
        this.isLazyTokenMode = lazyCheckResult.isLazy
        this.lexerDefinitionErrors = this.lexerDefinitionErrors.concat(lazyCheckResult.errors)

        // Simple Mode handling
        let simpleCheckResult = checkSimpleMode(allTokensTypes)
        this.isSimpleTokenMode = simpleCheckResult.isSimple
        this.lexerDefinitionErrors = this.lexerDefinitionErrors.concat(simpleCheckResult.errors)

        this.isFastMode = checkFastMode(allTokensTypes)
        this.hasCustomTokens = checkHasCustomTokenPatterns(allTokensTypes)

        if (!isEmpty(this.lexerDefinitionErrors) && !deferDefinitionErrorsHandling) {
            let allErrMessages = map(this.lexerDefinitionErrors, (error) => {
                return error.message
            })
            let allErrMessagesString = allErrMessages.join("-----------------------\n")
            throw new Error("Errors detected in definition of Lexer:\n" + allErrMessagesString)
        }

        if (SUPPORT_STICKY) {
            this.chopInput = <any>IDENTITY
        }
        else {
            this.updateLastIndex = NOOP
        }
    }

    /**
     * Will lex(Tokenize) a string.
     * Note that this can be called repeatedly on different strings as this method
     * does not modify the state of the Lexer.
     *
     * @param {string} text - The string to lex
     * @param {string} [initialMode] - The initial Lexer Mode to start with, by default this will be the first mode in the lexer's
     *                                 definition. If the lexer has no explicit modes it will be the implicit single 'default_mode' mode.
     *
     * @returns {ILexingResult}
     */
    public tokenize(text:string,
                    initialMode:string = this.defaultMode):ILexingResult {

        if (!isEmpty(this.lexerDefinitionErrors)) {
            let allErrMessages = map(this.lexerDefinitionErrors, (error) => {
                return error.message
            })
            let allErrMessagesString = allErrMessages.join("-----------------------\n")
            throw new Error("Unable to Tokenize because Errors detected in definition of Lexer:\n" + allErrMessagesString)
        }

        if (this.isLazyTokenMode) {
            if (this.isFastMode) {
                if (this.isSimpleTokenMode) {
                    return this.tokenizeInternalLazyFast(text, initialMode, createSimpleLazyToken)
                }
                else {
                    return this.tokenizeInternalLazyFast(text, initialMode, createLazyTokenInstance)
                }
            }
            else {
                if (this.isSimpleTokenMode) {
                    return this.tokenizeInternalLazy(text, initialMode, createSimpleLazyToken)
                }
                else {
                    return this.tokenizeInternalLazy(text, initialMode, createLazyTokenInstance)
                }
            }

        }
        else {
            return this.tokenizeInternal(text, initialMode)
        }
    }

    // There is quite a bit of duplication between this and "tokenizeInternalLazy"
    // This is intentional due to performance considerations.
    private tokenizeInternal(text:string, initialMode:string):ILexingResult {
        let match, i, j, matchAlt, longerAltIdx, matchedImage, imageLength, group, tokClass, newToken, errLength,
            fixForEndingInLT, c, droppedChar, lastLTIdx, msg, lastCharIsLT
        let orgText = text
        let orgLength = orgText.length
        let offset = 0
        let matchedTokens = []
        let errors:ILexingError[] = []
        let line = 1
        let column = 1
        let groups:any = cloneEmptyGroups(this.emptyGroups)

        let currModePatterns = []
        let currModePatternsLength = 0
        let currModePatternIdxToLongerAltIdx = []
        let currModePatternIdxToIsCustom = []
        let currModePatternIdxToGroup = []
        let currModePatternIdxToClass = []
        let currModePatternIdxToCanLineTerminator = []
        let patternIdxToPushMode = []
        let patternIdxToPopMode = []

        let modeStack = []
        let pop_mode = (popToken) => {
            // TODO: perhaps avoid this error in the edge case there is no more input?
            if (modeStack.length === 1) {
                // if we try to pop the last mode there lexer will no longer have ANY mode.
                // thus the pop is ignored, an error will be created and the lexer will continue parsing in the previous mode.
                let msg = `Unable to pop Lexer Mode after encountering Token ->${getImage(popToken)}<- The Mode Stack is empty`
                errors.push({
                    line:    getStartLine(popToken),
                    column:  getStartColumn(popToken),
                    length:  getImage(popToken).length,
                    message: msg
                })
            }
            else {
                modeStack.pop()
                let newMode = last(modeStack)
                currModePatterns = this.allPatterns[newMode]
                currModePatternsLength = currModePatterns.length
                currModePatternIdxToLongerAltIdx = this.patternIdxToLongerAltIdx[newMode]
                currModePatternIdxToIsCustom = this.patternIdxToIsCustom[newMode]
                currModePatternIdxToGroup = this.patternIdxToGroup[newMode]
                currModePatternIdxToClass = this.patternIdxToClass[newMode]
                currModePatternIdxToCanLineTerminator = this.patternIdxToCanLineTerminator[newMode]
                patternIdxToPushMode = this.patternIdxToPushMode[newMode]
                patternIdxToPopMode = this.patternIdxToPopMode[newMode]
            }
        }

        function push_mode(newMode) {
            modeStack.push(newMode)
            currModePatterns = this.allPatterns[newMode]
            currModePatternsLength = currModePatterns.length
            currModePatternIdxToLongerAltIdx = this.patternIdxToLongerAltIdx[newMode]
            currModePatternIdxToIsCustom = this.patternIdxToIsCustom[newMode]
            currModePatternIdxToGroup = this.patternIdxToGroup[newMode]
            currModePatternIdxToClass = this.patternIdxToClass[newMode]
            currModePatternIdxToCanLineTerminator = this.patternIdxToCanLineTerminator[newMode]
            patternIdxToPushMode = this.patternIdxToPushMode[newMode]
            patternIdxToPopMode = this.patternIdxToPopMode[newMode]
        }

        // this pattern seems to avoid a V8 de-optimization, although that de-optimization does not
        // seem to matter performance wise.
        push_mode.call(this, initialMode)

        let hasCustomTokens = this.hasCustomTokens
        while (offset < orgLength) {
            match = null
            for (i = 0; i < currModePatternsLength; i++) {
                let currPattern = currModePatterns[i]
                // quick check to avoid performance hit in the common case of no custom patterns
                if (hasCustomTokens &&
                    // slower check to optimize the less common case of custom patterns
                    currModePatternIdxToIsCustom[i] === true) {
                    match = currPattern.exec(orgText, offset, matchedTokens, groups)
                } else {
                    this.updateLastIndex(currPattern, offset)
                    match = currPattern.exec(text)
                }
                if (match !== null) {
                    // even though this pattern matched we must try a another longer alternative.
                    // this can be used to prioritize keywords over identifiers
                    longerAltIdx = currModePatternIdxToLongerAltIdx[i]
                    let longerAltPattern = currModePatterns[longerAltIdx]
                    if (longerAltIdx) {
                        if (hasCustomTokens) {
                            matchAlt = longerAltPattern.exec(text, matchedTokens, groups)
                        } else {
                            this.updateLastIndex(longerAltPattern, offset)
                            matchAlt = longerAltPattern.exec(text)
                        }
                        if (matchAlt && matchAlt[0].length > match[0].length) {
                            match = matchAlt
                            i = longerAltIdx
                        }
                    }
                    break
                }
            }
            // successful match
            if (match !== null) {
                matchedImage = match[0]
                imageLength = matchedImage.length
                group = currModePatternIdxToGroup[i]
                if (group !== undefined) {
                    tokClass = currModePatternIdxToClass[i]
                    newToken = new tokClass(matchedImage, offset, line, column)
                    if (group === false) {
                        matchedTokens.push(newToken)
                    }
                    else {
                        groups[group].push(newToken)
                    }
                }
                text = this.chopInput(text, imageLength)
                offset = offset + imageLength
                column = column + imageLength // TODO: with newlines the column may be assigned twice

                if (currModePatternIdxToCanLineTerminator[i]) {
                    let lineTerminatorsInMatch = countLineTerminators(matchedImage)
                    // TODO: identify edge case of one token ending in '\r' and another one starting with '\n'
                    if (lineTerminatorsInMatch !== 0) {
                        line = line + lineTerminatorsInMatch

                        lastLTIdx = imageLength - 1
                        while (lastLTIdx >= 0) {
                            c = matchedImage.charCodeAt(lastLTIdx)
                            // scan in reverse to find last lineTerminator in image
                            if (c === 13 || c === 10) { // '\r' or '\n'
                                break
                            }
                            lastLTIdx--
                        }
                        column = imageLength - lastLTIdx

                        if (group !== undefined) { // a none skipped multi line Token, need to update endLine/endColumn
                            lastCharIsLT = lastLTIdx === imageLength - 1
                            fixForEndingInLT = lastCharIsLT ?
                                -1 :
                                0

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

                // mode handling, must pop before pushing if a Token both acts as both
                // otherwise it would be a NO-OP
                if (patternIdxToPopMode[i]) {
                    // need to save the PUSH_MODE property as if the mode is popped
                    // patternIdxToPopMode is updated to reflect the new mode after popping the stack
                    let pushMode = patternIdxToPushMode[i]
                    pop_mode(newToken)
                    if (pushMode) {
                        push_mode.call(this, pushMode)
                    }
                }
                else if (patternIdxToPushMode[i]) {
                    push_mode.call(this, patternIdxToPushMode[i])
                }
            }
            else { // error recovery, drop characters until we identify a valid token's start point
                let errorStartOffset = offset
                let errorLine = line
                let errorColumn = column
                let foundResyncPoint = false
                while (!foundResyncPoint && offset < orgLength) {
                    // drop chars until we succeed in matching something
                    droppedChar = orgText.charCodeAt(offset)
                    if (droppedChar === 10 || // '\n'
                        (droppedChar === 13 &&
                        (offset === orgLength - 1 ||
                        (offset < orgLength - 1 && orgText.charCodeAt(offset + 1) !== 10)))) { //'\r' not
                        // followed by
                        // '\n'
                        line++
                        column = 1
                    }
                    else { // this else also matches '\r\n' which is fine, the '\n' will be counted
                        // either when skipping the next char, or when consuming the following pattern
                        // (which will have to start in a '\n' if we manage to consume it)
                        column++
                    }
                    // Identity Func (when sticky flag is enabled)
                    text = this.chopInput(text, 1)
                    offset++
                    for (j = 0; j < currModePatterns.length; j++) {
                        let currPattern = currModePatterns[j]
                        if (hasCustomTokens &&
                            // slower check to optimize the less common case of custom patterns
                            currModePatternIdxToIsCustom[j] === true) {
                            foundResyncPoint = currPattern.exec(orgText, offset, matchedTokens, groups)
                        } else {
                            this.updateLastIndex(currPattern, offset)
                            foundResyncPoint = currPattern.exec(text)
                        }
                        if (foundResyncPoint !== null) {
                            break
                        }
                    }
                }

                errLength = offset - errorStartOffset
                // at this point we either re-synced or reached the end of the input text
                msg = `unexpected character: ->${orgText.charAt(errorStartOffset)}<- at offset: ${errorStartOffset},` +
                    ` skipped ${offset - errorStartOffset} characters.`
                errors.push({line: errorLine, column: errorColumn, length: errLength, message: msg})
            }
        }

        return {tokens: matchedTokens, groups: groups, errors: errors}
    }

    private tokenizeInternalLazy(text:string, initialMode:string, tokenCreator:LazyTokenCreator):ILexingResult {
        let match, i, j, matchAlt, longerAltIdx, matchedImage, imageLength, group, tokClass, newToken, errLength, droppedChar, msg

        let orgText = text
        let orgLength = text.length
        let offset = 0
        let matchedTokens = []
        let errors:ILexingError[] = []
        let groups:any = cloneEmptyGroups(this.emptyGroups)

        let currModePatterns = []
        let currModePatternsLength = 0
        let currModePatternIdxToLongerAltIdx = []
        let currModePatternIdxToIsCustom = []
        let currModePatternIdxToGroup = []
        let currModePatternIdxToClass = []
        let patternIdxToPushMode = []
        let patternIdxToPopMode = []

        let lazyCacheData:LazyTokenCacheData = {
            orgText:      text,
            lineToOffset: []
        }

        let modeStack = []
        let pop_mode = (popToken) => {
            // TODO: perhaps avoid this error in the edge case there is no more input?
            if (modeStack.length === 1) {
                // if we try to pop the last mode there lexer will no longer have ANY mode.
                // thus the pop is ignored, an error will be created and the lexer will continue parsing in the previous mode.
                let msg = `Unable to pop Lexer Mode after encountering Token ->${getImage(popToken)}<- The Mode Stack is empty`
                errors.push({
                    line:    getStartLine(popToken),
                    column:  getStartColumn(popToken),
                    length:  getImage(popToken).length,
                    message: msg
                })
            }
            else {
                modeStack.pop()
                let newMode = last(modeStack)
                currModePatterns = this.allPatterns[newMode]
                currModePatternsLength = currModePatterns.length
                currModePatternIdxToLongerAltIdx = this.patternIdxToLongerAltIdx[newMode]
                currModePatternIdxToIsCustom = this.patternIdxToIsCustom[newMode]
                currModePatternIdxToGroup = this.patternIdxToGroup[newMode]
                currModePatternIdxToClass = this.patternIdxToClass[newMode]
                patternIdxToPushMode = this.patternIdxToPushMode[newMode]
                patternIdxToPopMode = this.patternIdxToPopMode[newMode]
            }
        }

        function push_mode(newMode) {
            modeStack.push(newMode)
            currModePatterns = this.allPatterns[newMode]
            currModePatternsLength = currModePatterns.length
            currModePatternIdxToLongerAltIdx = this.patternIdxToLongerAltIdx[newMode]
            currModePatternIdxToIsCustom = this.patternIdxToIsCustom[newMode]
            currModePatternIdxToGroup = this.patternIdxToGroup[newMode]
            currModePatternIdxToClass = this.patternIdxToClass[newMode]
            patternIdxToPushMode = this.patternIdxToPushMode[newMode]
            patternIdxToPopMode = this.patternIdxToPopMode[newMode]
        }

        // this pattern seems to avoid a V8 de-optimization, although that de-optimization does not
        // seem to matter performance wise.
        push_mode.call(this, initialMode)

        let hasCustomTokens = this.hasCustomTokens
        while (offset < orgLength) {
            match = null
            for (i = 0; i < currModePatternsLength; i++) {
                let currPattern = currModePatterns[i]
                // quick check to avoid performance hit in the common case of no custom patterns
                if (hasCustomTokens &&
                    // slower check to optimize the less common case of custom patterns
                    currModePatternIdxToIsCustom[i] === true) {
                    match = currPattern.exec(orgText, offset, matchedTokens, groups)
                } else {
                    this.updateLastIndex(currPattern, offset)
                    match = currPattern.exec(text)
                }
                if (match !== null) {
                    // even though this pattern matched we must try a another longer alternative.
                    // this can be used to prioritize keywords over identifiers
                    longerAltIdx = currModePatternIdxToLongerAltIdx[i]
                    if (longerAltIdx) {
                        let longerPattern = currModePatterns[longerAltIdx]
                        if (hasCustomTokens &&
                            // slower check to optimize the less common case of custom patterns
                            currModePatternIdxToIsCustom[longerAltIdx] === true) {
                            matchAlt = longerPattern.exec(orgText, offset, matchedTokens, groups)
                        } else {
                            this.updateLastIndex(longerPattern, offset)
                            matchAlt = longerPattern.exec(text)
                        }
                        if (matchAlt && matchAlt[0].length > match[0].length) {
                            match = matchAlt
                            i = longerAltIdx
                        }
                    }
                    break
                }
            }
            // successful match
            if (match !== null) {
                matchedImage = match[0]
                imageLength = matchedImage.length
                group = currModePatternIdxToGroup[i]
                if (group !== undefined) {
                    tokClass = currModePatternIdxToClass[i]
                    // the end offset is non inclusive.
                    newToken = tokenCreator(offset, offset + imageLength - 1, tokClass, lazyCacheData)
                    if (group === false) {
                        matchedTokens.push(newToken)
                    }
                    else {
                        groups[group].push(newToken)
                    }
                }
                text = this.chopInput(text, imageLength)
                offset = offset + imageLength

                // mode handling, must pop before pushing if a Token both acts as both
                // otherwise it would be a NO-OP
                if (patternIdxToPopMode[i]) {
                    // need to save the PUSH_MODE property as if the mode is popped
                    // patternIdxToPopMode is updated to reflect the new mode after popping the stack
                    let pushMode = patternIdxToPushMode[i]
                    pop_mode(newToken)
                    if (pushMode) {
                        push_mode.call(this, pushMode)
                    }
                }
                else if (patternIdxToPushMode[i]) {
                    push_mode.call(this, patternIdxToPushMode[i])
                }
            }
            else { // error recovery, drop characters until we identify a valid token's start point
                let errorStartOffset = offset
                let foundResyncPoint = false
                while (!foundResyncPoint && offset < orgLength) {
                    // drop chars until we succeed in matching something
                    droppedChar = orgText.charCodeAt(offset)
                    text = this.chopInput(text, 1)
                    offset++
                    for (j = 0; j < currModePatterns.length; j++) {
                        let currPattern = currModePatterns[j]
                        if (hasCustomTokens &&
                            // slower check to optimize the less common case of custom patterns
                            currModePatternIdxToIsCustom[j] === true) {
                            foundResyncPoint = currPattern.exec(orgText, offset, matchedTokens, groups)
                        } else {
                            this.updateLastIndex(currPattern, offset)
                            foundResyncPoint = currPattern.exec(text)
                        }
                        if (foundResyncPoint !== null) {
                            break
                        }
                    }
                }

                errLength = offset - errorStartOffset
                // at this point we either re-synced or reached the end of the input text
                msg = `unexpected character: ->${orgText.charAt(errorStartOffset)}<- at offset: ${errorStartOffset},` +
                    ` skipped ${offset - errorStartOffset} characters.`

                if (isEmpty(lazyCacheData.lineToOffset)) {
                    fillUpLineToOffset(lazyCacheData.lineToOffset, lazyCacheData.orgText)
                }

                let errorLine = getStartLineFromLineToOffset(errorStartOffset, lazyCacheData.lineToOffset)
                let errorColumn = getStartColumnFromLineToOffset(errorStartOffset, lazyCacheData.lineToOffset)

                errors.push({line: errorLine, column: errorColumn, length: errLength, message: msg})
            }
        }

        return {tokens: matchedTokens, groups: groups, errors: errors}
    }


    // There is quite a bit of duplication between this and "tokenizeInternalLazy"
    // This is intentional due to performance considerations.
    private tokenizeInternalLazyFast(text:string, initialMode:string, tokenCreator:LazyTokenCreator):ILexingResult {
        let match, i, j, matchedImage, imageLength, group, tokClass, newToken, errLength, droppedChar, msg, newOffset

        let orgText = text
        let orgLength = orgText.length
        let orgInput = text
        let offset = 0
        let matchedTokens = []
        let errors:ILexingError[] = []
        let groups:any = cloneEmptyGroups(this.emptyGroups)

        let lazyCacheData:LazyTokenCacheData = {
            orgText:      text,
            lineToOffset: []
        }

        let currModePatterns = this.allPatterns[initialMode]
        let currModePatternsLength = currModePatterns.length
        let currModePatternIdxToGroup = this.patternIdxToGroup[initialMode]
        let currModePatternIdxToClass = this.patternIdxToClass[initialMode]
        let currModePatternIdxToIsCustom = this.patternIdxToIsCustom[initialMode]
        let hasCustomTokens = this.hasCustomTokens

        while (offset < orgLength) {
            match = null
            for (i = 0; i < currModePatternsLength; i++) {
                let currPattern = currModePatterns[i]
                // quick check to avoid performance hit in the common case of no custom patterns
                if (hasCustomTokens &&
                    // slower check to optimize the less common case of custom patterns
                    currModePatternIdxToIsCustom[i] === true) {
                    match = currModePatterns[i].exec(orgText, offset, matchedTokens, groups)
                } else {
                    this.updateLastIndex(currPattern, offset)
                    match = currPattern.exec(text)
                }
                if (match !== null) {
                    break
                }
            }
            // successful match
            if (match !== null) {
                matchedImage = match[0]
                imageLength = matchedImage.length
                group = currModePatternIdxToGroup[i]
                newOffset = offset + imageLength
                if (group !== undefined) {
                    tokClass = currModePatternIdxToClass[i]
                    // the end offset is non inclusive.
                    newToken = tokenCreator(offset, newOffset - 1, tokClass, lazyCacheData)
                    if (group === false) {
                        matchedTokens.push(newToken)
                    }
                    else {
                        groups[group].push(newToken)
                    }
                }
                text = this.chopInput(text, imageLength)
                offset = newOffset
            }
            else {
                // error recovery, drop characters until we identify a valid token's start point
                let errorStartOffset = offset
                let foundResyncPoint:any = false
                while (!foundResyncPoint && offset < orgLength) {
                    // drop chars until we succeed in matching something
                    droppedChar = orgText.charCodeAt(offset)
                    text = this.chopInput(text, 1)
                    offset++
                    for (j = 0; j < currModePatterns.length; j++) {
                        let currPattern = currModePatterns[j]
                        if (hasCustomTokens &&
                            // slower check to optimize the less common case of custom patterns
                            currModePatternIdxToIsCustom[j] === true) {
                            foundResyncPoint = currPattern.exec(orgText, offset, matchedTokens, groups)
                        } else {
                            this.updateLastIndex(currPattern, offset)
                            foundResyncPoint = currPattern.exec(text)
                        }
                        if (foundResyncPoint !== null) {
                            break
                        }
                    }
                }

                errLength = offset - errorStartOffset
                // at this point we either re-synced or reached the end of the input text
                msg = `unexpected character: ->${orgInput.charAt(errorStartOffset)}<- at offset: ${errorStartOffset},` +
                    ` skipped ${offset - errorStartOffset} characters.`

                if (isEmpty(lazyCacheData.lineToOffset)) {
                    fillUpLineToOffset(lazyCacheData.lineToOffset, lazyCacheData.orgText)
                }

                let errorLine = getStartLineFromLineToOffset(errorStartOffset, lazyCacheData.lineToOffset)
                let errorColumn = getStartColumnFromLineToOffset(errorStartOffset, lazyCacheData.lineToOffset)

                errors.push({line: errorLine, column: errorColumn, length: errLength, message: msg})
            }
        }

        return {tokens: matchedTokens, groups: groups, errors: errors}
    }


    private chopInput(text, length):string {
        return text.substring(length)
    }

    private updateLastIndex(regExp, newLastIndex):void {
        regExp.lastIndex = newLastIndex
    }

}
