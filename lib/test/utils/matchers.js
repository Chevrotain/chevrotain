"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setEquality(actual, expected) {
    expect(actual).to.deep.include.members(expected);
    expect(expected).to.deep.include.members(actual);
    expect(expected).to.have.lengthOf(actual.length);
}
exports.setEquality = setEquality;
function createRegularToken(tokType, image) {
    if (image === void 0) { image = ""; }
    return {
        image: image,
        startOffset: 1,
        tokenTypeIdx: tokType.tokenTypeIdx,
        tokenType: tokType
    };
}
exports.createRegularToken = createRegularToken;
//# sourceMappingURL=matchers.js.map