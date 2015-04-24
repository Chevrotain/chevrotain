/// <reference path="../scan/tokens.ts" />
/// <reference path="../../libs/lodash.d.ts" />

module chevrotain.tree {

    import tok = chevrotain.tokens

    export class ParseTree {
        getImage():string { return this.payload.image }

        getLine():number { return this.payload.startLine }

        getColumn():number { return this.payload.startColumn }

        constructor(public payload:tok.Token, public children:ParseTree[] = []) {}
    }
}
