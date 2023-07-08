import { IToken, TokenType } from "@chevrotain/types";
import { expect } from "chai";

export function setEquality(actual: any[], expected: any[]): void {
  expect(actual).to.deep.include.members(expected);
  expect(expected).to.deep.include.members(actual);
  expect(expected).to.have.lengthOf(actual.length);
}

export function createRegularToken(
  tokType: TokenType,
  image = "",
  startOffset = 1,
  startLine?: number,
  startColumn?: number,
  endOffset?: number,
  endLine?: number,
  endColumn?: number,
): IToken {
  return {
    image: image,
    startOffset: startOffset,
    startLine: startLine,
    startColumn: startColumn,
    endOffset: endOffset,
    endLine: endLine,
    endColumn: endColumn,
    tokenTypeIdx: tokType.tokenTypeIdx!,
    tokenType: tokType,
  };
}
