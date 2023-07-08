import { createToken, Lexer, CstParser } from "chevrotain"

// ----------------- lexer -----------------
export const True = createToken({ name: "True", pattern: /true/ })
export const False = createToken({ name: "False", pattern: /false/ })
export const Null = createToken({ name: "Null", pattern: /null/ })
export const LCurly = createToken({ name: "LCurly", pattern: /{/ })
export const RCurly = createToken({ name: "RCurly", pattern: /}/ })
export const LSquare = createToken({ name: "LSquare", pattern: /\[/ })
export const RSquare = createToken({ name: "RSquare", pattern: /]/ })
export const Comma = createToken({ name: "Comma", pattern: /,/ })
export const Colon = createToken({ name: "Colon", pattern: /:/ })
export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/
})
export const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
})
export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

const allTokens = [
  WhiteSpace,
  NumberLiteral,
  StringLiteral,
  LCurly,
  RCurly,
  LSquare,
  RSquare,
  Comma,
  Colon,
  True,
  False,
  Null
]
const JsonLexer = new Lexer(allTokens, {
  // Less verbose tokens will make the test's assertions easier to understand
  positionTracking: "onlyOffset"
})

// ----------------- parser -----------------

class JsonParser extends CstParser {
  constructor() {
    super(allTokens, {
      // by default, the error recovery / fault tolerance capabilities are disabled
      recoveryEnabled: true
    })

    // not mandatory, using <$> (or any other sign) to reduce verbosity (this. this. this. this. .......)
    const $ = this

    this.RULE("json", () => {
      // prettier-ignore
      $.OR([
                {ALT: () => {$.SUBRULE($.object)}},
                {ALT: () => {$.SUBRULE($.array)}}
            ])
    })

    this.RULE("object", () => {
      $.CONSUME(LCurly)
      $.OPTION(() => {
        $.SUBRULE($.objectItem)
        $.MANY(() => {
          $.CONSUME(Comma)
          $.SUBRULE2($.objectItem)
        })
      })
      $.CONSUME(RCurly)
    })

    this.RULE("objectItem", () => {
      $.CONSUME(StringLiteral)
      $.CONSUME(Colon)
      $.SUBRULE($.value)
    })

    this.RULE("array", () => {
      $.CONSUME(LSquare)
      $.OPTION(() => {
        $.SUBRULE($.value)
        $.MANY(() => {
          $.CONSUME(Comma)
          $.SUBRULE2($.value)
        })
      })
      $.CONSUME(RSquare)
    })

    this.RULE("value", () => {
      // prettier-ignore
      $.OR([
                {ALT: () => {$.CONSUME(StringLiteral)}},
                {ALT: () => {$.CONSUME(NumberLiteral)}},
                {ALT: () => {$.SUBRULE($.object)}},
                {ALT: () => {$.SUBRULE($.array)}},
                {ALT: () => {$.CONSUME(True)}},
                {ALT: () => {$.CONSUME(False)}},
                {ALT: () => {$.CONSUME(Null)}}
            ])
    })

    // very important to call this after all the rules have been defined.
    // otherwise, the parser may not work correctly as it will lack information
    // derived during the self-analysis phase.
    this.performSelfAnalysis()
  }
}

// reuse the same parser instance.
const parser = new JsonParser()

// ----------------- wrapping it all together -----------------
export function parseJsonToCst(text) {
  const lexResult = JsonLexer.tokenize(text)

  // setting a new input will RESET the parser instance's state.
  parser.input = lexResult.tokens

  // any top level rule may be used as an entry point
  const cst = parser.json()

  return {
    cst: cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors
  }
}
