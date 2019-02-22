import { Rule, Terminal, NonTerminal, Alternation, Flat } from "../parse/grammar/gast/gast_public";
export declare function genUmdModule(options: {
    name: string;
    rules: Rule[];
}): string;
export declare function genWrapperFunction(options: {
    name: string;
    rules: Rule[];
}): string;
export declare function genClass(options: {
    name: string;
    rules: Rule[];
}): string;
export declare function genAllRules(rules: Rule[]): string;
export declare function genRule(prod: Rule, n: number): string;
export declare function genTerminal(prod: Terminal, n: number): string;
export declare function genNonTerminal(prod: NonTerminal, n: number): string;
export declare function genAlternation(prod: Alternation, n: number): string;
export declare function genSingleAlt(prod: Flat, n: number): string;
