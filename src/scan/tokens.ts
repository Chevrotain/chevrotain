import { TokenType } from "./lexer_public"
import {
    cloneArr,
    compact,
    contains,
    difference,
    flatten,
    forEach,
    has,
    isArray,
    isEmpty,
    isUndefined,
    map
} from "../utils/utils"
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
    // collect the parent Token Types as well.
    let tokenTypesAndParents = expandCategories(tokenTypes)

    // add required tokenType and extendingTokenTypes properties
    assignTokenDefaultProps(tokenTypesAndParents)

    // fill up the extendingTokenTypes
    assignExtendingTokensMapProp(tokenTypesAndParents)
    assignExtendingTokensProp(tokenTypesAndParents)

    forEach(tokenTypesAndParents, tokType => {
        tokType.isParent = tokType.extendingTokenTypes.length > 0
    })
}

export function expandCategories(tokenTypes: TokenType[]): TokenType[] {
    let result = cloneArr(tokenTypes)

    let categories = tokenTypes
    let searching = true
    while (searching) {
        categories = compact(
            flatten(map(categories, currTokType => currTokType.CATEGORIES))
        )

        let newCategories = difference(categories, result)

        result = result.concat(newCategories)

        if (isEmpty(newCategories)) {
            searching = false
        } else {
            categories = newCategories
        }
    }
    return result
}

export function assignTokenDefaultProps(tokenTypes: TokenType[]): void {
    forEach(tokenTypes, currTokType => {
        if (!hasShortKeyProperty(currTokType)) {
            tokenIdxToClass.put(tokenShortNameIdx, currTokType)
            ;(<any>currTokType).tokenType = tokenShortNameIdx++
        }

        // CATEGORIES? : TokenType | TokenType[]
        if (
            hasCategoriesProperty(currTokType) &&
            !isArray(currTokType.CATEGORIES)
            // &&
            // !isUndefined(currTokType.CATEGORIES.PATTERN)
        ) {
            currTokType.CATEGORIES = [currTokType.CATEGORIES]
        }

        if (!hasCategoriesProperty(currTokType)) {
            currTokType.CATEGORIES = []
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
        forEach(currTokType.extendingTokenTypesMap, (val, key) => {
            currTokType.extendingTokenTypes.push(tokenIdxToClass[key])
        })
    })
}

export function assignExtendingTokensMapProp(tokenTypes: TokenType[]): void {
    forEach(tokenTypes, currTokType => {
        singleAssignExtendingToksMap([], currTokType)
    })
}

function singleAssignExtendingToksMap(
    path: TokenType[],
    nextNode: TokenType
): void {
    forEach(path, pathNode => {
        nextNode.extendingTokenTypesMap[pathNode.tokenType] = true
    })

    forEach(nextNode.CATEGORIES, nextCategory => {
        const newPath = path.concat(nextNode)
        if (!contains(newPath, nextCategory)) {
            singleAssignExtendingToksMap(newPath, nextCategory)
        }
    })
}

export function hasShortKeyProperty(tokType: TokenType): boolean {
    return has(tokType, "tokenType")
}

export function hasCategoriesProperty(tokType: TokenType): boolean {
    return has(tokType, "CATEGORIES")
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
