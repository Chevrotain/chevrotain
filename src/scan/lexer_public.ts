import { CustomPatternMatcherFunc, IToken } from "./tokens_public"
import {
    analyzeTokenTypes,
    cloneEmptyGroups,
    DEFAULT_MODE,
    LineTerminatorOptimizedTester,
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
import { augmentTokenTypes } from "./tokens"

export interface TokenType {
    GROUP?: string
    PATTERN?: RegExp | string
    LABEL?: string
    LONGER_ALT?: TokenType
    POP_MODE?: boolean
    PUSH_MODE?: string
    LINE_BREAKS?: boolean
    CATEGORIES?: TokenType[]

    tokenName?: string
    tokenTypeIdx?: number
    categoryMatches?: number[]
    categoryMatchesMap?: { [tokType: number]: boolean }
    isParent?: boolean
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
    EMPTY_MATCH_PATTERN,
    NO_LINE_BREAKS_FLAGS,
    UNREACHABLE_PATTERN
}

export interface ILexerDefinitionError {
    message: string
    type: LexerDefinitionErrorType
    tokenTypes?: TokenType[]
}

export interface ILexingError {
    offset: number
    line: number
    column: number
    length: number
    message: string
}

export type SingleModeLexerDefinition = TokenType[]
export type MultiModesDefinition = { [modeName: string]: TokenType[] }

export interface IMultiModeLexerDefinition {
    modes: MultiModesDefinition
    defaultMode: string
}

export interface IRegExpExec {
    exec: CustomPatternMatcherFunc
}

/**
 * A subset of the regExp interface.
 * Needed to compute line/column info by a chevrotain lexer.
 */
export interface ILineTerminatorsTester {
    /**
     * Just like regExp.test
     */
    test: (text: string) => boolean
    /**
     * Just like the regExp lastIndex with the global flag enabled
     * It should be updated after every match to point to the offset where the next
     * match attempt starts.
     */
    lastIndex: number
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
     * A regExp defining custom line terminators.
     * This will be used to calculate the line and column information.
     *
     * Note that the regExp should use the global flag, for example: /\n/g
     *
     * The default is: /\n|\r\n?/g
     *
     * But some grammars have a different definition, for example in ECMAScript:
     * http://www.ecma-international.org/ecma-262/8.0/index.html#sec-line-terminators
     * U+2028 and U+2029 are also treated as line terminators.
     *
     * In that case we would use /\n|\r|\u2028|\u2029/g
     *
     * Note that it is also possible to supply an optimized RegExp like implementation
     * as only a subset of the RegExp is needed, @see {ILineTerminatorsRegExp}
     * for details.
     *
     * keep in mind that for the default pattern: /\n|\r\n?/g an optimized implementation is already built-in.
     * This means the optimization is only relevant for lexers overriding the default pattern.
     */
    lineTerminatorsPattern?: RegExp | ILineTerminatorsTester
}

const DEFAULT_LEXER_CONFIG: ILexerConfig = {
    deferDefinitionErrorsHandling: false,
    positionTracking: "full",
    lineTerminatorsPattern: /\n|\r\n?/g
}

Object.freeze(DEFAULT_LEXER_CONFIG)

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
    private hasCustom: boolean = false

    /**
     * @param {SingleModeLexerDefinition | IMultiModeLexerDefinition} lexerDefinition -
     *  Structure composed of constructor functions for the Tokens types this lexer will support.
     *
     *  In the case of {SingleModeLexerDefinition} the structure is simply an array of TokenTypes.
     *  In the case of {IMultiModeLexerDefinition} the structure is an object with two properties:
     *    1. a "modes" property where each value is an array of TokenTypes.
     *    2. a "defaultMode" property specifying the initial lexer mode.
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
     *  Each Token Type can define that it will cause the Lexer to (after consuming an "instance" of the Token):
     *  1. PUSH_MODE : push a new mode to the "mode stack"
     *  2. POP_MODE  : pop the last mode from the "mode stack"
     *
     *  Examples:
     *       export class Attribute {
     *          static PATTERN = ...
     *          static PUSH_MODE = "modeY"
     *       }
     *
     *       export class EndAttribute {
     *          static PATTERN = ...
     *          static POP_MODE = true
     *       }
     *
     *  The TokenTypes must be in one of these forms:
     *
     *  1. With a PATTERN property that has a RegExp value for tokens to match:
     *     example: -->class Integer { static PATTERN = /[1-9]\d }<--
     *
     *  2. With a PATTERN property that has the value of the var Lexer.NA defined above.
     *     This is a convenience form used to avoid matching Token classes that only act as categories.
     *     example: -->class Keyword { static PATTERN = NA }<--
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
     *       export class Keyword Token {
     *          static PATTERN = Lexer.NA
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

        // todo: defaults func?
        this.config = merge(DEFAULT_LEXER_CONFIG, config)

        if (
            this.config.lineTerminatorsPattern ===
            DEFAULT_LEXER_CONFIG.lineTerminatorsPattern
        ) {
            // optimized built-in implementation for the defaults definition of lineTerminators
            this.config.lineTerminatorsPattern = LineTerminatorOptimizedTester
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
            actualDefinition.modes[
                DEFAULT_MODE
            ] = cloneArr(<SingleModeLexerDefinition>lexerDefinition)
            actualDefinition[DEFAULT_MODE] = DEFAULT_MODE
        } else {
            // no conversion needed, input should already be a IMultiModeLexerDefinition
            hasOnlySingleMode = false
            actualDefinition = cloneObj(
                <IMultiModeLexerDefinition>lexerDefinition
            )
        }

        this.lexerDefinitionErrors = this.lexerDefinitionErrors.concat(
            performRuntimeChecks(actualDefinition, this.trackStartLines)
        )

        // for extra robustness to avoid throwing an none informative error message
        actualDefinition.modes = actualDefinition.modes
            ? actualDefinition.modes
            : {}

        // an error of undefined TokenTypes will be detected in "performRuntimeChecks" above.
        // this transformation is to increase robustness in the case of partially invalid lexer definition.
        forEach(actualDefinition.modes, (currModeValue, currModeName) => {
            actualDefinition.modes[currModeName] = reject<
                TokenType
            >(currModeValue, currTokType => isUndefined(currTokType))
        })

        let allModeNames = keys(actualDefinition.modes)

        forEach(
            actualDefinition.modes,
            (currModDef: TokenType[], currModName) => {
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
                    augmentTokenTypes(currModDef)
                    let currAnalyzeResult = analyzeTokenTypes(currModDef)

                    this.patternIdxToConfig[currModName] =
                        currAnalyzeResult.patternIdxToConfig
                    this.emptyGroups = merge(
                        this.emptyGroups,
                        currAnalyzeResult.emptyGroups
                    )

                    this.hasCustom =
                        currAnalyzeResult.hasCustom || this.hasCustom
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

        // Choose the relevant internal implementations for this specific parser.
        // These implementations should be in-lined by the JavaScript engine
        // to provide optimal performance in each scenario.
        if (SUPPORT_STICKY) {
            this.chopInput = <any>IDENTITY
            this.match = this.matchWithTest
        } else {
            this.updateLastIndex = NOOP
            this.match = this.matchWithExec
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

        if (this.hasCustom) {
            this.addToken = this.addTokenUsingPush
        } else {
            this.addToken = this.addTokenUsingMemberAccess
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
            msg,
            match
        let orgText = text
        let orgLength = orgText.length
        let offset = 0
        let matchedTokensIndex = 0
        // initializing the tokensArray to the "guessed" size.
        // guessing too little will still reduce the number of array re-sizes on pushes.
        // guessing too large (Tested by guessing x4 too large) may cost a bit more of memory
        // but would still have a faster runtime by avoiding (All but one) array resizing.
        let guessedNumberOfTokens = this.hasCustom
            ? 0 // will break custom token pattern APIs the matchedTokens array will contain undefined elements.
            : Math.floor(text.length / 10)
        let matchedTokens = new Array(guessedNumberOfTokens)
        let errors: ILexingError[] = []
        let line = this.trackStartLines ? 1 : undefined
        let column = this.trackStartLines ? 1 : undefined
        let groups: any = cloneEmptyGroups(this.emptyGroups)
        let trackLines = this.trackStartLines
        const lineTerminatorPattern = this.config.lineTerminatorsPattern

        let currModePatternsLength = 0
        let patternIdxToConfig = []

        let modeStack = []
        let pop_mode = popToken => {
            // TODO: perhaps avoid this error in the edge case there is no more input?
            if (
                modeStack.length === 1 &&
                // if we have both a POP_MODE and a PUSH_MODE this is in-fact a "transition"
                // So no error should occur.
                popToken.tokenType.PUSH_MODE === undefined
            ) {
                // if we try to pop the last mode there lexer will no longer have ANY mode.
                // thus the pop is ignored, an error will be created and the lexer will continue parsing in the previous mode.
                let msg = `Unable to pop Lexer Mode after encountering Token ->${popToken.image}<- The Mode Stack is empty`
                errors.push({
                    offset: popToken.startOffset,
                    line:
                        popToken.startLine !== undefined
                            ? popToken.startLine
                            : undefined,
                    column:
                        popToken.startColumn !== undefined
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
                    matchedImage = this.match(currPattern, text, offset)
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
                            matchAltImage = this.match(
                                longerAltPattern,
                                text,
                                offset
                            )
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
                    tokType = currConfig.tokenTypeIdx
                    // TODO: "offset + imageLength" and the new column may be computed twice in case of "full" location information inside
                    // createFullToken method
                    newToken = this.createTokenInstance(
                        matchedImage,
                        offset,
                        tokType,
                        currConfig.tokenType,
                        line,
                        column,
                        imageLength
                    )

                    if (group === false) {
                        matchedTokensIndex = this.addToken(
                            matchedTokens,
                            matchedTokensIndex,
                            newToken
                        )
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
                    let foundTerminator
                    let lastLTEndOffset
                    lineTerminatorPattern.lastIndex = 0
                    do {
                        foundTerminator = lineTerminatorPattern.test(
                            matchedImage
                        )
                        if (foundTerminator === true) {
                            lastLTEndOffset =
                                lineTerminatorPattern.lastIndex - 1
                            numOfLTsInMatch++
                        }
                    } while (foundTerminator)

                    if (numOfLTsInMatch !== 0) {
                        line = line + numOfLTsInMatch
                        column = imageLength - lastLTEndOffset
                        this.updateTokenEndLineColumnLocation(
                            newToken,
                            group,
                            lastLTEndOffset,
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

        // if we do have custom patterns which push directly into the
        if (!this.hasCustom) {
            // if we guessed a too large size for the tokens array this will shrink it to the right size.
            matchedTokens.length = matchedTokensIndex
        }

        return {
            tokens: matchedTokens,
            groups: groups,
            errors: errors
        }
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

    private createOffsetOnlyToken(image, startOffset, tokenTypeIdx, tokenType) {
        return {
            image,
            startOffset,
            tokenTypeIdx,
            tokenType
        }
    }

    private createStartOnlyToken(
        image,
        startOffset,
        tokenTypeIdx,
        tokenType,
        startLine,
        startColumn
    ) {
        return {
            image,
            startOffset,
            startLine,
            startColumn,
            tokenTypeIdx,
            tokenType
        }
    }

    private createFullToken(
        image,
        startOffset,
        tokenTypeIdx,
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
            tokenTypeIdx,
            tokenType
        }
    }

    // Place holder, will be replaced by the correct variant according to the locationTracking option at runtime.
    /* istanbul ignore next - place holder */
    private addToken(tokenVector, index, tokenToAdd): number {
        return 666
    }

    private addTokenUsingPush(tokenVector, index, tokenToAdd): number {
        tokenVector.push(tokenToAdd)
        return index
    }

    private addTokenUsingMemberAccess(tokenVector, index, tokenToAdd): number {
        tokenVector[index] = tokenToAdd
        index++
        return index
    }

    /* istanbul ignore next - place holder to be replaced with chosen alternative at runtime */
    private match(pattern: RegExp, text: string, offset?: number): string {
        return null
    }

    private matchWithTest(
        pattern: RegExp,
        text: string,
        offset: number
    ): string {
        let found = pattern.test(text)
        if (found === true) {
            return text.substring(offset, pattern.lastIndex)
        }
        return null
    }

    private matchWithExec(pattern, text): string {
        let regExpArray = pattern.exec(text)
        return regExpArray !== null ? regExpArray[0] : regExpArray
    }
}
