import { IToken, TokenType } from "@chevrotain/types";

/**
 * Checks whether `tokInstance` is of type `tokConstructor` or one of its
 * category ancestors. Uses a Uint32Array bitset (MATCH_SET) instead of the
 * old categoryMatchesMap object lookup — one bitwise AND vs. a property read
 * and coercion, and stays monomorphic because MATCH_SET is always the same
 * type (Uint32Array | null).
 */
export function tokenStructuredMatcher(
  tokInstance: IToken,
  tokConstructor: TokenType,
) {
  const instanceType = tokInstance.tokenTypeIdx;
  if (instanceType === tokConstructor.tokenTypeIdx) {
    return true;
  }
  const matchSet = tokConstructor.MATCH_SET;
  return (
    matchSet !== null &&
    matchSet !== undefined &&
    (matchSet[instanceType >> 5] & (1 << (instanceType & 31))) !== 0
  );
}

/**
 * Fast path for grammars with no token categories. Tiny enough for V8 to
 * inline at every call site, avoiding the MATCH_SET branch entirely.
 */
export function tokenStructuredMatcherNoCategories(
  token: IToken,
  tokType: TokenType,
) {
  return token.tokenTypeIdx === tokType.tokenTypeIdx;
}

export let tokenShortNameIdx = 1;
export const tokenIdxToClass: { [tokenIdx: number]: TokenType } = {};

export function augmentTokenTypes(tokenTypes: TokenType[]): void {
  // collect the parent Token Types as well.
  const tokenTypesAndParents = expandCategories(tokenTypes);

  // assign tokenTypeIdx and normalize CATEGORIES on any token not yet augmented
  assignTokenDefaultProps(tokenTypesAndParents);

  // fill up the categoryMatchesMap (used by lookahead, kept for compatibility)
  assignCategoriesMapProp(tokenTypesAndParents);
  assignCategoriesTokensProp(tokenTypesAndParents);

  tokenTypesAndParents.forEach((tokType) => {
    tokType.isParent = tokType.categoryMatches!.length > 0;
  });

  // Build MATCH_SET bitsets after all indices are finalized so the array is
  // sized correctly. One word covers 32 token indices.
  const setSize = (tokenShortNameIdx >>> 5) + 1;
  tokenTypesAndParents.forEach((tokType) => {
    if (tokType.isParent) {
      const matchSet = new Uint32Array(setSize);
      tokType.categoryMatches!.forEach((idx) => {
        matchSet[idx >> 5] |= 1 << (idx & 31);
      });
      tokType.MATCH_SET = matchSet;
    } else {
      tokType.MATCH_SET = null;
    }
  });
}

export function expandCategories(tokenTypes: TokenType[]): TokenType[] {
  let result = [...tokenTypes];

  let categories = tokenTypes;
  let searching = true;
  while (searching) {
    categories = categories
      .map((currTokType) => currTokType.CATEGORIES)
      .flat()
      .filter(Boolean) as TokenType[];

    const newCategories = categories.filter((x) => !result.includes(x));

    result = result.concat(newCategories);

    if (newCategories.length === 0) {
      searching = false;
    } else {
      categories = newCategories;
    }
  }
  return result;
}

export function assignTokenDefaultProps(tokenTypes: TokenType[]): void {
  tokenTypes.forEach((currTokType) => {
    if (!hasShortKeyProperty(currTokType)) {
      tokenIdxToClass[tokenShortNameIdx] = currTokType;
      (<any>currTokType).tokenTypeIdx = tokenShortNameIdx++;
    }

    // CATEGORIES? : TokenType | TokenType[]
    if (
      hasCategoriesProperty(currTokType) &&
      !Array.isArray(currTokType.CATEGORIES)
      // &&
      // !isUndefined(currTokType.CATEGORIES.PATTERN)
    ) {
      currTokType.CATEGORIES = [currTokType.CATEGORIES as unknown as TokenType];
    }

    if (!hasCategoriesProperty(currTokType)) {
      currTokType.CATEGORIES = [];
    }

    if (!hasExtendingTokensTypesProperty(currTokType)) {
      currTokType.categoryMatches = [];
    }

    if (!hasExtendingTokensTypesMapProperty(currTokType)) {
      currTokType.categoryMatchesMap = {};
    }
  });
}

export function assignCategoriesTokensProp(tokenTypes: TokenType[]): void {
  tokenTypes.forEach((currTokType) => {
    // avoid duplications
    currTokType.categoryMatches = [];
    Object.keys(currTokType.categoryMatchesMap!).forEach((key) => {
      currTokType.categoryMatches!.push(
        tokenIdxToClass[key as unknown as number].tokenTypeIdx!,
      );
    });
  });
}

export function assignCategoriesMapProp(tokenTypes: TokenType[]): void {
  tokenTypes.forEach((currTokType) => {
    singleAssignCategoriesToksMap([], currTokType);
  });
}

export function singleAssignCategoriesToksMap(
  path: TokenType[],
  nextNode: TokenType,
): void {
  path.forEach((pathNode) => {
    nextNode.categoryMatchesMap![pathNode.tokenTypeIdx!] = true;
  });

  nextNode.CATEGORIES!.forEach((nextCategory) => {
    const newPath = path.concat(nextNode);
    // avoids infinite loops due to cyclic categories.
    if (!newPath.includes(nextCategory)) {
      singleAssignCategoriesToksMap(newPath, nextCategory);
    }
  });
}

/**
 * Returns true if `tokType` has already been assigned a tokenTypeIdx by
 * augmentTokenTypes(). Uses a value check (non-zero) rather than
 * Object.hasOwn because tokenTypeIdx is now always pre-declared as 0.
 * Null guard preserved because gast_recorder.ts passes user-supplied values
 * that may be null.
 */
export function hasShortKeyProperty(tokType: TokenType): boolean {
  return tokType != null && !!tokType.tokenTypeIdx;
}

export function hasCategoriesProperty(tokType: TokenType): boolean {
  return Object.hasOwn(tokType ?? {}, "CATEGORIES");
}

export function hasExtendingTokensTypesProperty(tokType: TokenType): boolean {
  return Object.hasOwn(tokType ?? {}, "categoryMatches");
}

export function hasExtendingTokensTypesMapProperty(
  tokType: TokenType,
): boolean {
  return Object.hasOwn(tokType ?? {}, "categoryMatchesMap");
}

export function isTokenType(tokType: TokenType): boolean {
  return Object.hasOwn(tokType ?? {}, "tokenTypeIdx");
}
