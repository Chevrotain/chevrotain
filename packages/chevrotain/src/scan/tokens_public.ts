import { Lexer } from "./lexer_public.js";
import { augmentTokenTypes, tokenStructuredMatcher } from "./tokens.js";
import { IToken, ITokenConfig, TokenType } from "@chevrotain/types";

export function tokenLabel(tokType: TokenType): string {
  if (hasTokenLabel(tokType)) {
    return tokType.LABEL;
  } else {
    return tokType.name;
  }
}

export function tokenName(tokType: TokenType): string {
  return tokType.name;
}

export function hasTokenLabel(
  obj: TokenType,
): obj is TokenType & Pick<Required<TokenType>, "LABEL"> {
  return typeof obj.LABEL === "string" && obj.LABEL !== "";
}

/**
 * Creates a TokenType with every public config field pre-declared so tokens
 * produced by createToken() share a stable base object shape from birth.
 *
 * Validators in lexer.ts that used Object.hasOwn() to detect "was this field
 * explicitly configured?" are updated to check `!== undefined` instead.
 */
export function createToken(config: ITokenConfig): TokenType {
  if (Object.hasOwn(config, "parent")) {
    throw (
      "The parent property is no longer supported.\n" +
      "See: https://github.com/chevrotain/chevrotain/issues/564#issuecomment-349062346 for details."
    );
  }

  const rawCats = config.categories;
  const categories: TokenType[] = rawCats
    ? Array.isArray(rawCats)
      ? (rawCats as TokenType[])
      : [rawCats as TokenType]
    : [];

  const tokenType: TokenType = {
    name: config.name,
    PATTERN: config.pattern ?? undefined,
    LABEL: config.label ?? undefined,
    GROUP: config.group ?? undefined,
    PUSH_MODE: config.push_mode ?? undefined,
    POP_MODE: config.pop_mode ?? undefined,
    LONGER_ALT: config.longer_alt ?? undefined,
    LINE_BREAKS: config.line_breaks ?? undefined,
    START_CHARS_HINT: config.start_chars_hint ?? undefined,
    CATEGORIES: categories,
  } as unknown as TokenType;

  augmentTokenTypes([tokenType]);

  return tokenType;
}

export const EOF = createToken({ name: "EOF", pattern: Lexer.NA });

export function createTokenInstance(
  tokType: TokenType,
  image: string,
  startOffset: number,
  endOffset: number,
  startLine: number,
  endLine: number,
  startColumn: number,
  endColumn: number,
): IToken {
  return {
    image,
    startOffset,
    endOffset,
    startLine,
    endLine,
    startColumn,
    endColumn,
    tokenTypeIdx: (<any>tokType).tokenTypeIdx,
    tokenType: tokType,
  };
}

export function tokenMatcher(token: IToken, tokType: TokenType): boolean {
  return tokenStructuredMatcher(token, tokType);
}
