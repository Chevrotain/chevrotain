import {createLazyTokenInstance, createSimpleLazyToken} from "../../src/scan/tokens"
import {LazyToken, SimpleLazyToken, ISimpleTokenOrIToken} from "../../src/scan/tokens_public"
import {TokenConstructor} from "../../src/scan/lexer_public"
export function setEquality(actual:any[], expected:any[]):void {
    expect(actual).to.deep.include.members(expected)
    expect(expected).to.deep.include.members(actual)
    expect(expected).to.have.lengthOf(actual.length)
}

export function createRegularToken(tokClass, image = ""):ISimpleTokenOrIToken {
    return new tokClass(image, -1, -1, -1, -1, -1)
}

export function createLazyToken(tokClass, image = "bamba"):LazyToken {
    return createLazyTokenInstance(0, image.length, tokClass, {orgText: image, lineToOffset: []})
}

export function createSimpleToken(tokClass, image = "bamba"):SimpleLazyToken {
    return createSimpleLazyToken(0, image.length, tokClass, {orgText: image, lineToOffset: []})
}
