import { assign, forEach, isRegExp, map } from "../../utils/utils"
import { TokenType } from "../../scan/lexer_public"
import { tokenLabel, tokenName } from "../../scan/tokens_public"

export namespace gast {
    export interface IOptionallyNamedProduction {
        name?: string
    }

    export interface IProduction {
        accept(visitor: GAstVisitor): void
    }

    export interface IProductionWithOccurrence extends IProduction {
        idx: number
    }

    export abstract class AbstractProduction implements IProduction {
        constructor(public definition: IProduction[]) {}

        accept(visitor: GAstVisitor): void {
            visitor.visit(this)
            forEach(this.definition, prod => {
                prod.accept(visitor)
            })
        }
    }

    export class NonTerminal extends AbstractProduction
        implements IProductionWithOccurrence {
        public nonTerminalName: string
        public referencedRule: Rule
        public idx: number = 1

        constructor(options: {
            nonTerminalName: string
            referencedRule?: Rule
            idx?: number
        }) {
            super([])
            assign(this, options)
        }

        set definition(definition: IProduction[]) {
            // immutable
        }

        get definition(): IProduction[] {
            if (this.referencedRule !== undefined) {
                return this.referencedRule.definition
            }
            return []
        }

        accept(visitor: GAstVisitor): void {
            visitor.visit(this)
            // don't visit children of a reference, we will get cyclic infinite loops if we do so
        }
    }

    export class Rule extends AbstractProduction {
        public name: string
        public orgText: string = ""

        constructor(options: {
            name: string
            definition: IProduction[]
            orgText?: string
        }) {
            super(options.definition)
            assign(this, options)
        }
    }

    export class Flat extends AbstractProduction
        implements IOptionallyNamedProduction {
        public name: string

        // A named Flat production is used to indicate a Nested Rule in an alternation
        constructor(options: { definition: IProduction[]; name?: string }) {
            super(options.definition)
            assign(this, options)
        }
    }

    export class Option extends AbstractProduction
        implements IProductionWithOccurrence, IOptionallyNamedProduction {
        public idx: number = 1
        public name?: string

        constructor(options: {
            definition: IProduction[]
            idx?: number
            name?: string
        }) {
            super(options.definition)
            assign(this, options)
        }
    }

    export class RepetitionMandatory extends AbstractProduction
        implements IProductionWithOccurrence, IOptionallyNamedProduction {
        public name: string
        public idx: number = 1

        constructor(options: {
            definition: IProduction[]
            idx?: number
            name?: string
        }) {
            super(options.definition)
            assign(this, options)
        }
    }

    export class RepetitionMandatoryWithSeparator extends AbstractProduction
        implements IProductionWithOccurrence, IOptionallyNamedProduction {
        public separator: TokenType
        public idx: number = 1
        public name: string

        constructor(options: {
            definition: IProduction[]
            separator: TokenType
            idx?: number
            name?: string
        }) {
            super(options.definition)
            assign(this, options)
        }
    }

    export class Repetition extends AbstractProduction
        implements IProductionWithOccurrence, IOptionallyNamedProduction {
        public separator: TokenType
        public idx: number = 1
        public name: string

        constructor(options: {
            definition: IProduction[]
            idx?: number
            name?: string
        }) {
            super(options.definition)
            assign(this, options)
        }
    }

    export class RepetitionWithSeparator extends AbstractProduction
        implements IProductionWithOccurrence, IOptionallyNamedProduction {
        public separator: TokenType
        public idx: number = 1
        public name: string

        constructor(options: {
            definition: IProduction[]
            separator: TokenType
            idx?: number
            name?: string
        }) {
            super(options.definition)
            assign(this, options)
        }
    }

    export class Alternation extends AbstractProduction
        implements IProductionWithOccurrence, IOptionallyNamedProduction {
        public idx: number = 1
        public name: string

        constructor(options: {
            definition: IProduction[]
            idx?: number
            name?: string
        }) {
            super(options.definition)
            assign(this, options)
        }
    }

    export class Terminal implements IProductionWithOccurrence {
        public terminalType: TokenType
        public idx: number = 1

        constructor(options: { terminalType: TokenType; idx?: number }) {
            assign(this, options)
        }

        accept(visitor: GAstVisitor): void {
            visitor.visit(this)
        }
    }

