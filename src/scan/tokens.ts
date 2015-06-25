// using only root module name ('chevrotain') and not a longer name ('chevrotain.tokens')
// because the external and internal API must have the same names for d.ts definition files to be valid
// TODO: examine module in module to reduce spam on chevrotain namespace
module chevrotain {

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

    // TODO: this may not belong in the production code...
    export type VirtualTokenClass = Function
    export class VirtualToken extends Token {
        constructor() {super("", -1, -1, -1, -1, -1) }
    }
}
