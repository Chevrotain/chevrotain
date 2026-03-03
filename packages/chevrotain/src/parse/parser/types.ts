/**
 * Helper common type definitions
 * Particularly useful when expending the public API
 * to include additional **internal** properties.
 */
import { IParserConfig, ParserMethod } from "@chevrotain/types";

export type ParserMethodInternal<ARGS extends unknown[], R> = ParserMethod<
  ARGS,
  R
> & {
  ruleName: string;
  originalGrammarAction: Function;
  /**
   * The core rule function that bypasses root-level hooks (onBeforeParse/onAfterParse).
   * Used by subruleInternal and BACKTRACK to invoke rules without triggering
   * the before/after parse hooks that should only fire for top-level (root) invocations.
   */
  coreRule: ParserMethod<ARGS, R>;
};

export type IParserConfigInternal = IParserConfig & { outputCst: boolean };
