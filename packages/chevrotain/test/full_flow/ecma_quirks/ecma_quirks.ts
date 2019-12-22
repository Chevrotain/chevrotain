import { createToken } from "../../../src/scan/tokens_public"
import { Lexer } from "../../../src/scan/lexer_public"
import { EmbeddedActionsParser } from "../../../src/parse/parser/traits/parser_traits"

import {
  END_OF_FILE,
  lookAheadSequence,
  TokenMatcher
} from "../../../src/parse/parser/parser"
import { MismatchedTokenException } from "../../../src/parse/exceptions_public"
import { every, flatten, forEach, map } from "../../../src/utils/utils"
import { IOrAlt, IToken, TokenType } from "../../../api"
import { MixedInParser } from "../../../src/parse/parser/traits/parser_traits"

const Return = createToken({
  name: "Return",
  pattern: /return/
})

const DivisionOperator = createToken({
  name: "DivisionOperator",
  pattern: /\//
})

const RegExpLiteral = createToken({
  name: "RegExpLiteral",
  pattern: /\/\d+\//
})

const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /\d+/
})

// todo differentiate line terminators and other whitespace?
const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
  line_breaks: true
})

const Semicolon = createToken({
  name: "Semicolon",
  pattern: /;/
})

const allTokens = [
  WhiteSpace,
  NumberLiteral,
  Return,
  DivisionOperator,
  RegExpLiteral,
  Semicolon
]

// Avoids errors in browser tests where the bundled specs will execute this
// file even if the tests will avoid running it.
if (typeof (<any>new RegExp("(?:)")).sticky === "boolean") {
  forEach(allTokens, currTokType => {
    currTokType.PATTERN = new RegExp(currTokType.PATTERN.source, "y")
  })
}

const ErrorToken = createToken({ name: "ErrorToken" })

class EcmaScriptQuirksParser extends EmbeddedActionsParser {
  constructor() {
    super(allTokens)
    this.performSelfAnalysis()
  }

  public statement = this.RULE("statement", () => {
    this.CONSUME(Return)
    this.OPTION7(() => {
      this.SUBRULE(this.expression)
    })
    this.CONSUME(Semicolon)
  })

  public expression = this.RULE("expression", () => {
    this.SUBRULE(this.atomic)
    this.MANY(() => {
      this.CONSUME(DivisionOperator)
      this.SUBRULE2(this.atomic)
    })
  })

  public atomic = this.RULE("atomic", () => {
    this.OR6([
      { ALT: () => this.CONSUME(RegExpLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) }
    ])
  })

  private orgText
  private textIdx

  // lexer related methods
  public set textInput(newInput: string) {
    this.reset()
    this.orgText = newInput
  }

  public get textInput(): string {
    return this.orgText
  }

  // TODO: this should be protected at least but there seems some strange bug in the
  // definitions generation, try adding protected in newer releases of typescript.
  resetLexerState(): void {
    this.textIdx = 0
  }

  protected IS_NEXT_TOKEN(expectedType: TokenType): IToken | boolean {
    if (this.orgText.length <= this.textIdx) {
      return END_OF_FILE
    } else {
      this.skipWhitespace()
      return this.consumeExpected(expectedType)
    }
  }

  private skipWhitespace(): void {
    const wsPattern = WhiteSpace.PATTERN as RegExp
    wsPattern.lastIndex = this.textIdx
    const wsMatch = wsPattern.exec(this.orgText)
    if (wsMatch !== null) {
      const wsLength = wsMatch[0].length
      this.textIdx += wsLength
    }
  }

  private consumeExpected(expectedType: TokenType): IToken | false {
    // match expected
    const expectedPattern = expectedType.PATTERN as RegExp
    expectedPattern.lastIndex = this.textIdx
    const match = expectedPattern.exec(this.orgText)
    if (match !== null) {
      const image = match[0]
      const startOffset = this.textIdx
      const newToken = {
        tokenType: expectedType,
        tokenTypeIdx: expectedType.tokenTypeIdx,
        image,
        startOffset
      }
      this.textIdx += image.length
      return newToken
    }

    return false
  }

  consumeInternal(
    this: MixedInParser & EcmaScriptQuirksParser,
    tokClass: TokenType,
    idx: number
  ): IToken {
    this.skipWhitespace()
    let nextToken = this.consumeExpected(tokClass)
    if (nextToken !== false) {
      return nextToken
    } else {
      const errorToken = {
        tokenType: ErrorToken,
        tokenTypeIdx: ErrorToken.tokenTypeIdx,
        image: this.orgText[this.textIdx],
        startOffset: this.textIdx
      }
      const previousToken = this.LA(0)
      let msg = this.errorMessageProvider.buildMismatchTokenMessage({
        expected: tokClass,
        actual: errorToken,
        previous: previousToken,
        ruleName: this.getCurrRuleFullName()
      })
      throw this.SAVE_ERROR(
        new MismatchedTokenException(msg, errorToken, previousToken)
      )
    }
  }

  exportLexerState(): number {
    return this.textIdx
  }

  importLexerState(newState: number) {
    this.textIdx = newState
  }

  lookAheadBuilderForOptional(
    alt: lookAheadSequence,
    tokenMatcher: TokenMatcher,
    dynamicTokensEnabled: boolean
  ): () => boolean {
    if (!every(alt, currAlt => currAlt.length === 1)) {
      throw Error("This scannerLess parser only supports LL(1) lookahead.")
    }

    const allTokenTypes = flatten(alt)

    return function() {
      // save & restore lexer state as otherwise the text index will move ahead
      // and the parser will fail consuming the tokens we have looked ahead for.
      let lexerState = this.exportLexerState()
      try {
        for (let i = 0; i < allTokenTypes.length; i++) {
          const nextToken = this.IS_NEXT_TOKEN(allTokenTypes[i])
          if (nextToken !== false) {
            return true
          }
        }
        return false
      } finally {
        // this scannerLess parser is not very smart and efficient
        // because we do not remember the last token was saw while lookahead
        // we will have to lex it twice, once during lookahead and once during consumption...
        this.importLexerState(lexerState)
      }
    }
  }

  lookAheadBuilderForAlternatives(
    alts: lookAheadSequence[],
    hasPredicates: boolean,
    tokenMatcher: TokenMatcher,
    dynamicTokensEnabled: boolean
  ): (orAlts?: IOrAlt<any>[]) => number | undefined {
    if (
      !every(alts, currPath => every(currPath, currAlt => currAlt.length === 1))
    ) {
      throw Error("This scannerLess parser only supports LL(1) lookahead.")
    }

    const allTokenTypesPerAlt = map(alts, flatten)

    return function() {
      // save & restore lexer state as otherwise the text index will move ahead
      // and the parser will fail consuming the tokens we have looked ahead for.
      let lexerState = this.exportLexerState()
      try {
        for (let i = 0; i < allTokenTypesPerAlt.length; i++) {
          const currAltTypes = allTokenTypesPerAlt[i]

          for (let j = 0; j < currAltTypes.length; j++) {
            const nextToken = this.IS_NEXT_TOKEN(currAltTypes[j])
            if (nextToken !== false) {
              return i
            }
          }
        }
        return undefined
      } finally {
        // this scannerLess parser is not very smart and efficient
        // because we do not remember the last token was saw while lookahead
        // we will have to lex it twice, once during lookahead and once during consumption...
        this.importLexerState(lexerState)
      }
    }
  }
}

// reuse the same parser instance.
const parser = new EcmaScriptQuirksParser()

export function parse(text): any {
  parser.textInput = text
  let value = parser.statement()

  return {
    value: value,
    errors: parser.errors
  }
}
