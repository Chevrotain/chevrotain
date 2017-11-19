import { TokenConstructor } from "./lexer_public"
import { cloneArr, contains, difference, forEach, has } from "../utils/utils"
import { Token, tokenName } from "./tokens_public"
import { HashTable } from "../lang/lang_extensions"

export function tokenStructuredMatcher(tokInstance, tokConstructor) {
    const instanceType = tokInstance.tokenType
    if (instanceType === tokConstructor.tokenType) {
        return true
    } else {
        return (
            tokConstructor.isParent === true &&
            tokConstructor.extendingTokenTypesMap[instanceType] === true
        )
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

export function isBaseTokenClass(tokClass: Function): boolean {
    return tokClass === Token
}

export let tokenShortNameIdx = 1
export const tokenIdxToClass = new HashTable<TokenConstructor>()

export function augmentTokenTypes(tokenTypes: TokenConstructor[]): void {
    // 1. collect the parent Token Types as well.
    let tokenTypesAndParents = expandTokenHierarchy(tokenTypes)

    // 2. add required tokenType and extendingTokenTypes properties
    assignTokenDefaultProps(tokenTypesAndParents)

    // 3. fill up the extendingTokenTypes
    assignExtendingTokensProp(tokenTypesAndParents)
    assignExtendingTokensMapProp(tokenTypesAndParents)

    forEach(tokenTypesAndParents, tokClass => {
        tokClass.isParent = tokClass.extendingTokenTypes.length > 0
    })
}

export function expandTokenHierarchy(
    tokenTypes: TokenConstructor[]
): TokenConstructor[] {
    let tokenTypesAndParents = cloneArr(tokenTypes)

    forEach(tokenTypes, currTokClass => {
        let currParentType: any = currTokClass.parent
        while (currParentType && currParentType !== Token) {
            if (!contains(tokenTypesAndParents, currParentType)) {
                tokenTypesAndParents.push(currParentType)
            }
            currParentType = currParentType.parent
        }
    })

    return tokenTypesAndParents
}

export function assignTokenDefaultProps(tokenTypes: TokenConstructor[]): void {
    forEach(tokenTypes, currTokClass => {
        if (!hasShortKeyProperty(currTokClass)) {
            tokenIdxToClass.put(tokenShortNameIdx, currTokClass)
            ;(<any>currTokClass).tokenType = tokenShortNameIdx++
        }

        if (!hasExtendingTokensTypesProperty(currTokClass)) {
            currTokClass.extendingTokenTypes = []
        }

        if (!hasExtendingTokensTypesMapProperty(currTokClass)) {
            currTokClass.extendingTokenTypesMap = {}
        }

        if (!hasTokenNameProperty(currTokClass)) {
            // saved for fast access during CST building.
            currTokClass.tokenName = tokenName(currTokClass)
        }
    })
}

export function assignExtendingTokensProp(
    tokenTypes: TokenConstructor[]
): void {
    forEach(tokenTypes, currTokType => {
        let currSubTypesExtendingTypes = [currTokType.tokenType]
        let currParentClass: any = currTokType.parent

        while (
            currParentClass &&
            !isBaseTokenClass(currParentClass) &&
            currParentClass !== Object
        ) {
            let newExtendingTypes = difference(
                currSubTypesExtendingTypes,
                currParentClass.extendingTokenTypes
            )
            currParentClass.extendingTokenTypes = currParentClass.extendingTokenTypes.concat(
                newExtendingTypes
            )
            currSubTypesExtendingTypes.push(currParentClass.tokenType)
            currParentClass = currParentClass.parent
        }
    })
}

export function assignExtendingTokensMapProp(
    tokenTypes: TokenConstructor[]
): void {
    forEach(tokenTypes, currTokClass => {
        forEach(currTokClass.extendingTokenTypes, currExtendingType => {
            currTokClass.extendingTokenTypesMap[currExtendingType] = true
        })
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

export function hasExtendingTokensTypesMapProperty(
    tokClass: TokenConstructor
): boolean {
    return has(tokClass, "extendingTokenTypesMap")
}

export function hasTokenNameProperty(tokClass: TokenConstructor): boolean {
    return has(tokClass, "tokenName")
}

export function isExtendingTokenType(tokType: TokenConstructor): boolean {
    return has(tokType, "tokenType")
}
