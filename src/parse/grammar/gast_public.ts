import {forEach} from "../../utils/utils"

export namespace gast {
    export interface IProduction {
        accept(visitor:GAstVisitor):void
    }

    export interface IProductionWithOccurrence extends IProduction {
        occurrenceInParent:number
        implicitOccurrenceIndex:boolean
    }

    export abstract class AbstractProduction implements IProduction {
        public implicitOccurrenceIndex = false

        constructor(public definition:IProduction[]) {}

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
            forEach(this.definition, (prod) => {
                prod.accept(visitor)
            })
        }
    }

    export class NonTerminal extends AbstractProduction implements IProductionWithOccurrence {
        constructor(public nonTerminalName:string,
                    public referencedRule:Rule = undefined,
                    public occurrenceInParent:number = 1) { super([]) }

        set definition(definition:IProduction[]) {
            // immutable
        }

        get definition():IProduction[] {
            if (this.referencedRule !== undefined) {
                return this.referencedRule.definition
            }
            return []
        }

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
            // don't visit children of a reference, we will get cyclic infinite loops if we do so
        }
    }

    export class Rule extends AbstractProduction {
        constructor(public name:string, definition:IProduction[], public orgText:string = "") { super(definition) }
    }

    export class Flat extends AbstractProduction {
        constructor(definition:IProduction[]) { super(definition) }
    }

    export class Option extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class RepetitionMandatory extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class RepetitionMandatoryWithSeparator extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public separator:Function, public occurrenceInParent:number = 1) { super(definition) }
    }

    export class Repetition extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class RepetitionWithSeparator extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public separator:Function, public occurrenceInParent:number = 1) { super(definition) }
    }

    export class Alternation extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:Flat[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class Terminal implements IProductionWithOccurrence {
        public implicitOccurrenceIndex:boolean = false

        constructor(public terminalType:Function, public occurrenceInParent:number = 1) {}

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
        }
    }

    export abstract class GAstVisitor {

        public visit(node:IProduction):any {

            if (node instanceof NonTerminal) {
                return this.visitNonTerminal(node)
            }
            else if (node instanceof Flat) {
                return this.visitFlat(node)
            }
            else if (node instanceof Option) {
                return this.visitOption(node)
            }
            else if (node instanceof RepetitionMandatory) {
                return this.visitRepetitionMandatory(node)
            }
            else if (node instanceof RepetitionMandatoryWithSeparator) {
                return this.visitRepetitionMandatoryWithSeparator(node)
            }
            else if (node instanceof RepetitionWithSeparator) {
                return this.visitRepetitionWithSeparator(node)
            }
            else if (node instanceof Repetition) {
                return this.visitRepetition(node)
            }
            else if (node instanceof Alternation) {
                return this.visitAlternation(node)
            }
            else if (node instanceof Terminal) {
                return this.visitTerminal(node)
            }
            else if (node instanceof Rule) {
                return this.visitRule(node)
            }
            else {
                throw Error("non exhaustive match")
            }
        }

        public visitNonTerminal(node:NonTerminal):any {}

        public visitFlat(node:Flat):any {}

        public visitOption(node:Option):any {}

        public visitRepetition(node:Repetition):any {}

        public visitRepetitionMandatory(node:RepetitionMandatory):any {}

        public visitRepetitionMandatoryWithSeparator(node:RepetitionMandatoryWithSeparator):any {}

        public visitRepetitionWithSeparator(node:RepetitionWithSeparator):any {}

        public visitAlternation(node:Alternation):any {}

        public visitTerminal(node:Terminal):any {}

        public visitRule(node:Rule):any {}
    }
}
