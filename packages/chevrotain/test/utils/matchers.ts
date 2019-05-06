import { IToken } from "../../api"

export function setEquality(actual: any[], expected: any[]): void {
    expect(actual).to.deep.include.members(expected)
    expect(expected).to.deep.include.members(actual)
    expect(expected).to.have.lengthOf(actual.length)
}

export function createRegularToken(
    tokType,
    image = "",
    startOffset = 1,
    startLine = 1,
    startColumn = 1,
    endOffset = 1,
    endLine = 1,
    endColumn = 1
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
