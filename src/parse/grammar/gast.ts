module chevrotain.gast {

    import lang = chevrotain.lang

    export interface IProduction {
        accept(visitor:GAstVisitor):void
    }

    export interface IProductionWithOccurrence extends IProduction {
        occurrenceInParent:number
        implicitOccurrenceIndex:boolean
    }

    export class AbstractProduction implements IProduction {
        public implicitOccurrenceIndex = false

        constructor(public definition:IProduction[]) {}

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
            _.forEach(this.definition, (prod) => {
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
        constructor(public name:string, definition:IProduction[]) { super(definition) }
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

    export class Repetition extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class Alternation extends AbstractProduction implements IProductionWithOccurrence {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1) { super(definition) }
    }

    export class Terminal implements IProductionWithOccurrence {
        public implicitOccurrenceIndex:boolean = false

        constructor(public terminalType:Function, public occurrenceInParent:number = 1) {}

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
        }
    }

    export function isSequenceProd(prod:IProduction):boolean {
        return prod instanceof Flat ||
            prod instanceof Option ||
            prod instanceof Repetition ||
            prod instanceof RepetitionMandatory ||
            prod instanceof Terminal ||
            prod instanceof Rule
    }

    export function isOptionalProd(prod:IProduction):boolean {
        var isDirectlyOptional = prod instanceof Option || prod instanceof Repetition
        if (isDirectlyOptional) {
            return true
        }

        // note that this can cause infinite loop if one optional empty TOP production has a cyclic dependency with another
        // empty optional top rule
        // may be indirectly optional ((A?B?C?) | (D?E?F?))
        if (prod instanceof Alternation) {
            // for OR its enough for just one of the alternatives to be optional
            return _.some((<Alternation>prod).definition, (subProd:IProduction) => {
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
        return prod instanceof Alternation
    }

    export class GAstVisitor {

        public visit(node:IProduction) {
            if (node instanceof NonTerminal) {
                this.visitNonTerminal(<NonTerminal>node)
            }
            else if (node instanceof Flat) {
                this.visitFlat(<Flat>node)
            }
            else if (node instanceof Option) {
                this.visitOption(<Option>node)
            }
            else if (node instanceof RepetitionMandatory) {
                this.visitRepetitionMandatory(<RepetitionMandatory>node)
            }
            else if (node instanceof Repetition) {
                this.visitRepetition(<Repetition>node)
            }
            else if (node instanceof Alternation) {
                this.visitAlternation(<Alternation>node)
            }
            else if (node instanceof Terminal) {
                this.visitTerminal(<Terminal>node)
            }
        }

        /* istanbul ignore next */ // this is an "Abstract" method that does nothing, testing it is pointless.
        public visitNonTerminal(node:NonTerminal):void {}

        public visitFlat(node:Flat):void {}

        public visitOption(node:Option):void {}

        public visitRepetitionMandatory(node:RepetitionMandatory):void {}

        public visitRepetition(node:Repetition):void {}

        public visitAlternation(node:Alternation):void {}

        public visitTerminal(node:Terminal):void {}
    }


    var productionToDslName = {}
    productionToDslName[lang.functionName(NonTerminal)] = "SUBRULE"
    productionToDslName[lang.functionName(Option)] = "OPTION"
    productionToDslName[lang.functionName(RepetitionMandatory)] = "AT_LEAST_ONE"
    productionToDslName[lang.functionName(Repetition)] = "MANY"
    productionToDslName[lang.functionName(Alternation)] = "OR"
    productionToDslName[lang.functionName(Terminal)] = "CONSUME"


    export function getProductionDslName(prod:IProductionWithOccurrence):string {
        var clazz = prod.constructor
        var prodName = lang.functionName(clazz)
        return productionToDslName[prodName]
    }

}

