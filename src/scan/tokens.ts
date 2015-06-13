/// <reference path="../lang/lang_extensions.ts" />

module chevrotain.tokens {

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

    export type TokenClass = Function
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

    // TODO: this may not belong in the production code...
    export type VirtualTokenClass = Function
    export class VirtualToken extends Token {
        constructor() {super("", -1, -1, -1, -1, -1) }
    }
}
