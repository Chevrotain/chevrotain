import { has, isObject, isString, isUndefined } from "../utils/utils"
import { defineNameProp, functionName } from "../lang/lang_extensions"
import { Lexer, TokenType } from "./lexer_public"
import { augmentTokenTypes, tokenStructuredMatcher } from "./tokens"
/**
 *  The type of custom pattern matcher functions.
 *  Matches should only be done on the start of the text.
 *  Note that this is similar to the signature of RegExp.prototype.exec
 *
 *  This should behave as if the regExp match is using a start of input anchor.
 *  So: for example if a custom matcher is implemented for Tokens matching: /\w+/
 *  The implementation of the custom matcher must implement a custom matcher for /^\w+/.
 *
 *  The Optional tokens and groups arguments enable accessing information about
 *  previously identified tokens if necessary.
 *
 *  This can be used for example to lex python like indentation.
 *  see: https://github.com/SAP/chevrotain/blob/master/examples/lexer/python_indentation/python_indentation.js
 *  for a fuller example
 */
export type CustomPatternMatcherFunc = (
    test: string,
    offset?: number,
    tokens?: IToken[],
    groups?: { [groupName: string]: IToken }
) => RegExpExecArray

/**
 * Interface for custom user provided token pattern matchers.
 */
export interface ICustomPattern {
    /**
     * The custom pattern implementation.
     * @see CustomPatternMatcherFunc
     */
    exec: CustomPatternMatcherFunc
}

/**
 *  This can be used to improve the quality/readability of error messages or syntax diagrams.
 *
 * @param {TokenType} clazz - A constructor for a Token subclass
 * @returns {string} - The Human readable label for a Token if it exists.
 */
export function tokenLabel(clazz: TokenType): string {
    if (hasTokenLabel(clazz)) {
        return (<any>clazz).LABEL
    } else {
        return tokenName(clazz)
    }
}

export function hasTokenLabel(obj: TokenType): boolean {
    return isString((<any>obj).LABEL) && (<any>obj).LABEL !== ""
}

export function tokenName(obj: TokenType | Function): string {
    // The tokenName property is needed under some old versions of node.js (0.10/0.12)
    // where the Function.prototype.name property is not defined as a 'configurable' property
    // enable producing readable error messages.
    /* istanbul ignore if -> will only run in old versions of node.js */
    if (
        isObject(obj) &&
        obj.hasOwnProperty("tokenName") &&
        isString((<any>obj).tokenName)
    ) {
        return (<any>obj).tokenName
    } else {
        return functionName(obj as TokenType)
    }
}

export interface ITokenConfig {
    name: string
    categories?: TokenType | TokenType[]
    label?: string
    pattern?: RegExp | CustomPatternMatcherFunc | ICustomPattern | string
    group?: string | any
    push_mode?: string
    pop_mode?: boolean
    longer_alt?: TokenType
    /**
     * Can a String matching this token's pattern possibly contain a line terminator?
     * If true and the line_breaks property is not also true this will cause inaccuracies in the Lexer's line / column tracking.
     */
    line_breaks?: boolean
}

const PARENT = "parent"
const CATEGORIES = "categories"
const LABEL = "label"
const GROUP = "group"
const PUSH_MODE = "push_mode"
const POP_MODE = "pop_mode"
const LONGER_ALT = "longer_alt"
const LINE_BREAKS = "line_breaks"

/**
 * @param {ITokenConfig} config - The configuration for
 * @returns {TokenType} - A constructor for the new Token subclass
 */
export function createToken(config: ITokenConfig): TokenType {
    return createTokenInternal(config)
}

