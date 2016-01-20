import {Token} from "../../src/scan/tokens_public"
import {compact, isFunction, isUndefined} from "../../src/utils/utils";

export class ParseTree {
    getImage():string { return this.payload.image }

    getLine():number { return this.payload.startLine }

    getColumn():number { return this.payload.startColumn }

    constructor(public payload:Token, public children:ParseTree[] = []) {}
}

/**
 * convenience factory for ParseTrees
 *
 * @param {Function|Token} tokenOrTokenClass The Token instance to be used as the root node, or a constructor Function
 *                         that will create the root node.
 * @param {ParseTree[]} children The sub nodes of the ParseTree to the built
 * @returns {ParseTree}
 */
export function PT(tokenOrTokenClass:Function|Token, children:ParseTree[] = []):ParseTree {
    let childrenCompact = compact(children)

    if (tokenOrTokenClass instanceof Token) {
        return new ParseTree(tokenOrTokenClass, childrenCompact)
    }
    else if (isFunction(tokenOrTokenClass)) {
        return new ParseTree(new (<any>tokenOrTokenClass)(), childrenCompact)
    }
    else if (isUndefined(tokenOrTokenClass) || tokenOrTokenClass === null) {
        return null
    }
    else {
        throw `Invalid parameter ${tokenOrTokenClass} to PT factory.`
    }
}
