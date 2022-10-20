/* istanbul ignore file - tricky to import some things from this module during testing */

// semantic version
export { VERSION } from "./version"

export {
  CstParser,
  EmbeddedActionsParser,
  ParserDefinitionErrorType,
  EMPTY_ALT
} from "./parse/parser/parser"

export { Lexer, LexerDefinitionErrorType } from "./scan/lexer_public"

// Tokens utilities
export {
  createToken,
  createTokenInstance,
  EOF,
  tokenLabel,
  tokenMatcher,
  tokenName
} from "./scan/tokens_public"

// Lookahead

export { getLookaheadPaths } from "./parse/grammar/lookahead"

export { LLkLookaheadStrategy } from "./parse/grammar/llk_lookahead"

// Other Utilities

export { defaultParserErrorProvider } from "./parse/errors_public"

export {
  EarlyExitException,
  isRecognitionException,
  MismatchedTokenException,
  NotAllInputParsedException,
  NoViableAltException
} from "./parse/exceptions_public"

export { defaultLexerErrorProvider } from "./scan/lexer_errors_public"

// grammar reflection API
export {
  Alternation,
  Alternative,
  NonTerminal,
  Option,
  Repetition,
  RepetitionMandatory,
  RepetitionMandatoryWithSeparator,
  RepetitionWithSeparator,
  Rule,
  Terminal
} from "@chevrotain/gast"

// GAST Utilities

export {
  serializeGrammar,
  serializeProduction,
  GAstVisitor
} from "@chevrotain/gast"

export { generateCstDts } from "@chevrotain/cst-dts-gen"

/* istanbul ignore next */
export function clearCache() {
  console.warn(
    "The clearCache function was 'soft' removed from the Chevrotain API." +
      "\n\t It performs no action other than printing this message." +
      "\n\t Please avoid using it as it will be completely removed in the future"
  )
}

export { createSyntaxDiagramsCode } from "./diagrams/render_public"

export class Parser {
  constructor() {
    throw new Error(
      "The Parser class has been deprecated, use CstParser or EmbeddedActionsParser instead.\t\n" +
        "See: https://chevrotain.io/docs/changes/BREAKING_CHANGES.html#_7-0-0"
    )
  }
}