function createTokenInternal(config: ITokenConfig): TokenType {
    let tokenName = config.name
    let pattern = config.pattern

    let tokenType: any = {}
    // can be overwritten according to:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/
    // name?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fname
    /* istanbul ignore if -> will only run in old versions of node.js */
    if (!defineNameProp(tokenType, tokenName)) {
        // hack to save the tokenName in situations where the constructor's name property cannot be reconfigured
        tokenType.tokenName = tokenName
    }

    if (!isUndefined(pattern)) {
        tokenType.PATTERN = pattern
    }

    if (has(config, PARENT)) {
        throw "The parent property is no longer supported.\n" +
            "See: [TODO-add link] for details."
    }

    if (has(config, CATEGORIES)) {
        tokenType.CATEGORIES = config[CATEGORIES]
    }

    augmentTokenTypes([tokenType])

    if (has(config, LABEL)) {
        tokenType.LABEL = config[LABEL]
    }

    if (has(config, GROUP)) {
        tokenType.GROUP = config[GROUP]
    }

    if (has(config, POP_MODE)) {
        tokenType.POP_MODE = config[POP_MODE]
    }

    if (has(config, PUSH_MODE)) {
        tokenType.PUSH_MODE = config[PUSH_MODE]
    }

    if (has(config, LONGER_ALT)) {
        tokenType.LONGER_ALT = config[LONGER_ALT]
    }

    if (has(config, LINE_BREAKS)) {
        tokenType.LINE_BREAKS = config[LINE_BREAKS]
    }

    return tokenType
}

/**
 *   *
 * Things to note:
 * - "do"  {
 *          startColumn : 1, endColumn: 2,
 *          startOffset: x, endOffset: x +1} --> the range is inclusive to exclusive 1...2 (2 chars long).
 *
 * - "\n"  {startLine : 1, endLine: 1} --> a lineTerminator as the last character does not effect the Token's line numbering.
 *
 * - "'hello\tworld\uBBBB'"  {image: "'hello\tworld\uBBBB'"} --> a Token's image is the "literal" text
 *                                                              (unicode escaping is untouched).
 */
export interface IToken {
    /** The textual representation of the Token as it appeared in the text. */
    image: string

    /** Offset of the first character of the Token. */
    startOffset: number

    /** Line of the first character of the Token. */
    startLine?: number

    /** Column of the first character of the Token. */
    startColumn?: number

    /** Offset of the last character of the Token. */
    endOffset?: number

    /** Line of the last character of the Token. */
    endLine?: number

    /** Column of the last character of the Token. */
    endColumn?: number

    /** this marks if a Token does not really exist and has been inserted "artificially" during parsing in rule error recovery. */
    isInsertedInRecovery?: boolean

    /** An number index representing the type of the Token use <getTokenConstructor> to get the Token Type from a token "instance"  */
    tokenType?: number

    /**
     * The actual Token Type of this Token "instance"
     * This is the same Object returned by the "createToken" API.
     * This property is very useful for debugging the Lexing and Parsing phases.
     */
    type?: TokenType

    /** A human readable name of the Token Class, This property will only be avilaible if the Lexer has run in <debugMode>
     *  @see {ILexerConfig} debug flag.
     *
     *  This property should not be used in productive flows as it will not always exist!
     * */
    tokenClassName?: number
}

export const EOF = createToken({ name: "EOF", pattern: Lexer.NA })
augmentTokenTypes([EOF])

/**
 * Utility to create Chevrotain Token "instances"
 * Note that Chevrotain tokens are not real instances, and thus the instanceOf cannot be used.
 *
 * @param tokType
 * @param image
 * @param startOffset
 * @param endOffset
 * @param startLine
 * @param endLine
 * @param startColumn
 * @param endColumn
 * @returns {{image: string,
 *            startOffset: number,
 *            endOffset: number,
 *            startLine: number,
 *            endLine: number,
 *            startColumn: number,
 *            endColumn: number,
 *            tokenType}}
 */
export function createTokenInstance(
    tokType: TokenType,
    image: string,
    startOffset: number,
    endOffset: number,
    startLine: number,
    endLine: number,
    startColumn: number,
    endColumn: number
): IToken {
    return {
        image,
        startOffset,
        endOffset,
        startLine,
        endLine,
        startColumn,
        endColumn,
        tokenType: (<any>tokType).tokenType,
        type: tokType
    }
}

/**
 * A Utility method to check if a token is of the type of the argument Token class.
 * This utility is needed because Chevrotain tokens support "categories" which means
 * A TokenType may have multiple categories, so a TokenType for the "true" literal in JavaScript
 * May be both a Keyword Token and a Literal Token.
 *
 * @param token {IToken}
 * @param tokType {TokenType}
 * @returns {boolean}
 */
export function tokenMatcher(token: IToken, tokType: TokenType): boolean {
    return tokenStructuredMatcher(token, tokType)
}
