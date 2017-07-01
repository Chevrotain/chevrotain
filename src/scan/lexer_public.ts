import {
    CustomPatternMatcherFunc,
    getTokenConstructor,
    IToken,
    tokenName
} from "./tokens_public"
import {
    analyzeTokenClasses,
    cloneEmptyGroups,
    DEFAULT_MODE,
    performRuntimeChecks,
    SUPPORT_STICKY,
    validatePatterns
} from "./lexer"
import {
    cloneArr,
    cloneObj,
    forEach,
    IDENTITY,
    isArray,
    isEmpty,
    isUndefined,
    keys,
    last,
    map,
    merge,
    NOOP,
    reject
} from "../utils/utils"
import { augmentTokenClasses } from "./tokens"

export interface TokenConstructor extends Function {
    GROUP?: string
    PATTERN?: RegExp | string
    LABEL?: string
    LONGER_ALT?: TokenConstructor
    POP_MODE?: boolean
    PUSH_MODE?: string

    tokenName?: string
    tokenType?: number
    extendingTokenTypes?: number[]

    new (...args: any[]): IToken
}

export interface ILexingResult {
    tokens: IToken[]
    groups: { [groupName: string]: IToken[] }
    errors: ILexingError[]
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
    SOI_ANCHOR_FOUND,
    EMPTY_MATCH_PATTERN
}

export interface ILexerDefinitionError {
    message: string
    type: LexerDefinitionErrorType
    tokenClasses?: Function[]
}

export interface ILexingError {
    offset: number
    line: number
    column: number
    length: number
    message: string
}

export type SingleModeLexerDefinition = TokenConstructor[]
export type MultiModesDefinition = { [modeName: string]: TokenConstructor[] }

export interface IMultiModeLexerDefinition {
    modes: MultiModesDefinition
    defaultMode: string
}

export interface IRegExpExec {
    exec: CustomPatternMatcherFunc
}

export interface ILexerConfig {
    /**
     * An optional flag indicating that lexer definition errors
     * should not automatically cause an error to be raised.
     * This can be useful when wishing to indicate lexer errors in another manner
     * than simply throwing an error (for example in an online playground).
     */
    deferDefinitionErrorsHandling?: boolean

    /**
     * "full" location information means all six combinations of /(end|start)(Line|Column|Offset)/ properties.
     * "onlyStart" means that only startLine, startColumn and startOffset will be tracked
     * "onlyOffset" means that only the startOffset will be tracked.
     *
     * The less position tracking the faster the Lexer will be and the less memory used.
     * However the difference is not large (~10% On V8), thus reduced location tracking options should only be used
     * in edge cases where every last ounce of performance is needed.
     */
    positionTracking?: "full" | "onlyStart" | "onlyOffset"

    /**
     * Run the Lexer in debug mode.
     * Features:
     * - The output tokens will contain their tokenConstructor name in a human readable manner.
     *   This information is always available by using the <getTokenConstructor> function on the official API.
     *   However, this is less convenient then a direct property when inspecting values in a debugger.
     *
     * DO NOT ENABLE THIS IN PRODUCTION has a large performance penalty.
     */
    debug?: boolean
}

const DEFAULT_LEXER_CONFIG: ILexerConfig = {
    deferDefinitionErrorsHandling: false,
    positionTracking: "full",
    debug: false
}

Object.freeze(DEFAULT_LEXER_CONFIG)

let nlRegExp = /\n|\r\n?/g

export class Lexer {
    public static SKIPPED = "This marks a skipped Token pattern, this means each token identified by it will" +
        "be consumed and then thrown into oblivion, this can be used to for example to completely ignore whitespace."

    public static NA = /NOT_APPLICABLE/
    public lexerDefinitionErrors: ILexerDefinitionError[] = []

    protected patternIdxToConfig: any = {}

    protected modes: string[] = []
    protected defaultMode: string
    protected emptyGroups: { [groupName: string]: IToken } = {}

