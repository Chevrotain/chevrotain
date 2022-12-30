import { IToken, TokenType } from "@chevrotain/types"

export function tokenStructuredMatcher(
  tokInstance: IToken,
  tokConstructor: TokenType
) {
  const instanceType = tokInstance.tokenTypeIdx
  if (instanceType === tokConstructor.tokenTypeIdx) {
    return true
  } else {
    return (
      tokConstructor.isParent === true &&
      tokConstructor.categoryMatchesMap![instanceType] === true
    )
  }
}

// Optimized tokenMatcher in case our grammar does not use token categories
// Being so tiny it is much more likely to be in-lined and this avoid the function call overhead
export function tokenStructuredMatcherNoCategories(
  token: IToken,
  tokType: TokenType
) {
  return token.tokenTypeIdx === tokType.tokenTypeIdx
}

export let tokenShortNameIdx = 1
export const tokenIdxToClass: { [tokenIdx: number]: TokenType } = {}

export function augmentTokenTypes(tokenTypes: TokenType[]): void {
  // collect the parent Token Types as well.
  const tokenTypesAndParents = expandCategories(tokenTypes)

  // add required tokenType and categoryMatches properties
  assignTokenDefaultProps(tokenTypesAndParents)

  // fill up the categoryMatches
  assignCategoriesMapProp(tokenTypesAndParents)
  assignCategoriesTokensProp(tokenTypesAndParents)

  tokenTypesAndParents.forEach((tokType) => {
    tokType.isParent = tokType.categoryMatches!.length > 0
  })
}

export function expandCategories(tokenTypes: TokenType[]): TokenType[] {
  let result = tokenTypes.slice()

  let categories = tokenTypes
  let searching = true
  while (searching) {
    categories = ([] as (TokenType | undefined)[])
      .concat(...categories.map((currTokType) => currTokType.CATEGORIES))
      .filter((cat) => cat !== undefined) as TokenType[]

    const newCategories = categories.filter((cat) => result.indexOf(cat) === -1)

    result = result.concat(newCategories)

    if (newCategories.length === 0) {
      searching = false
    } else {
      categories = newCategories
    }
  }
  return result
}

export function assignTokenDefaultProps(tokenTypes: TokenType[]): void {
  tokenTypes.forEach((currTokType) => {
    if (!hasShortKeyProperty(currTokType)) {
      tokenIdxToClass[tokenShortNameIdx] = currTokType
      ;(<any>currTokType).tokenTypeIdx = tokenShortNameIdx++
    }

    // CATEGORIES? : TokenType | TokenType[]
    if (
      hasCategoriesProperty(currTokType) &&
      !Array.isArray(currTokType.CATEGORIES)
      // &&
      // !isUndefined(currTokType.CATEGORIES.PATTERN)
    ) {
      currTokType.CATEGORIES = [currTokType.CATEGORIES as unknown as TokenType]
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
  })
}

export function assignCategoriesTokensProp(tokenTypes: TokenType[]): void {
  tokenTypes.forEach((currTokType) => {
    // avoid duplications
    currTokType.categoryMatches = []
    Object.entries(currTokType.categoryMatchesMap!).forEach(([key, val]) => {
      currTokType.categoryMatches!.push(
        tokenIdxToClass[key as unknown as number].tokenTypeIdx!
      )
    })
  })
}

export function assignCategoriesMapProp(tokenTypes: TokenType[]): void {
  tokenTypes.forEach((currTokType) => {
    singleAssignCategoriesToksMap([], currTokType)
  })
}

export function singleAssignCategoriesToksMap(
  path: TokenType[],
  nextNode: TokenType
): void {
  path.forEach((pathNode) => {
    nextNode.categoryMatchesMap![pathNode.tokenTypeIdx!] = true
  })

  nextNode.CATEGORIES?.forEach((nextCategory) => {
    const newPath = path.concat(nextNode)
    // avoids infinite loops due to cyclic categories.
    if (newPath.indexOf(nextCategory) === -1) {
      singleAssignCategoriesToksMap(newPath, nextCategory)
    }
  })
}

export function hasShortKeyProperty(tokType: TokenType): boolean {
  return tokType !== null && tokType.hasOwnProperty("tokenTypeIdx")
}

export function hasCategoriesProperty(tokType: TokenType): boolean {
  return tokType !== null && tokType.hasOwnProperty("CATEGORIES")
}

export function hasExtendingTokensTypesProperty(tokType: TokenType): boolean {
  return tokType !== null && tokType.hasOwnProperty("categoryMatches")
}

export function hasExtendingTokensTypesMapProperty(
  tokType: TokenType
): boolean {
  return tokType !== null && tokType.hasOwnProperty("categoryMatchesMap")
}

export function isTokenType(tokType: TokenType): boolean {
  return tokType !== null && tokType.hasOwnProperty("tokenTypeIdx")
}
