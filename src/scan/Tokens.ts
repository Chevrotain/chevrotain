/// <reference path="../lang/LangExtensions.ts" />

module chevrotain.scan.tokens {

    import lang = chevrotain.typescript.lang.extensions;

    export function getTokName(tokType:Function):string {
        var tokTypeName = lang.functionName(tokType);
        return tokTypeName.replace("Tok", "");
    }

    export class Token {
        // this marks if a Token does not really exist and has been inserted "artificially" during parsing in rule error recovery
        public isInserted:boolean = false;

        constructor(public startLine:number, public startColumn:number, public image:string) {}
    }

    export class VirtualToken extends Token {
        constructor() {super(-1, -1, ""); }
    }

    export function INVALID_LINE():number {
        return -1;
    }

    export function INVALID_COLUMN():number {
        return -1;
    }

    export class NoneToken extends Token {

        private static _instance:NoneToken = null;

        constructor() {
            super(INVALID_LINE(), INVALID_COLUMN(), "");
            if (NoneToken._instance) {
                throw new Error("can't create two instances of a singleton!");
            }
            NoneToken._instance = this;
        }

        // returning any to be able to assign this to anything
        public static getInstance():any {
            if (NoneToken._instance === null) {
                NoneToken._instance = new NoneToken();
            }
            return NoneToken._instance;
        }
    }

    export function NONE_TOKEN():Token {
        return NoneToken.getInstance();
    }

}
