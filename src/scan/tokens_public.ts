import { has, isObject, isString, isUndefined } from "../utils/utils"
import { defineNameProp, functionName } from "../lang/lang_extensions"
import { Lexer } from "./lexer_public"
import { augmentTokenTypes, tokenStructuredMatcher } from "./tokens"
import { IToken, ITokenConfig, TokenType } from "../../api"

export function tokenLabel(clazz: TokenType): string {
    if (hasTokenLabel(clazz)) {
        return (<any>clazz).LABEL
    } else {
        return tokenName(clazz)
    }
}

export function hasTokenLabel(obj: TokenType): boolean {
    return isString((<any>obj).LABEL) && (<any>obj).LABEL !== ""
}

export function tokenName(obj: TokenType | Function): string {
    // The tokenName property is needed under some old versions of node.js (0.10/0.12)
    // where the Function.prototype.name property is not defined as a 'configurable' property
    // enable producing readable error messages.
    /* istanbul ignore if -> will only run in old versions of node.js */
    if (
        isObject(obj) &&
        obj.hasOwnProperty("tokenName") &&
        isString((<any>obj).tokenName)
    ) {
        return (<any>obj).tokenName
    } else {
        return functionName(obj as TokenType)
    }
}

const PARENT = "parent"
const CATEGORIES = "categories"
const LABEL = "label"
const GROUP = "group"
const PUSH_MODE = "push_mode"
const POP_MODE = "pop_mode"
const LONGER_ALT = "longer_alt"
const LINE_BREAKS = "line_breaks"
const START_CHARS_HINT = "start_chars_hint"

export function createToken(config: ITokenConfig): TokenType {
    return createTokenInternal(config)
}

function createTokenInternal(config: ITokenConfig): TokenType {
    let tokenName = config.name
    let pattern = config.pattern

    let tokenType: any = {}
    // can be overwritten according to:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/
    // name?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FFunction%2Fname
    /* istanbul ignore if -> will only run in old versions of node.js */
    if (!defineNameProp(tokenType, tokenName)) {
        // hack to save the tokenName in situations where the constructor's name property cannot be reconfigured
        tokenType.tokenName = tokenName
    }

    if (!isUndefined(pattern)) {
        tokenType.PATTERN = pattern
    }

    if (has(config, PARENT)) {
        throw "The parent property is no longer supported.\n" +
            "See: https://github.com/SAP/chevrotain/issues/564#issuecomment-349062346 for details."
    }

    if (has(config, CATEGORIES)) {
        tokenType.CATEGORIES = config[CATEGORIES]
    }

    augmentTokenTypes([tokenType])

    if (has(config, LABEL)) {
        tokenType.LABEL = config[LABEL]
    }

    if (has(config, GROUP)) {
        tokenType.GROUP = config[GROUP]
    }

    if (has(config, POP_MODE)) {
        tokenType.POP_MODE = config[POP_MODE]
    }

    if (has(config, PUSH_MODE)) {
        tokenType.PUSH_MODE = config[PUSH_MODE]
    }

    if (has(config, LONGER_ALT)) {
        tokenType.LONGER_ALT = config[LONGER_ALT]
    }

    if (has(config, LINE_BREAKS)) {
        tokenType.LINE_BREAKS = config[LINE_BREAKS]
    }

    if (has(config, START_CHARS_HINT)) {
        tokenType.START_CHARS_HINT = config[START_CHARS_HINT]
    }

    return tokenType
}

export const EOF = createToken({ name: "EOF", pattern: Lexer.NA })
augmentTokenTypes([EOF])

export function createTokenInstance(
    tokType: TokenType,
    image: string,
    startOffset: number,
    endOffset: number,
    startLine: number,
    endLine: number,
    startColumn: number,
    endColumn: number
): IToken {
    return {
        image,
        startOffset,
        endOffset,
        startLine,
        endLine,
        startColumn,
        endColumn,
        tokenTypeIdx: (<any>tokType).tokenTypeIdx,
        tokenType: tokType
    }
}

export function tokenMatcher(token: IToken, tokType: TokenType): boolean {
    return tokenStructuredMatcher(token, tokType)
}
