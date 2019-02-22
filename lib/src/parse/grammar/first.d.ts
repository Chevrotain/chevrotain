import { AbstractProduction, Terminal } from "./gast/gast_public";
import { IProduction, TokenType } from "../../../api";
export declare function first(prod: IProduction): TokenType[];
export declare function firstForSequence(prod: AbstractProduction): TokenType[];
export declare function firstForBranching(prod: AbstractProduction): TokenType[];
export declare function firstForTerminal(terminal: Terminal): TokenType[];