    private config: ILexerConfig = undefined
    private trackStartLines: boolean = true
    private trackEndLines: boolean = true

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
     * @param {ILexerConfig} [config=DEFAULT_LEXER_CONFIG] -
     *                  The Lexer's configuration @see {ILexerConfig} for details.
     */
    constructor(
        protected lexerDefinition:
            | SingleModeLexerDefinition
            | IMultiModeLexerDefinition,
        config: ILexerConfig = DEFAULT_LEXER_CONFIG
    ) {
        if (typeof config === "boolean") {
            throw Error(
                "The second argument to the Lexer constructor is now an ILexerConfig Object.\n" +
                    "a boolean 2nd argument is no longer supported"
            )
        }
        this.config = merge(DEFAULT_LEXER_CONFIG, config)

        if (this.config.debug === true) {
            console.log(
                "Running the Lexer in Debug Mode, DO NOT ENABLE THIS IN PRODUCTIVE ENV!"
            )
        }

        this.trackStartLines = /full|onlyStart/i.test(
            this.config.positionTracking
        )
        this.trackEndLines = /full/i.test(this.config.positionTracking)

        let hasOnlySingleMode = true
        let actualDefinition: IMultiModeLexerDefinition

        // Convert SingleModeLexerDefinition into a IMultiModeLexerDefinition.
        if (isArray(lexerDefinition)) {
            actualDefinition = <any>{ modes: {} }
            actualDefinition.modes[DEFAULT_MODE] = cloneArr(
                <SingleModeLexerDefinition>lexerDefinition
            )
            actualDefinition[DEFAULT_MODE] = DEFAULT_MODE
        } else {
            // no conversion needed, input should already be a IMultiModeLexerDefinition
            hasOnlySingleMode = false
            actualDefinition = cloneObj(
                <IMultiModeLexerDefinition>lexerDefinition
            )
        }

        this.lexerDefinitionErrors = this.lexerDefinitionErrors.concat(
            performRuntimeChecks(actualDefinition)
        )

        // for extra robustness to avoid throwing an none informative error message
        actualDefinition.modes = actualDefinition.modes
            ? actualDefinition.modes
            : {}

        // an error of undefined TokenClasses will be detected in "performRuntimeChecks" above.
        // this transformation is to increase robustness in the case of partially invalid lexer definition.
        forEach(actualDefinition.modes, (currModeValue, currModeName) => {
            actualDefinition.modes[currModeName] = reject<
                TokenConstructor
            >(currModeValue, currTokClass => isUndefined(currTokClass))
        })

        let allModeNames = keys(actualDefinition.modes)

        forEach(
            actualDefinition.modes,
            (currModDef: TokenConstructor[], currModName) => {
                this.modes.push(currModName)
                this.lexerDefinitionErrors = this.lexerDefinitionErrors.concat(
                    validatePatterns(
                        <SingleModeLexerDefinition>currModDef,
                        allModeNames
                    )
                )

                // If definition errors were encountered, the analysis phase may fail unexpectedly/
                // Considering a lexer with definition errors may never be used, there is no point
                // to performing the analysis anyhow...
                if (isEmpty(this.lexerDefinitionErrors)) {
                    augmentTokenClasses(currModDef)
                    let currAnalyzeResult = analyzeTokenClasses(currModDef)

                    this.patternIdxToConfig[currModName] =
                        currAnalyzeResult.patternIdxToConfig
                    this.emptyGroups = merge(
                        this.emptyGroups,
                        currAnalyzeResult.emptyGroups
                    )
                }
            }
        )

        this.defaultMode = actualDefinition.defaultMode

        if (
            !isEmpty(this.lexerDefinitionErrors) &&
            !this.config.deferDefinitionErrorsHandling
        ) {
            let allErrMessages = map(this.lexerDefinitionErrors, error => {
                return error.message
            })
            let allErrMessagesString = allErrMessages.join(
                "-----------------------\n"
            )
            throw new Error(
                "Errors detected in definition of Lexer:\n" +
                    allErrMessagesString
            )
        }

        if (SUPPORT_STICKY) {
            this.chopInput = <any>IDENTITY
        } else {
            this.updateLastIndex = NOOP
        }

        if (hasOnlySingleMode) {
            this.handleModes = NOOP
        }

        if (this.trackStartLines === false) {
            this.computeNewColumn = IDENTITY
        }

        if (this.trackEndLines === false) {
            this.updateTokenEndLineColumnLocation = NOOP
        }

        if (/full/i.test(this.config.positionTracking)) {
            this.createTokenInstance = this.createFullToken
        } else if (/onlyStart/i.test(this.config.positionTracking)) {
            this.createTokenInstance = this.createStartOnlyToken
        } else if (/onlyOffset/i.test(this.config.positionTracking)) {
            this.createTokenInstance = this.createOffsetOnlyToken
        } else {
            throw Error(
                `Invalid <positionTracking> config option: "${this.config
                    .positionTracking}"`
            )
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
    public tokenize(
        text: string,
        initialMode: string = this.defaultMode
    ): ILexingResult {
        if (!isEmpty(this.lexerDefinitionErrors)) {
            let allErrMessages = map(this.lexerDefinitionErrors, error => {
                return error.message
            })
            let allErrMessagesString = allErrMessages.join(
                "-----------------------\n"
            )
            throw new Error(
                "Unable to Tokenize because Errors detected in definition of Lexer:\n" +
                    allErrMessagesString
            )
        }

        let lexResult = this.tokenizeInternal(text, initialMode)

        if (this.config.debug === true) {
            this.addTokenTypeNamesToResult(lexResult)
        }

        return lexResult
    }

    // There is quite a bit of duplication between this and "tokenizeInternalLazy"
    // This is intentional due to performance considerations.
    private tokenizeInternal(text: string, initialMode: string): ILexingResult {
        let i,
            j,
            matchAltImage,
            longerAltIdx,
            matchedImage,
            imageLength,
            group,
            tokType,
            newToken,
            errLength,
            droppedChar,
            lastLTIdx,
            msg,
            match
        let orgText = text
        let orgLength = orgText.length
        let offset = 0
        let matchedTokens = []
        let errors: ILexingError[] = []
        let line = this.trackStartLines ? 1 : undefined
        let column = this.trackStartLines ? 1 : undefined
        let groups: any = cloneEmptyGroups(this.emptyGroups)
        let trackLines = this.trackStartLines

        let currModePatternsLength = 0
        let patternIdxToConfig = []

        let modeStack = []
        let pop_mode = popToken => {
            // TODO: perhaps avoid this error in the edge case there is no more input?
            if (modeStack.length === 1) {
                // if we try to pop the last mode there lexer will no longer have ANY mode.
                // thus the pop is ignored, an error will be created and the lexer will continue parsing in the previous mode.
                let msg = `Unable to pop Lexer Mode after encountering Token ->${popToken.image}<- The Mode Stack is empty`
                errors.push({
                    offset: popToken.startOffset,
                    line: popToken.startLine !== undefined
                        ? popToken.startLine
                        : undefined,
                    column: popToken.startColumn !== undefined
                        ? popToken.startColumn
                        : undefined,
                    length: popToken.image.length,
                    message: msg
                })
            } else {
                modeStack.pop()
                let newMode = last(modeStack)
                patternIdxToConfig = this.patternIdxToConfig[newMode]
                currModePatternsLength = patternIdxToConfig.length
            }
        }

        function push_mode(newMode) {
            modeStack.push(newMode)
            patternIdxToConfig = this.patternIdxToConfig[newMode]
            currModePatternsLength = patternIdxToConfig.length
        }

        // this pattern seems to avoid a V8 de-optimization, although that de-optimization does not
        // seem to matter performance wise.
        push_mode.call(this, initialMode)

        let currConfig

        while (offset < orgLength) {
            matchedImage = null
            for (i = 0; i < currModePatternsLength; i++) {
                currConfig = patternIdxToConfig[i]
                let currPattern = currConfig.pattern

                // manually in-lined because > 600 chars won't be in-lined in V8
                let singleCharCode = currConfig.short
                if (singleCharCode !== false) {
                    if (orgText.charCodeAt(offset) === singleCharCode) {
                        // single character string
                        matchedImage = currPattern
                    }
                } else if (currConfig.isCustom === true) {
                    match = currPattern.exec(
                        orgText,
                        offset,
                        matchedTokens,
                        groups
                    )
                    matchedImage = match !== null ? match[0] : match
                } else {
                    this.updateLastIndex(currPattern, offset)
                    match = currPattern.exec(text)
                    matchedImage = match !== null ? match[0] : match
                }

                if (matchedImage !== null) {
                    // even though this pattern matched we must try a another longer alternative.
                    // this can be used to prioritize keywords over identifiers
                    longerAltIdx = currConfig.longerAlt
                    if (longerAltIdx !== undefined) {
                        // TODO: micro optimize, avoid extra prop access
                        // by saving/linking longerAlt on the original config?
                        let longerAltConfig = patternIdxToConfig[longerAltIdx]
                        let longerAltPattern = longerAltConfig.pattern

                        // single Char can never be a longer alt so no need to test it.
                        // manually in-lined because > 600 chars won't be in-lined in V8
                        if (longerAltConfig.isCustom === true) {
                            match = longerAltPattern.exec(
                                orgText,
                                offset,
                                matchedTokens,
                                groups
                            )
                            matchAltImage = match !== null ? match[0] : match
                        } else {
                            this.updateLastIndex(longerAltPattern, offset)
                            match = longerAltPattern.exec(text)
                            matchAltImage = match !== null ? match[0] : match
                        }

                        if (
                            matchAltImage &&
                            matchAltImage.length > matchedImage.length
                        ) {
                            matchedImage = matchAltImage
                            currConfig = longerAltConfig
                        }
                    }
                    break
                }
            }
            // successful match
            if (matchedImage !== null) {
                // matchedImage = match[0]
                imageLength = matchedImage.length
                group = currConfig.group
                if (group !== undefined) {
                    tokType = currConfig.tokenType
                    // TODO: "offset + imageLength" and the new column may be computed twice in case of "full" location information inside
                    // createFullToken method
                    newToken = this.createTokenInstance(
                        matchedImage,
                        offset,
                        tokType,
                        line,
                        column,
                        imageLength
                    )

                    if (group === false) {
                        matchedTokens.push(newToken)
                    } else {
                        groups[group].push(newToken)
                    }
                }
                text = this.chopInput(text, imageLength)
                offset = offset + imageLength

                // TODO: with newlines the column may be assigned twice
                column = this.computeNewColumn(column, imageLength)

                if (
                    trackLines === true &&
                    currConfig.canLineTerminator === true
                ) {
                    let numOfLTsInMatch = 0
                    let nl
                    let lastLTIdx
                    nlRegExp.lastIndex = 0
                    do {
                        nl = nlRegExp.exec(matchedImage)
                        if (nl !== null) {
                            lastLTIdx = nl.index
                            numOfLTsInMatch++
                        }
                    } while (nl)

                    if (numOfLTsInMatch !== 0) {
                        line = line + numOfLTsInMatch
                        column = imageLength - lastLTIdx
                        this.updateTokenEndLineColumnLocation(
                            newToken,
                            group,
                            lastLTIdx,
                            numOfLTsInMatch,
                            line,
                            column,
                            imageLength
                        )
                    }
                }
                // will be NOOP if no modes present
                this.handleModes(i, currConfig, pop_mode, push_mode, newToken)
            } else {
                // error recovery, drop characters until we identify a valid token's start point
                let errorStartOffset = offset
                let errorLine = line
                let errorColumn = column
                let foundResyncPoint = false
                while (!foundResyncPoint && offset < orgLength) {
                    // drop chars until we succeed in matching something
                    droppedChar = orgText.charCodeAt(offset)
                    if (
                        droppedChar === 10 || // '\n'
                        (droppedChar === 13 &&
                            (offset === orgLength - 1 ||
                                (offset < orgLength - 1 &&
                                    orgText.charCodeAt(offset + 1) !== 10)))
                    ) {
                        //'\r' not
                        // followed by
                        // '\n'
                        line++
                        column = 1
                    } else {
                        // this else also matches '\r\n' which is fine, the '\n' will be counted
                        // either when skipping the next char, or when consuming the following pattern
                        // (which will have to start in a '\n' if we manage to consume it)
                        column++
                    }
                    // Identity Func (when sticky flag is enabled)
                    text = this.chopInput(text, 1)
                    offset++
                    for (j = 0; j < currModePatternsLength; j++) {
                        let currConfig = patternIdxToConfig[j]
                        let currPattern = currConfig.pattern

                        // manually in-lined because > 600 chars won't be in-lined in V8
                        let singleCharCode = currConfig.short
                        if (singleCharCode !== false) {
                            if (orgText.charCodeAt(offset) === singleCharCode) {
                                // single character string
                                foundResyncPoint = true
                            }
                        } else if (currConfig.isCustom === true) {
                            foundResyncPoint =
                                currPattern.exec(
                                    orgText,
                                    offset,
                                    matchedTokens,
                                    groups
                                ) !== null
                        } else {
                            this.updateLastIndex(currPattern, offset)
                            foundResyncPoint = currPattern.exec(text) !== null
                        }

                        if (foundResyncPoint === true) {
                            break
                        }
                    }
                }

                errLength = offset - errorStartOffset
                // at this point we either re-synced or reached the end of the input text
                msg =
                    `unexpected character: ->${orgText.charAt(
                        errorStartOffset
                    )}<- at offset: ${errorStartOffset},` +
                    ` skipped ${offset - errorStartOffset} characters.`
                errors.push({
                    offset: errorStartOffset,
                    line: errorLine,
                    column: errorColumn,
                    length: errLength,
                    message: msg
                })
            }
        }

        return { tokens: matchedTokens, groups: groups, errors: errors }
    }

    private handleModes(i, config, pop_mode, push_mode, newToken) {
        if (config.pop === true) {
            // need to save the PUSH_MODE property as if the mode is popped
            // patternIdxToPopMode is updated to reflect the new mode after popping the stack
            let pushMode = config.push
            pop_mode(newToken)
            if (pushMode !== undefined) {
                push_mode.call(this, pushMode)
            }
        } else if (config.push !== undefined) {
            push_mode.call(this, config.push)
        }
    }

    private chopInput(text, length): string {
        return text.substring(length)
    }

    private updateLastIndex(regExp, newLastIndex): void {
        regExp.lastIndex = newLastIndex
    }

    // TODO: decrease this under 600 characters? inspect stripping comments option in TSC compiler
    private updateTokenEndLineColumnLocation(
        newToken,
        group,
        lastLTIdx,
        numOfLTsInMatch,
        line,
        column,
        imageLength
    ): void {
        let lastCharIsLT, fixForEndingInLT
        if (group !== undefined) {
            // a none skipped multi line Token, need to update endLine/endColumn
            lastCharIsLT = lastLTIdx === imageLength - 1
            fixForEndingInLT = lastCharIsLT ? -1 : 0
            if (!(numOfLTsInMatch === 1 && lastCharIsLT === true)) {
                // if a token ends in a LT that last LT only affects the line numbering of following Tokens
                newToken.endLine = line + fixForEndingInLT
                // the last LT in a token does not affect the endColumn either as the [columnStart ... columnEnd)
                // inclusive to exclusive range.
                newToken.endColumn = column - 1 + -fixForEndingInLT
            }
            // else single LT in the last character of a token, no need to modify the endLine/EndColumn
        }
    }

    private computeNewColumn(oldColumn, imageLength) {
        return oldColumn + imageLength
    }

    // Place holder, will be replaced by the correct variant according to the locationTracking option at runtime.
    /* istanbul ignore next - place holder */
    private createTokenInstance(...args: any[]): IToken {
        return null
    }

    private createOffsetOnlyToken(image, startOffset, tokenType) {
        return {
            image,
            startOffset,
            tokenType
        }
    }

    private createStartOnlyToken(
        image,
        startOffset,
        tokenType,
        startLine,
        startColumn
    ) {
        return {
            image,
            startOffset,
            startLine,
            startColumn,
            tokenType
        }
    }

    private createFullToken(
        image,
        startOffset,
        tokenType,
        startLine,
        startColumn,
        imageLength
    ) {
        return {
            image,
            startOffset,
            endOffset: startOffset + imageLength - 1,
            startLine,
            endLine: startLine,
            startColumn,
            endColumn: startColumn + imageLength - 1,
            tokenType
        }
    }

    private addTokenTypeNamesToResult(lexResult: ILexingResult): void {
        forEach(lexResult.tokens, currToken => {
            currToken.tokenClassName = tokenName(getTokenConstructor(currToken))
        })

        forEach(lexResult.groups, currGroup => {
            forEach(currGroup, currToken => {
                currToken.tokenClassName = tokenName(
                    getTokenConstructor(currToken)
                )
            })
        })
    }
}
