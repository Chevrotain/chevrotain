import { ISyntacticContentAssistPath, IToken, ITokenGrammarPath, TokenType } from "../../../../api";
import { MixedInParser } from "./parser_traits";
export declare class ContentAssist {
    initContentAssist(): void;
    computeContentAssist(this: MixedInParser, startRuleName: string, precedingInput: IToken[]): ISyntacticContentAssistPath[];
    getNextPossibleTokenTypes(this: MixedInParser, grammarPath: ITokenGrammarPath): TokenType[];
}
