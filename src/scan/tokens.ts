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
            tokConstructor.categoryMatchesMap[instanceType] === true
        )
    }
}

// Optimized tokenMatcher in case our grammar does not use token categories
// Being so tiny it is much more likely to be in-lined and this avoid the function call overhead
export function tokenStructuredMatcherNoCategories(token, tokType) {
    return token.tokenType === tokType.tokenType
}

export let tokenShortNameIdx = 1
export const tokenIdxToClass = new HashTable<TokenType>()

export function augmentTokenTypes(tokenTypes: TokenType[]): void {
    // collect the parent Token Types as well.
    let tokenTypesAndParents = expandCategories(tokenTypes)

    // add required tokenType and categoryMatches properties
    assignTokenDefaultProps(tokenTypesAndParents)

    // fill up the categoryMatches
    assignExtendingTokensMapProp(tokenTypesAndParents)
    assignExtendingTokensProp(tokenTypesAndParents)

    forEach(tokenTypesAndParents, tokType => {
        tokType.isParent = tokType.categoryMatches.length > 0
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
            currTokType.categoryMatches = []
        }

        if (!hasExtendingTokensTypesMapProperty(currTokType)) {
            currTokType.categoryMatchesMap = {}
        }

        if (!hasTokenNameProperty(currTokType)) {
            // saved for fast access during CST building.
            currTokType.tokenName = tokenName(currTokType)
        }
    })
}

export function assignExtendingTokensProp(tokenTypes: TokenType[]): void {
    forEach(tokenTypes, currTokType => {
        // avoid duplications
        currTokType.categoryMatches = []
        forEach(currTokType.categoryMatchesMap, (val, key) => {
            currTokType.categoryMatches.push(tokenIdxToClass.get(key).tokenType)
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
        nextNode.categoryMatchesMap[pathNode.tokenType] = true
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
    return has(tokType, "categoryMatches")
}

export function hasExtendingTokensTypesMapProperty(
    tokType: TokenType
): boolean {
    return has(tokType, "categoryMatchesMap")
}

export function hasTokenNameProperty(tokType: TokenType): boolean {
    return has(tokType, "tokenName")
}

export function isExtendingTokenType(tokType: TokenType): boolean {
    return has(tokType, "tokenType")
}
