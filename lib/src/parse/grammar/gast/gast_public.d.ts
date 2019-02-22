import { IGASTVisitor, IOptionallyNamedProduction, IProduction, IProductionWithOccurrence, ISerializedGast, TokenType } from "../../../../api";
export declare abstract class AbstractProduction implements IProduction {
    definition: IProduction[];
    constructor(definition: IProduction[]);
    accept(visitor: IGASTVisitor): void;
}
export declare class NonTerminal extends AbstractProduction implements IProductionWithOccurrence {
    nonTerminalName: string;
    referencedRule: Rule;
    idx: number;
    constructor(options: {
        nonTerminalName: string;
        referencedRule?: Rule;
        idx?: number;
    });
    definition: IProduction[];
    accept(visitor: IGASTVisitor): void;
}
export declare class Rule extends AbstractProduction {
    name: string;
    orgText: string;
    constructor(options: {
        name: string;
        definition: IProduction[];
        orgText?: string;
    });
}
export declare class Flat extends AbstractProduction implements IOptionallyNamedProduction {
    name: string;
    constructor(options: {
        definition: IProduction[];
        name?: string;
    });
}
export declare class Option extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
    idx: number;
    name?: string;
    constructor(options: {
        definition: IProduction[];
        idx?: number;
        name?: string;
    });
}
export declare class RepetitionMandatory extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
    name: string;
    idx: number;
    constructor(options: {
        definition: IProduction[];
        idx?: number;
        name?: string;
    });
}
export declare class RepetitionMandatoryWithSeparator extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
    separator: TokenType;
    idx: number;
    name: string;
    constructor(options: {
        definition: IProduction[];
        separator: TokenType;
        idx?: number;
        name?: string;
    });
}
export declare class Repetition extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
    separator: TokenType;
    idx: number;
    name: string;
    constructor(options: {
        definition: IProduction[];
        idx?: number;
        name?: string;
    });
}
export declare class RepetitionWithSeparator extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
    separator: TokenType;
    idx: number;
    name: string;
    constructor(options: {
        definition: IProduction[];
        separator: TokenType;
        idx?: number;
        name?: string;
    });
}
export declare class Alternation extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
    idx: number;
    name: string;
    constructor(options: {
        definition: IProduction[];
        idx?: number;
        name?: string;
    });
}
export declare class Terminal implements IProductionWithOccurrence {
    terminalType: TokenType;
    idx: number;
    constructor(options: {
        terminalType: TokenType;
        idx?: number;
    });
    accept(visitor: IGASTVisitor): void;
}
export interface ISerializedBasic extends ISerializedGast {
    type: "Flat" | "Option" | "RepetitionMandatory" | "Repetition" | "Alternation";
    name?: string;
    idx?: number;
}
export interface ISerializedGastRule extends ISerializedGast {
    type: "Rule";
    name: string;
    orgText: string;
}
export interface ISerializedNonTerminal extends ISerializedGast {
    type: "NonTerminal";
    name: string;
    idx: number;
}
export interface ISerializedTerminal extends ISerializedGast {
    type: "Terminal";
    name: string;
    label?: string;
    pattern?: string;
    idx: number;
}
export interface ISerializedTerminalWithSeparator extends ISerializedGast {
    type: "RepetitionMandatoryWithSeparator" | "RepetitionWithSeparator";
    name: string;
    idx: number;
    separator: ISerializedTerminal;
}
export declare type ISerializedGastAny = ISerializedBasic | ISerializedGastRule | ISerializedNonTerminal | ISerializedTerminal | ISerializedTerminalWithSeparator;
export declare function serializeGrammar(topRules: Rule[]): ISerializedGast[];
export declare function serializeProduction(node: IProduction): ISerializedGast;
