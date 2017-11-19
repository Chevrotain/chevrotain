import {
    assignNoOverwrite,
    has,
    isObject,
    isString,
    isUndefined
} from "../utils/utils"
import { defineNameProp, functionName } from "../lang/lang_extensions"
import { TokenConstructor } from "./lexer_public"
import {
    augmentTokenClasses,
    tokenIdxToClass,
    tokenStructuredMatcher
} from "./tokens"

import {Lexer} from "./lexer_public"
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
 * @param {Function} clazz - A constructor for a Token subclass
 * @returns {string} - The Human readable label for a Token if it exists.
 */
export function tokenLabel(clazz: Function): string {
    if (hasTokenLabel(clazz)) {
        return (<any>clazz).LABEL
    } else {
        return tokenName(clazz)
    }
}

export function hasTokenLabel(clazz: Function): boolean {
    return isString((<any>clazz).LABEL) && (<any>clazz).LABEL !== ""
}

export function tokenName(clazz: Function): string {
    // The tokenName property is needed under some old versions of node.js (0.10/0.12)
    // where the Function.prototype.name property is not defined as a 'configurable' property
    // enable producing readable error messages.
    /* istanbul ignore if -> will only run in old versions of node.js */
    if (
        isObject(clazz) &&
        clazz.hasOwnProperty("tokenName") &&
        isString((<any>clazz).tokenName)
    ) {
        return (<any>clazz).tokenName
    } else {
        return functionName(clazz)
    }
}

export interface ITokenConfig {
    name: string
    parent?: TokenConstructor
    label?: string
    pattern?: RegExp | CustomPatternMatcherFunc | ICustomPattern | string
    group?: string | any
    push_mode?: string
    pop_mode?: boolean
    longer_alt?: TokenConstructor
    /**
     * Can a String matching this token's pattern possibly contain a line terminator?
     * If true and the line_breaks property is not also true this will cause inaccuracies in the Lexer's line / column tracking.
     */
    line_breaks?: boolean
}

const PARENT = "parent"
const LABEL = "label"
const GROUP = "group"
const PUSH_MODE = "push_mode"
const POP_MODE = "pop_mode"
const LONGER_ALT = "longer_alt"
const LINE_BREAKS = "line_breaks"

/**
 * @param {ITokenConfig} config - The configuration for
 * @returns {TokenConstructor} - A constructor for the new Token subclass
 */
export function createToken(config: ITokenConfig): TokenConstructor {
    if (!has(config, PARENT)) {
        config.parent = Token
    }

    return createTokenInternal(config)
}

function createTokenInternal(config: ITokenConfig): TokenConstructor {
    let tokenName = config.name
    let parentType = config.parent
    let pattern = config.pattern

    let tokenType:any = {}
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
        tokenType.parent = config[PARENT]
    }

    augmentTokenClasses([tokenType])

    // static properties mixing
    tokenType = assignNoOverwrite(
        tokenType,
        parentType
    )

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
    type?: TokenConstructor

    /** A human readable name of the Token Class, This property will only be avilaible if the Lexer has run in <debugMode>
     *  @see {ILexerConfig} debug flag.
     *
     *  This property should not be used in productive flows as it will not always exist!
     * */
    tokenClassName?: number
}

// TODO: should this be a class?
export class Token implements IToken {
    /**
     * A "human readable" Label for a Token.
     * Subclasses of Token may define their own static LABEL property.
     * This label will be used in error messages and drawing syntax diagrams.
     *
     * For example a Token constructor may be called LCurly, which is short for LeftCurlyBrackets, These names are either too short
     * or too unwieldy to be used in error messages.
     *
     * Imagine : "expecting LCurly but found ')'" or "expecting LeftCurlyBrackets but found ')'"
     *
     * However if a static property LABEL with the value '{' exists on LCurly class, that error message will be:
     * "expecting '{' but found ')'"
     */
    static LABEL: string = undefined

    // this marks if a Token does not really exist and has been inserted "artificially" during parsing in rule error recovery
    public isInsertedInRecovery?: boolean = false

    public image: string
    public startOffset: number
    public startLine?: number
    public startColumn?: number
    public endLine?: number
    public endColumn?: number
    public endOffset?: number

    /**
     * This class is never meant to be initialized.
     * The class hierarchy is used to organize Token metadata, not to create instances of Tokens.
     * Tokens are simple JavaScript objects which are NOT created using the <new> operator.
     * To get the class of a Token "instance" use <getTokenConstructor>.
     */
    constructor() {}
}

export const EOF = createToken({name:"EOF", pattern: Lexer.NA})
augmentTokenClasses([EOF])

/**
 * Utility to create Chevrotain Token "instances"
 * Note that Chevrotain tokens are not real instances, and thus the instanceOf cannot be used.
 *
 * @param tokClass
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
    tokClass: TokenConstructor,
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
        tokenType: (<any>tokClass).tokenType
    }
}

/**
 * Given a Token instance, will return the Token Constructor.
 * Note that this function is not just for convenience, Because a Token "instance'
 * Does not use standard prototype inheritance and thus it's constructor cannot be accessed
 * by traversing the prototype chain.
 *
 * @param tokenInstance {IToken}
 * @returns {TokenConstructor}
 */
export function getTokenConstructor(tokenInstance: IToken): TokenConstructor {
    let tokenIdx
    tokenIdx = tokenInstance.tokenType
    return tokenIdxToClass.get(tokenIdx)
}

/**
 * A Utility method to check if a token is of the type of the argument Token class.
 * Not that while this utility has similar semantics to ECMAScript "instanceOf"
 * As Chevrotain tokens support inheritance.
 *
 * It is not actually implemented using the "instanceOf" operator because
 * Chevrotain Tokens have their own performance optimized inheritance mechanism.
 *
 * @param tokInstance {IToken}
 * @param tokClass {TokenConstructor}
 * @returns {boolean}
 */
export function tokenMatcher(
    tokInstance: IToken,
    tokClass: TokenConstructor
): boolean {
    return tokenStructuredMatcher(tokInstance, tokClass)
}
