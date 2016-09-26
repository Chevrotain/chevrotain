import {isString, isRegExp, isFunction, isUndefined, assignNoOverwrite} from "../utils/utils"
import {functionName, defineNameProp} from "../lang/lang_extensions"
import {Lexer, TokenConstructor} from "./lexer_public"
import {
    isInheritanceBasedToken,
    getStartLineFromLazyToken,
    getStartColumnFromLazyToken,
    getEndLineFromLazyToken,
    getEndColumnFromLazyToken,
    getImageFromLazyToken,
    tokenIdxToClass,
    tokenInstanceofMatcher,
    tokenStructuredMatcher,
    augmentTokenClasses
} from "./tokens"

/**
 *  This can be used to improve the quality/readability of error messages or syntax diagrams.
 *
 * @param {Function} clazz - A constructor for a Token subclass
 * @returns {string} - The Human readable label a Token if it exists.
 */
export function tokenLabel(clazz:Function):string {
    if (hasTokenLabel(clazz)) {
        return (<any>clazz).LABEL
    }
    else {

        return tokenName(clazz)
    }
}

export function hasTokenLabel(clazz:Function):boolean {
    return isString((<any>clazz).LABEL) && (<any>clazz).LABEL !== ""
}

export function tokenName(clazz:Function):string {
    // The tokenName property is needed under some old versions of node.js (0.10/0.12)
    // where the Function.prototype.name property is not defined as a 'configurable' property
    // enable producing readable error messages.
    /* istanbul ignore if -> will only run in old versions of node.js */
    if (isString((<any>clazz).tokenName)) {
        return (<any>clazz).tokenName
    }
    else {
        return functionName(clazz)
    }
}

export function extendLazyToken(tokenName:string, patternOrParent:any = undefined,
                                parentConstructor:Function = LazyToken):TokenConstructor {
    return extendToken(tokenName, patternOrParent, parentConstructor)
}

export function extendSimpleLazyToken(tokenName:string, patternOrParent:any = undefined,
                                      parentConstructor:Function = SimpleLazyToken):TokenConstructor {
    return extendToken(tokenName, patternOrParent, SimpleLazyToken)
}

/**
 * utility to help the poor souls who are still stuck writing pure javascript 5.1
 * extend and create Token subclasses in a less verbose manner
 *
 * @param {string} tokenName - The name of the new TokenClass
 * @param {RegExp|Function} patternOrParent - RegExp Pattern or Parent Token Constructor
 * @param {Function} parentConstructor - The Token class to be extended
 * @returns {Function} - A constructor for the new extended Token subclass
 */
export function extendToken(tokenName:string, patternOrParent:any = undefined, parentConstructor:Function = Token):TokenConstructor {
    let pattern

    if (isRegExp(patternOrParent) ||
        patternOrParent === Lexer.SKIPPED ||
        patternOrParent === Lexer.NA) {
        pattern = patternOrParent
    }
    else if (isFunction(patternOrParent)) {
        parentConstructor = patternOrParent
        pattern = undefined
    }

    let derivedConstructor:any = function () {
        parentConstructor.apply(this, arguments)
    }

    // can be overwritten according to:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/
    // name?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fname
    /* istanbul ignore if -> will only run in old versions of node.js */
    if (!defineNameProp(derivedConstructor, tokenName)) {
        // hack to save the tokenName in situations where the constructor's name property cannot be reconfigured
        derivedConstructor.tokenName = tokenName
    }

    derivedConstructor.prototype = Object.create(parentConstructor.prototype)
    derivedConstructor.prototype.constructor = derivedConstructor
    if (!isUndefined(pattern)) {
        derivedConstructor.PATTERN = pattern
    }

    augmentTokenClasses([derivedConstructor])

    // static properties mixing
    derivedConstructor = assignNoOverwrite(derivedConstructor, parentConstructor)

    return derivedConstructor
}

export interface ISimpleToken {
    startOffset:number
    endOffset:number
    isInsertedInRecovery?:boolean
}

export interface ISimpleLazyToken extends ISimpleToken {
    tokenType:number
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
export interface IToken extends ISimpleToken {
    image:string
    startOffset:number
    startLine:number
    startColumn:number
    endOffset:number
    endLine:number
    endColumn:number
}

export interface ISimpleTokenOrIToken extends ISimpleToken {
    image?:string
    startLine?:number
    startColumn?:number
    endLine?:number
    endColumn?:number
}

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
    static LABEL:string = undefined

    // this marks if a Token does not really exist and has been inserted "artificially" during parsing in rule error recovery
    public isInsertedInRecovery:boolean = false

    /**
     * @param {string} image - The textual representation of the Token as it appeared in the text.
     * @param {number} startOffset - Offset of the first character of the Token.
     * @param {number} startLine - Line of the first character of the Token.
     * @param {number} startColumn - Column of the first character of the Token.
     * @param {number} endLine - Line of the last character of the Token.
     * @param {number} endColumn - Column of the last character of the Token.
     */
    constructor(public image:string,
                public startOffset:number,
                public startLine:number,
                public startColumn:number,
                public endLine:number = startLine,
                public endColumn:number = startColumn + image.length - 1) {}

    get endOffset():number {
        return this.startOffset + this.image.length - 1
    }

    /**
     * @deprecated
     * An Alias for getting the startOffset. this is deprecated and remains only to be backwards compatiable.
     * This API will be removed in future version of Chevrotain.
     */
    get offset():number {
        return this.startOffset
    }

    /**
     * @deprecated
     * An Alias for setting the startOffset. this is deprecated and remains only to be backwards compatiable.
     * This API will be removed in future version of Chevrotain.
     */
    set offset(newOffset:number) {
        this.startOffset = newOffset
    }
}

