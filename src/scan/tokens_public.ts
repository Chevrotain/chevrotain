// using only root namespace name ('chevrotain') and not a longer name ('chevrotain.tokens')
// because the external and internal API must have the same names for d.ts definition files to be valid
// TODO: examine namespace in namespace to reduce spam on chevrotain namespace
namespace chevrotain {

    import lang = chevrotain.lang

    export function tokenName(clazz:Function):string {
        // used to support js inheritance patterns that do not use named functions
        // in that situation setting a property tokenName on a token constructor will
        // enable producing readable error messages.
        if (_.isString((<any>clazz).tokenName)) {
            return (<any>clazz).tokenName
        }
        else {
            return lang.functionName(clazz)
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

        if (_.isRegExp(patternOrParent) ||
            patternOrParent === chevrotain.Lexer.SKIPPED ||
            patternOrParent === chevrotain.Lexer.NA) {
            pattern = patternOrParent
        }
        else if (_.isFunction(patternOrParent)) {
            parentConstructor = patternOrParent
            pattern = undefined
        }

        let derivedCostructor:any = function () {
            parentConstructor.apply(this, arguments)
        }

        // static properties mixing
        _.forOwn(parentConstructor, (v, k) => {
            derivedCostructor[k] = v
        })

        // the tokenName property will be used by the Parser for Error Messages if the Token's constructor is anonymous
        derivedCostructor.tokenName = tokenName
        derivedCostructor.prototype = Object.create(parentConstructor.prototype)
        derivedCostructor.prototype.constructor = derivedCostructor
        if (!_.isUndefined(pattern)) {
            derivedCostructor.PATTERN = pattern
        }

        return derivedCostructor
    }

    export class Token {
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
}
