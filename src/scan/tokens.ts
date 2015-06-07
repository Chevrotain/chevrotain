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

        constructor(public startLine:number, public startColumn:number, public image:string) {}
    }

    export type VirtualTokenClass = Function
    export class VirtualToken extends Token {
        constructor() {super(-1, -1, "") }
    }

    export function INVALID_LINE():number {
        return -1
    }

    export function INVALID_COLUMN():number {
        return -1
    }

    export class NoneToken extends Token {

        private static _instance:NoneToken = null

        constructor() {
            super(INVALID_LINE(), INVALID_COLUMN(), "")
            if (NoneToken._instance) {
                throw new Error("can't create two instances of a singleton!")
            }
            NoneToken._instance = this
        }

        // returning any to be able to assign this to anything
        public static getInstance():any {
            if (NoneToken._instance === null) {
                NoneToken._instance = new NoneToken()
            }
            return NoneToken._instance
        }
    }

    export function NONE_TOKEN():Token {
        return NoneToken.getInstance()
    }

}
