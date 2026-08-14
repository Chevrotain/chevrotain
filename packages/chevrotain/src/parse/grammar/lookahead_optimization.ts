import type { IOrAlt, LookaheadSequence } from "@chevrotain/types";
import {
  buildDenseDfaAlternativesLookAheadFunc,
  buildDenseDfaSingleAlternativeLookaheadFunction,
  buildDfaLookaheadMachine,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
} from "@chevrotain/lookahead-dfa";
import { TokenMatcher } from "../parser/parser.js";
import {
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
} from "./lookahead.js";

// Select Dense DFA for eligible static lookahead, otherwise build Path Scan.
export function buildOptimizedAlternativesLookAheadFunc(
  alternatives: LookaheadSequence[],
  hasPredicates: boolean,
  tokenMatcher: TokenMatcher,
  dynamicTokensEnabled: boolean,
): (orAlts: IOrAlt<any>[]) => number | undefined {
  if (
    !hasPredicates &&
    !dynamicTokensEnabled &&
    isDfaLookaheadProfitable(alternatives)
  ) {
    const dense = buildDenseDfaAlternativesLookAheadFunc(
      buildDfaLookaheadMachine(alternatives),
    );
    if (dense !== undefined) return dense;
  }
  return buildAlternativesLookAheadFunc(
    alternatives,
    hasPredicates,
    tokenMatcher,
    dynamicTokensEnabled,
  );
}

export function buildOptimizedSingleAlternativeLookaheadFunction(
  alternative: LookaheadSequence,
  tokenMatcher: TokenMatcher,
  dynamicTokensEnabled: boolean,
): () => boolean {
  if (!dynamicTokensEnabled && isDfaSingleLookaheadProfitable(alternative)) {
    const dense = buildDenseDfaSingleAlternativeLookaheadFunction(
      buildDfaLookaheadMachine([alternative]),
    );
    if (dense !== undefined) return dense;
  }
  return buildSingleAlternativeLookaheadFunction(
    alternative,
    tokenMatcher,
    dynamicTokensEnabled,
  );
}
