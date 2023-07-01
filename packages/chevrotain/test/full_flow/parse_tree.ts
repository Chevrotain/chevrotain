import compact from "just-compact"
import isFunction from "lodash/isFunction"
import isUndefined from "lodash/isUndefined"
import { IToken, TokenType } from "@chevrotain/types"

export class ParseTree {
  getImage(): string {
    return this.payload.image
  }

  getLine(): number | undefined {
    return this.payload.startLine
  }

  getColumn(): number | undefined {
    return this.payload.startColumn
  }

  constructor(public payload: IToken, public children: ParseTree[] = []) {}
}

/**
 * convenience factory for ParseTrees
 *
 * @param {TokenType|Token} tokenOrTokenClass The Token instance to be used as the root node, or a constructor Function
 *                         that will create the root node.
 * @param {ParseTree[]} children The sub nodes of the ParseTree to the built
 * @returns {ParseTree}
 */
export function PT(
  tokenOrTokenClass: TokenType | IToken,
  children: ParseTree[] = []
): ParseTree | null {
  const childrenCompact = compact(children)

  if ((<IToken>tokenOrTokenClass).image !== undefined) {
    return new ParseTree(<IToken>tokenOrTokenClass, childrenCompact)
  } else if (isFunction(tokenOrTokenClass)) {
    return new ParseTree(new (<any>tokenOrTokenClass)(), childrenCompact)
  } else if (isUndefined(tokenOrTokenClass) || tokenOrTokenClass === null) {
    return null
  } else {
    throw `Invalid parameter ${tokenOrTokenClass} to PT factory.`
  }
}
