import { IToken } from "../../src/scan/tokens_public"

export function setEquality(actual: any[], expected: any[]): void {
	expect(actual).to.deep.include.members(expected)
	expect(expected).to.deep.include.members(actual)
	expect(expected).to.have.lengthOf(actual.length)
}

export function createRegularToken(tokType, image = ""): IToken {
	return {
		image: image,
		startOffset: 1,
		tokenTypeIdx: tokType.tokenTypeIdx,
		tokenType: tokType
	}
}
