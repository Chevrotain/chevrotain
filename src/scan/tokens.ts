import { TokenType } from "./lexer_public"
import { cloneArr, contains, difference, forEach, has } from "../utils/utils"
import { HashTable } from "../lang/lang_extensions"
import { tokenName } from "./tokens_public"

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

export let tokenShortNameIdx = 1
export const tokenIdxToClass = new HashTable<TokenType>()

export function augmentTokenTypes(tokenTypes: TokenType[]): void {
    // 1. collect the parent Token Types as well.
    let tokenTypesAndParents = expandTokenHierarchy(tokenTypes)

    // 2. add required tokenType and extendingTokenTypes properties
    assignTokenDefaultProps(tokenTypesAndParents)

    // 3. fill up the extendingTokenTypes
    assignExtendingTokensProp(tokenTypesAndParents)
    assignExtendingTokensMapProp(tokenTypesAndParents)

    forEach(tokenTypesAndParents, tokType => {
        tokType.isParent = tokType.extendingTokenTypes.length > 0
    })
}

export function expandTokenHierarchy(tokenTypes: TokenType[]): TokenType[] {
    let tokenTypesAndParents = cloneArr(tokenTypes)

    // TODO: modify this to scan over an array of parents?
    forEach(tokenTypes, currTokType => {
        let currParentType: any = currTokType.parent
        while (currParentType) {
            if (!contains(tokenTypesAndParents, currParentType)) {
                tokenTypesAndParents.push(currParentType)
            }
            currParentType = currParentType.parent
        }
    })

    return tokenTypesAndParents
}

export function assignTokenDefaultProps(tokenTypes: TokenType[]): void {
    forEach(tokenTypes, currTokType => {
        if (!hasShortKeyProperty(currTokType)) {
            tokenIdxToClass.put(tokenShortNameIdx, currTokType)
            ;(<any>currTokType).tokenType = tokenShortNameIdx++
        }

        if (!hasExtendingTokensTypesProperty(currTokType)) {
            currTokType.extendingTokenTypes = []
        }

        if (!hasExtendingTokensTypesMapProperty(currTokType)) {
            currTokType.extendingTokenTypesMap = {}
        }

        if (!hasTokenNameProperty(currTokType)) {
            // saved for fast access during CST building.
            currTokType.tokenName = tokenName(currTokType)
        }
    })
}

export function assignExtendingTokensProp(tokenTypes: TokenType[]): void {
    forEach(tokenTypes, currTokType => {
        let currSubTypesExtendingTypes = [currTokType.tokenType]
        let currParentClass: any = currTokType.parent

        while (currParentClass && currParentClass !== Object) {
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

export function assignExtendingTokensMapProp(tokenTypes: TokenType[]): void {
    forEach(tokenTypes, currTokType => {
        forEach(currTokType.extendingTokenTypes, currExtendingType => {
            currTokType.extendingTokenTypesMap[currExtendingType] = true
        })
    })
}

export function hasShortKeyProperty(tokType: TokenType): boolean {
    return has(tokType, "tokenType")
}

export function hasExtendingTokensTypesProperty(tokType: TokenType): boolean {
    return has(tokType, "extendingTokenTypes")
}

export function hasExtendingTokensTypesMapProperty(
    tokType: TokenType
): boolean {
    return has(tokType, "extendingTokenTypesMap")
}

export function hasTokenNameProperty(tokType: TokenType): boolean {
    return has(tokType, "tokenName")
}

export function isExtendingTokenType(tokType: TokenType): boolean {
    return has(tokType, "tokenType")
}
