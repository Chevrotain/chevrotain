import {isString, isRegExp, isFunction, assign, isUndefined, isEmpty} from "../utils/utils"
import {functionName, defineNameProp} from "../lang/lang_extensions"
import {Lexer} from "./lexer_public"
import {
    fillUpLineToOffset,
    getStartLineFromLineToOffset,
    getStartColumnFromLineToOffset,
    getEndLineFromLineToOffset,
    getEndColumnFromLineToOffset
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

export function extendLazyToken(tokenName:string, patternOrParent:any = undefined, parentConstructor:Function = LazyToken) {
    return extendToken(tokenName, patternOrParent, parentConstructor)
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
export function extendToken(tokenName:string, patternOrParent:any = undefined, parentConstructor:Function = Token) {
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

    let derivedCostructor:any = function () {
        parentConstructor.apply(this, arguments)
    }

    // static properties mixing
    derivedCostructor = assign(derivedCostructor, parentConstructor)

    // can be overwritten according to:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/
    // name?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fname
    /* istanbul ignore if -> will only run in old versions of node.js */
    if (!defineNameProp(derivedCostructor, tokenName)) {
        // hack to save the tokenName in situations where the constructor's name property cannot be reconfigured
        derivedCostructor.tokenName = tokenName
    }

    derivedCostructor.prototype = Object.create(parentConstructor.prototype)
    derivedCostructor.prototype.constructor = derivedCostructor
    if (!isUndefined(pattern)) {
        derivedCostructor.PATTERN = pattern
    }

    return derivedCostructor
}

export class Token {

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
     * @param {number} offset - Offset of the first character of the Token.
     * @param {number} startLine - Line of the first character of the Token.
     * @param {number} startColumn - Column of the first character of the Token.
     * @param {number} endLine - Line of the last character of the Token.
     * @param {number} endColumn - Column of the last character of the Token.
     *
     * Things to note:
     * - "do"  {
     *          startColumn : 1, endColumn: 2,
     *          startOffset: x, endOffset: x +1} --> the range is inclusive to exclusive 1...2 (2 chars long)
     *          .
     * - "\n"  {startLine : 1, endLine: 1} --> a lineTerminator as the last character does not effect the Token's line numbering.
     * - "'hello\tworld\uBBBB'"  {image: "'hello\tworld\uBBBB'"} --> a Token's image is the "literal" text
     *                                                              (unicode escaping is untouched).
     */
    constructor(public image:string,
                // TODO: rename to startOffset???
                public offset:number,
                public startLine:number,
                public startColumn:number,
                public endLine:number = startLine,
                public endColumn:number = startColumn + image.length - 1
                // TODO: enable this prop in a separate commit
                // also need to add it to LazyToken
                // public endOffset:number = offset + image.length - 1
    ) {}

}

export interface LazyTokenCacheData {
    orgText:string,
    lineToOffset:number[]
}

export class LazyToken implements Token {

    public isInsertedInRecovery:boolean

    constructor(public offset:number,
                public endOffset:number,
                public cacheData:LazyTokenCacheData) {}

    get image():string {
        if (this.isInsertedInRecovery) {
            return ""
        }
        return this.cacheData.orgText.substring(this.offset, this.endOffset + 1)
    }

    get startLine():number {
        if (this.isInsertedInRecovery) {
            return NaN
        }
        this.ensureLineDataProcessing()
        return getStartLineFromLineToOffset(this.offset, this.cacheData.lineToOffset)
    }

    get startColumn():number {
        if (this.isInsertedInRecovery) {
            return NaN
        }
        this.ensureLineDataProcessing()
        return getStartColumnFromLineToOffset(this.offset, this.cacheData.lineToOffset)
    }

    get endLine():number {
        if (this.isInsertedInRecovery) {
            return NaN
        }
        this.ensureLineDataProcessing()
        return getEndLineFromLineToOffset(this.endOffset, this.cacheData.lineToOffset)
    }

    get endColumn():number {
        if (this.isInsertedInRecovery) {
            return NaN
        }
        this.ensureLineDataProcessing()
        return getEndColumnFromLineToOffset(this.endOffset, this.cacheData.lineToOffset)
    }

    private ensureLineDataProcessing():void {
        if (isEmpty(this.cacheData.lineToOffset)) {
            fillUpLineToOffset(this.cacheData.lineToOffset, this.cacheData.orgText)
        }
    }
}

/**
 * A special kind of Token which does not really exist in the input
 * (hence the 'Virtual' prefix). These type of Tokens can be used as special markers:
 * for example, EOF (end-of-file).
 */
export class VirtualToken extends Token {
    constructor() {super("", NaN, NaN, NaN, NaN, NaN) }
}

export class EOF extends VirtualToken {}
