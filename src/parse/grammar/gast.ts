/// <reference path="../../scan/tokens.ts" />
/// <reference path="../../../libs/lodash.d.ts" />

module chevrotain.gast {

    import tok = chevrotain.tokens
    import lang = chevrotain.lang

    export interface IProduction {
        accept(visitor:GAstVisitor):void
        dslName:string
    }

    export interface IProductionWithOccurrence extends IProduction {
        occurrenceInParent:number
        implicitOccurrenceIndex:boolean
    }

    export class AbstractProduction implements IProduction {
        public implicitOccurrenceIndex = false
        public dslName = lang.functionName(this.constructor)

        constructor(public definition:IProduction[]) {}

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
            _.forEach(this.definition, (prod) => {
                prod.accept(visitor)
            })
        }
    }

    export class ProdRef extends AbstractProduction implements IProductionWithOccurrence {
        public dslName = "SUBRULE"

        constructor(public refProdName:string,
                    public ref:TOP_LEVEL = undefined,
                    public occurrenceInParent:number = 1) { super([]) }

        set definition(definition:IProduction[]) {
            // immutable
        }

        get definition():IProduction[] {
            if (this.ref !== undefined) {
                return this.ref.definition
            }
            return []
        }

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
            // don't visit children of a reference, we will get cyclic infinite loops if we do so
        }
    }

    /* tslint:disable:class-name */
    export class TOP_LEVEL extends AbstractProduction {
        constructor(public name:string, definition:IProduction[]) { super(definition) }
    }

    export class FLAT extends AbstractProduction {
        constructor(definition:IProduction[]) { super(definition) }
    }

    export class OPTION extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class AT_LEAST_ONE extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class MANY extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class OR extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }
    /* tslint:enable:class-name */

    export class Terminal implements IProductionWithOccurrence {
        public dslName = "CONSUME"
        public implicitOccurrenceIndex:boolean = false

        constructor(public terminalType:Function, public occurrenceInParent:number = 1) {}

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
        }
    }

    export function isSequenceProd(prod:IProduction):boolean {
        return prod instanceof FLAT ||
            prod instanceof OPTION ||
            prod instanceof MANY ||
            prod instanceof AT_LEAST_ONE ||
            prod instanceof Terminal ||
            prod instanceof TOP_LEVEL
    }

    export function isOptionalProd(prod:IProduction):boolean {
        var isDirectlyOptional = prod instanceof OPTION || prod instanceof MANY
        if (isDirectlyOptional) {
            return true
        }

        // note that this can cause infinite loop if one optional empty TOP production has a cyclic dependency with another
        // empty optional top rule
        // may be indirectly optional ((A?B?C?) | (D?E?F?))
        if (prod instanceof OR) {
            // for OR its enough for just one of the alternatives to be optional
            return _.some((<OR>prod).definition, (subProd:IProduction) => {
                return isOptionalProd(subProd)
            })
        }
        else if (prod instanceof AbstractProduction) {
            return _.every((<AbstractProduction>prod).definition, (subProd:IProduction) => {
                return isOptionalProd(subProd)
            })
        }
        else {
            return false
        }
    }

    export function isBranchingProd(prod:IProduction):boolean {
        return prod instanceof OR
    }


    export class GAstVisitor {

        public visit(node:IProduction) {
            if (node instanceof ProdRef) {
                this.visitProdRef(<ProdRef>node)
            }
            else if (node instanceof FLAT) {
                this.visitFLAT(<FLAT>node)
            }
            else if (node instanceof OPTION) {
                this.visitOPTION(<OPTION>node)
            }
            else if (node instanceof AT_LEAST_ONE) {
                this.visitAT_LEAST_ONE(<AT_LEAST_ONE>node)
            }
            else if (node instanceof MANY) {
                this.visitMANY(<MANY>node)
            }
            else if (node instanceof OR) {
                this.visitOR(<OR>node)
            }
            else if (node instanceof Terminal) {
                this.visitTerminal(<Terminal>node)
            }
        }

        /* istanbul ignore next */ // this is an "Abstract" method that does nothing, testing it is pointless.
        public  visitProdRef(node:ProdRef):void {

        }

        public  visitFLAT(node:FLAT):void {

        }

        public  visitOPTION(node:OPTION):void {

        }

        public  visitAT_LEAST_ONE(node:AT_LEAST_ONE):void {

        }

        public  visitMANY(node:MANY):void {

        }

        public  visitOR(node:OR):void {

        }

        public  visitTerminal(node:Terminal):void {

        }
    }

}

