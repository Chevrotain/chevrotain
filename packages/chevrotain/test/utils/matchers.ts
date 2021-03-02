import { IToken } from "../../api"
import { expect } from "chai"

export function setEquality(actual: any[], expected: any[]): void {
  expect(actual).to.deep.include.members(expected)
  expect(expected).to.deep.include.members(actual)
  expect(expected).to.have.lengthOf(actual.length)
}

export function createRegularToken(
  tokType,
  image = "",
  startOffset = 1,
  startLine = undefined,
  startColumn = undefined,
  endOffset = undefined,
  endLine = undefined,
  endColumn = undefined
): IToken {
  return {
    image: image,
    startOffset: startOffset,
    startLine: startLine,
    startColumn: startColumn,
    endOffset: endOffset,
    endLine: endLine,
    endColumn: endColumn,
    tokenTypeIdx: tokType.tokenTypeIdx,
    tokenType: tokType
  }
}
