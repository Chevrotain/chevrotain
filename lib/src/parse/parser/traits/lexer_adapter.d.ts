import { IToken } from "../../../../api";
import { MixedInParser } from "./parser_traits";
/**
 * Trait responsible abstracting over the interaction with Lexer output (Token vector).
 *
 * This could be generalized to support other kinds of lexers, e.g.
 * - Just in Time Lexing / Lexer-Less parsing.
 * - Streaming Lexer.
 */
export declare class LexerAdapter {
    tokVector: IToken[];
    tokVectorLength: any;
    currIdx: number;
    initLexerAdapter(): void;
    input: MixedInParser;
    SKIP_TOKEN(this: MixedInParser): IToken;
    LA(this: MixedInParser, howMuch: number): IToken;
    consumeToken(this: MixedInParser): void;
    exportLexerState(this: MixedInParser): number;
    importLexerState(this: MixedInParser, newState: number): void;
    resetLexerState(this: MixedInParser): void;
    moveToTerminatedState(this: MixedInParser): void;
    getLexerPosition(this: MixedInParser): number;
}
