import { TokenConstructor } from "./lexer_public"
import {
    cloneArr,
    contains,
    difference,
    forEach,
    getSuperClass,
    has
} from "../utils/utils"
import { IToken, Token, tokenName } from "./tokens_public"
import { HashTable } from "../lang/lang_extensions"

// TODO: rename "tokenInstanceOf" ?
export function tokenStructuredMatcher(tokInstance, tokConstructor) {
    if (tokInstance.tokenType === tokConstructor.tokenType) {
        return true
    } else if (tokConstructor.extendingTokenTypes.length > 0) {
        let extendingTokenTypes = tokConstructor.extendingTokenTypes
        let extendingTokenTypesLength = extendingTokenTypes.length
        for (let i = 0; i < extendingTokenTypesLength; i++) {
            if (extendingTokenTypes[i] === tokInstance.tokenType) {
                return true
            }
        }
        return false
    } else {
        return false
    }
}

// Optimized tokenMatcher in case our grammar does not use token inheritance
// Being so tiny it is much more likely to be in-lined and this avoid the function call overhead
export function tokenStructuredMatcherNoInheritance(
    tokInstance,
    tokConstructor
) {
    return tokInstance.tokenType === tokConstructor.tokenType
}

export function isBaseTokenOrObject(tokClass: TokenConstructor): boolean {
    return isBaseTokenClass(tokClass) || <any>tokClass === Object
}

export function isBaseTokenClass(tokClass: Function): boolean {
    return tokClass === Token
}

export let tokenShortNameIdx = 1
export const tokenIdxToClass = new HashTable<TokenConstructor>()

export function augmentTokenClasses(tokenClasses: TokenConstructor[]): void {
    // 1. collect the parent Token classes as well.
    let tokenClassesAndParents = expandTokenHierarchy(tokenClasses)

    // 2. add required tokenType and extendingTokenTypes properties
    assignTokenDefaultProps(tokenClassesAndParents)

    // 3. fill up the extendingTokenTypes
    assignExtendingTokensProp(tokenClassesAndParents)
}

export function expandTokenHierarchy(
    tokenClasses: TokenConstructor[]
): TokenConstructor[] {
    let tokenClassesAndParents = cloneArr(tokenClasses)

    forEach(tokenClasses, currTokClass => {
        let currParentClass: any = getSuperClass(currTokClass)
        while (!isBaseTokenOrObject(currParentClass)) {
            if (!contains(tokenClassesAndParents, currParentClass)) {
                tokenClassesAndParents.push(currParentClass)
            }
            currParentClass = getSuperClass(currParentClass)
        }
    })

    return tokenClassesAndParents
}

export function assignTokenDefaultProps(
    tokenClasses: TokenConstructor[]
): void {
    forEach(tokenClasses, currTokClass => {
        if (!hasShortKeyProperty(currTokClass)) {
            tokenIdxToClass.put(tokenShortNameIdx, currTokClass)
            ;(<any>currTokClass).tokenType = tokenShortNameIdx++
        }

        if (!hasExtendingTokensTypesProperty(currTokClass)) {
            currTokClass.extendingTokenTypes = []
        }

        if (!hasTokenNameProperty(currTokClass)) {
            // saved for fast access during CST building.
            currTokClass.tokenName = tokenName(currTokClass)
        }
    })
}

export function assignExtendingTokensProp(
    tokenClasses: TokenConstructor[]
): void {
    forEach(tokenClasses, currTokClass => {
        let currSubClassesExtendingTypes = [currTokClass.tokenType]
        let currParentClass: any = getSuperClass(currTokClass)

        while (
            !isBaseTokenClass(currParentClass) &&
            currParentClass !== Object
        ) {
            let newExtendingTypes = difference(
                currSubClassesExtendingTypes,
                currParentClass.extendingTokenTypes
            )
            currParentClass.extendingTokenTypes = currParentClass.extendingTokenTypes.concat(
                newExtendingTypes
            )
            currSubClassesExtendingTypes.push(currParentClass.tokenType)
            currParentClass = getSuperClass(currParentClass)
        }
    })
}

export function hasShortKeyProperty(tokClass: TokenConstructor): boolean {
    return has(tokClass, "tokenType")
}

export function hasExtendingTokensTypesProperty(
    tokClass: TokenConstructor
): boolean {
    return has(tokClass, "extendingTokenTypes")
}

export function hasTokenNameProperty(tokClass: TokenConstructor): boolean {
    return has(tokClass, "tokenName")
}

export function isExtendingTokenType(tokType: TokenConstructor): boolean {
    return Token.prototype.isPrototypeOf(tokType.prototype)
}
