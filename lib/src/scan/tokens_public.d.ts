import { IToken, ITokenConfig, TokenType } from "../../api";
export declare function tokenLabel(clazz: TokenType): string;
export declare function hasTokenLabel(obj: TokenType): boolean;
export declare function tokenName(obj: TokenType | Function): string;
export declare function createToken(config: ITokenConfig): TokenType;
export declare const EOF: TokenType;
export declare function createTokenInstance(tokType: TokenType, image: string, startOffset: number, endOffset: number, startLine: number, endLine: number, startColumn: number, endColumn: number): IToken;
export declare function tokenMatcher(token: IToken, tokType: TokenType): boolean;