    export abstract class GAstVisitor {
        public visit(node: IProduction): any {
            if (node instanceof NonTerminal) {
                return this.visitNonTerminal(node)
            } else if (node instanceof Flat) {
                return this.visitFlat(node)
            } else if (node instanceof Option) {
                return this.visitOption(node)
            } else if (node instanceof RepetitionMandatory) {
                return this.visitRepetitionMandatory(node)
            } else if (node instanceof RepetitionMandatoryWithSeparator) {
                return this.visitRepetitionMandatoryWithSeparator(node)
            } else if (node instanceof RepetitionWithSeparator) {
                return this.visitRepetitionWithSeparator(node)
            } else if (node instanceof Repetition) {
                return this.visitRepetition(node)
            } else if (node instanceof Alternation) {
                return this.visitAlternation(node)
            } else if (node instanceof Terminal) {
                return this.visitTerminal(node)
            } else if (node instanceof Rule) {
                return this.visitRule(node)
            } else {
                /* istanbul ignore next */
                throw Error("non exhaustive match")
            }
        }

        public visitNonTerminal(node: NonTerminal): any {}

        public visitFlat(node: Flat): any {}

        public visitOption(node: Option): any {}

        public visitRepetition(node: Repetition): any {}

        public visitRepetitionMandatory(node: RepetitionMandatory): any {}

        public visitRepetitionMandatoryWithSeparator(
            node: RepetitionMandatoryWithSeparator
        ): any {}

        public visitRepetitionWithSeparator(
            node: RepetitionWithSeparator
        ): any {}

        public visitAlternation(node: Alternation): any {}

        public visitTerminal(node: Terminal): any {}

        public visitRule(node: Rule): any {}
    }

    export interface ISerializedGast {
        type:
            | "NonTerminal"
            | "Flat"
            | "Option"
            | "RepetitionMandatory"
            | "RepetitionMandatoryWithSeparator"
            | "Repetition"
            | "RepetitionWithSeparator"
            | "Alternation"
            | "Terminal"
            | "Rule"

        definition?: ISerializedGast[]
    }

    export interface ISerializedGastRule extends ISerializedGast {
        name: string
    }

    export interface ISerializedNonTerminal extends ISerializedGast {
        name: string
        idx: number
    }

    export interface ISerializedTerminal extends ISerializedGast {
        name: string
        label?: string
        pattern?: string
        idx: number
    }

    export interface ISerializedTerminalWithSeparator extends ISerializedGast {
        separator: ISerializedTerminal
    }

    export function serializeGrammar(topRules: Rule[]): ISerializedGast[] {
        return map(topRules, serializeProduction)
    }

    export function serializeProduction(node: IProduction): ISerializedGast {
        function convertDefinition(
            definition: IProduction[]
        ): ISerializedGast[] {
            return map(definition, serializeProduction)
        }

        if (node instanceof NonTerminal) {
            return <ISerializedNonTerminal>{
                type: "NonTerminal",
                name: node.nonTerminalName,
                idx: node.idx
            }
        } else if (node instanceof Flat) {
            return {
                type: "Flat",
                definition: convertDefinition(node.definition)
            }
        } else if (node instanceof Option) {
            return {
                type: "Option",
                definition: convertDefinition(node.definition)
            }
        } else if (node instanceof RepetitionMandatory) {
            return {
                type: "RepetitionMandatory",
                definition: convertDefinition(node.definition)
            }
        } else if (node instanceof RepetitionMandatoryWithSeparator) {
            return <ISerializedTerminalWithSeparator>{
                type: "RepetitionMandatoryWithSeparator",
                separator: <ISerializedTerminal>serializeProduction(
                    new Terminal({ terminalType: node.separator })
                ),
                definition: convertDefinition(node.definition)
            }
        } else if (node instanceof RepetitionWithSeparator) {
            return <ISerializedTerminalWithSeparator>{
                type: "RepetitionWithSeparator",
                separator: <ISerializedTerminal>serializeProduction(
                    new Terminal({ terminalType: node.separator })
                ),
                definition: convertDefinition(node.definition)
            }
        } else if (node instanceof Repetition) {
            return {
                type: "Repetition",
                definition: convertDefinition(node.definition)
            }
        } else if (node instanceof Alternation) {
            return {
                type: "Alternation",
                definition: convertDefinition(node.definition)
            }
        } else if (node instanceof Terminal) {
            let serializedTerminal = <ISerializedTerminal>{
                type: "Terminal",
                name: tokenName(node.terminalType),
                label: tokenLabel(node.terminalType),
                idx: node.idx
            }

            let pattern = node.terminalType.PATTERN
            if (node.terminalType.PATTERN) {
                serializedTerminal.pattern = isRegExp(pattern)
                    ? (<any>pattern).source
                    : pattern
            }

            return serializedTerminal
        } else if (node instanceof Rule) {
            // IGNORE ABOVE ELSE
            return <ISerializedGastRule>{
                type: "Rule",
                name: node.name,
                definition: convertDefinition(node.definition)
            }
        } else {
            /* istanbul ignore next */
            throw Error("non exhaustive match")
        }
    }
}
