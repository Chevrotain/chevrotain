import { IRange } from "../text/range";
import { Rule, ISerializedGastAny } from "./grammar/gast/gast_public";
import { IProduction, TokenType, ISerializedGast } from "../../api";
export declare enum ProdType {
    OPTION = 0,
    OR = 1,
    MANY = 2,
    MANY_SEP = 3,
    AT_LEAST_ONE = 4,
    AT_LEAST_ONE_SEP = 5,
    REF = 6,
    TERMINAL = 7,
    FLAT = 8
}
export interface IProdRange {
    range: IRange;
    text: string;
    type: ProdType;
}
export interface ITerminalNameToConstructor {
    [fqn: string]: TokenType;
}
export declare let terminalNameToConstructor: ITerminalNameToConstructor;
export declare function buildTopProduction(impelText: string, name: string, terminals: ITerminalNameToConstructor): Rule;
export declare function buildProdGast(prodRange: IProdRange, allRanges: IProdRange[]): IProduction;
export declare function getDirectlyContainedRanges(y: IRange, prodRanges: IProdRange[]): IProdRange[];
export declare function removeComments(text: string): string;
export declare function removeStringLiterals(text: string): string;
export declare function createRanges(text: string): IProdRange[];
export declare function createTerminalRanges(text: string): IProdRange[];
export declare function createRefsRanges(text: string): IProdRange[];
export declare function createAtLeastOneRanges(text: string): IProdRange[];
export declare function createAtLeastOneSepRanges(text: string): IProdRange[];
export declare function createManyRanges(text: string): IProdRange[];
export declare function createManySepRanges(text: string): IProdRange[];
export declare function createOptionRanges(text: string): IProdRange[];
export declare function createOrRanges(text: any): IProdRange[];
export declare function createOrPartRanges(orRanges: IProdRange[]): IProdRange[];
export declare function findClosingOffset(opening: string, closing: string, start: number, text: string): number;
export declare function deserializeGrammar(grammar: ISerializedGast[], terminals: ITerminalNameToConstructor): IProduction[];
export declare function deserializeProduction(node: ISerializedGastAny, terminals: ITerminalNameToConstructor): IProduction;
