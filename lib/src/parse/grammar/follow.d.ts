import { RestWalker } from "./rest";
import { HashTable } from "../../lang/lang_extensions";
import { NonTerminal, Rule, Terminal } from "./gast/gast_public";
import { IProduction, TokenType } from "../../../api";
export declare class ResyncFollowsWalker extends RestWalker {
    private topProd;
    follows: HashTable<TokenType[]>;
    constructor(topProd: Rule);
    startWalking(): HashTable<TokenType[]>;
    walkTerminal(terminal: Terminal, currRest: IProduction[], prevRest: IProduction[]): void;
    walkProdRef(refProd: NonTerminal, currRest: IProduction[], prevRest: IProduction[]): void;
}
export declare function computeAllProdsFollows(topProductions: Rule[]): HashTable<TokenType[]>;
export declare function buildBetweenProdsFollowPrefix(inner: Rule, occurenceInParent: number): string;
export declare function buildInProdFollowPrefix(terminal: Terminal): string;
