import {isString, isRegExp, isFunction, assign, isUndefined} from "../utils/utils"
import {functionName} from "../lang/lang_extensions"
import {Lexer} from "./lexer_public"

/**
 *  This can be used to improve the quality/readability of error messages or syntax diagrams.
 *
 * @param {Function} clazz - A constructor for a Token subclass
 * @returns {string} the Human readable label a Token if it exists.
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
    // used to support js inheritance patterns that do not use named functions
    // in that situation setting a property tokenName on a token constructor will
    // enable producing readable error messages.
    if (isString((<any>clazz).tokenName)) {
        return (<any>clazz).tokenName
    }
    else {
        return functionName(clazz)
    }
}

/**
 * utility to help the poor souls who are still stuck writing pure javascript 5.1
 * extend and create Token subclasses in a less verbose manner
 *
 * @param {string} tokenName - the name of the new TokenClass
 * @param {RegExp|Function} patternOrParent - RegExp Pattern or Parent Token Constructor
 * @param {Function} parentConstructor - the Token class to be extended
 * @returns {Function} - a constructor for the new extended Token subclass
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

    // the tokenName property will be used by the Parser for Error Messages if the Token's constructor is anonymous
    derivedCostructor.tokenName = tokenName
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
     * @param {string} image the textual representation of the Token as it appeared in the text
     * @param {number} offset offset of the first character of the Token
     * @param {number} startLine line of the first character of the Token
     * @param {number} startColumn column of the first character of the Token
     * @param {number} endLine line of the last character of the Token
     * @param {number} endColumn column of the last character of the Token
     *
     * Things to note:
     * * "do"  {startColumn : 1, endColumn: 2} --> the range is inclusive to exclusive 1...2 (2 chars long).
     * * "\n"  {startLine : 1, endLine: 1} --> a lineTerminator as the last character does not effect the Token's line numbering.
     * * "'hello\tworld\uBBBB'"  {image: "'hello\tworld\uBBBB'"} --> a Token's image is the "literal" text
     *                                                              (unicode escaping is untouched).
     */
    constructor(public image:string,
                public offset:number,
                public startLine:number,
                public startColumn:number,
                public endLine:number = startLine,
                public endColumn:number = startColumn + image.length - 1) {}

    // TODO: getter(computed) for endOffSet
}

/**
 * a special kind of Token which does not really exist in the input
 * (hence the 'Virtual' prefix). These type of Tokens can be used as special markers:
 * for example, EOF (end-of-file).
 */
export class VirtualToken extends Token {
    constructor() {super("", -1, -1, -1, -1, -1) }
}

export class EOF extends VirtualToken {}