export interface LazyTokenCacheData {
    orgText:string,
    lineToOffset:number[]
}

/**
 * @see IToken
 * @see Token
 *
 * Same API as a IToken, using a Lazy implementation, with most properties being immutable.
 * See related doc in: https://github.com/SAP/chevrotain/blob/startO/docs/faq.md#-how-do-i-maximize-my-parsers-performance
 * ("Use Lazy Tokens" section)
 */
export class LazyToken implements IToken {

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
    static LABEL:string = undefined

    public isInsertedInRecovery:boolean

    constructor(public startOffset:number,
                public endOffset:number,
                protected cacheData:LazyTokenCacheData) {}

    get image():string {
        return getImageFromLazyToken(this)
    }

    get startLine():number {
        return getStartLineFromLazyToken(this)
    }

    get startColumn():number {
        return getStartColumnFromLazyToken(this)
    }

    get endLine():number {
        return getEndLineFromLazyToken(this)
    }

    get endColumn():number {
        return getEndColumnFromLazyToken(this)
    }
}

/**
 * @see IToken
 * @see LazyToken
 *
 * A Less complex LazyToken used to increase performance.
 * Instances of SimpleLazyToken will not actually inherit from it using prototype inheritance.
 * Instead they will be simple JS Objects (Simple Structures)
 * {
 *    startOffset : 10,
 *    endOffset   : 16,
 *    tokenType   : 66,
 *    cacheData   : cacheData
 * }
 *
 * The additional computed properties (startLine/StartColumn/...) of the IToken interface can be computed using
 * The provided Utility methods (getImage, getStartColumn, getEndLine, ...)
 *
 * This makes SimpleLazyTokens slightly less convenient, however this can produce a substantial increase in performance
 * which may be relevant in certain use cases where performance is of paramount concern.
 */
export class SimpleLazyToken implements ISimpleLazyToken {
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
    static LABEL:string = undefined

    // This constructor is never actually called as simpleLazyToken are just a Structure.
    // However this class must still exist as the definition and hierarchy of the SimpleLazyTokens
    // still uses the standard prototype chain.
    /* istanbul ignore next */
    constructor(public startOffset:number,
                public endOffset:number,
                public tokenType:number,
                protected cacheData:LazyTokenCacheData) {}
}

/**
 * A special kind of Token which does not really exist in the input
 * (hence the 'Virtual' prefix). These type of Tokens can be used as special markers:
 * for example, EOF (end-of-file).
 */
export class VirtualToken extends Token {
    constructor() {super("", NaN, NaN, NaN, NaN, NaN) }
}

export class EOF extends VirtualToken {
}
augmentTokenClasses([EOF])

// Token Getter Utilities
export function getImage(token:ISimpleTokenOrIToken):string {
    return isInheritanceBasedToken(token) ?
        (<IToken>token).image :
        getImageFromLazyToken(token)
}

export function getStartOffset(token:ISimpleTokenOrIToken):number {
    return token.startOffset
}

export function getStartLine(token:ISimpleTokenOrIToken):number {
    return isInheritanceBasedToken(token) ?
        (<IToken>token).startLine :
        getStartLineFromLazyToken(token)
}

export function getStartColumn(token:ISimpleTokenOrIToken):number {
    return isInheritanceBasedToken(token) ?
        (<IToken>token).startColumn :
        getStartColumnFromLazyToken(token)
}

export function getEndOffset(token:ISimpleTokenOrIToken):number {
    return token.endOffset
}

export function getEndLine(token:ISimpleTokenOrIToken):number {
    return isInheritanceBasedToken(token) ?
        (<IToken>token).endLine :
        getEndLineFromLazyToken(token)
}

export function getEndColumn(token:ISimpleTokenOrIToken):number {
    return isInheritanceBasedToken(token) ?
        (<IToken>token).endColumn :
        getEndColumnFromLazyToken(token)
}

/**
 * Given a Token instance, will return the Token Constructor.
 * Note that this function is not just for convenience, Because a SimpleLazyToken "instance'
 * Does not use standard prototype inheritance and thus it's constructor cannot be accessed
 * by traversing the prototype chain.
 *
 * @param tokenInstance {ISimpleTokenOrIToken}
 * @returns {TokenConstructor}
 */
export function getTokenConstructor(tokenInstance:ISimpleTokenOrIToken):TokenConstructor {
    let tokenIdx
    if (isInheritanceBasedToken(tokenInstance)) {
        tokenIdx = (<any>tokenInstance).constructor.tokenType
    }
    else {
        tokenIdx = (<ISimpleLazyToken>tokenInstance).tokenType
    }

    return tokenIdxToClass.get(tokenIdx)
}

/**
 * A Utility method to check if a token instance of of the type of a specific Token class.
 * Simply using instanceof is not enough because SimpleLazyToken Implementation does not use
 * ECMAScript's built-in prototype inheritance.
 *
 * @param tokInstance {ISimpleTokenOrIToken}
 * @param tokClass {TokenConstructor}
 * @returns {boolean}
 */
export function tokenMatcher(tokInstance:ISimpleTokenOrIToken, tokClass:TokenConstructor):boolean {
    if (LazyToken.prototype.isPrototypeOf(tokClass.prototype) ||
        Token.prototype.isPrototypeOf(tokClass.prototype)) {
        return tokenInstanceofMatcher(tokInstance, tokClass)
    }
    else if (SimpleLazyToken.prototype.isPrototypeOf(tokClass.prototype)) {
        return tokenStructuredMatcher(tokInstance, tokClass)
    }
    else {
        throw Error("non exhaustive match")
    }
}
