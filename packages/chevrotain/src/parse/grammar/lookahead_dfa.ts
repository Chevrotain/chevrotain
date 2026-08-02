import {
  BaseParser,
  IOrAlt,
  LookaheadSequence,
  TokenType,
} from "@chevrotain/types";
import { TokenMatcher } from "../parser/parser.js";
import {
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
} from "./lookahead.js";

const MIN_DFA_SCORE = 5;
const MIN_SINGLE_DFA_CANDIDATES = 5;
const MAX_DFA_PATH_LENGTH = 32;

interface DfaCandidate {
  id: number;
  alternative: number;
  path: TokenType[];
  position: number;
}

interface DfaState {
  transitions: Record<number, number>;
  fallback: number | undefined;
}

export interface DfaLookaheadMachine {
  root: number | undefined;
  states: DfaState[];
  transitions: number;
  maxCandidates: number;
}

function matchingTokenTypeIdxs(tokenType: TokenType): number[] {
  return [tokenType.tokenTypeIdx!, ...tokenType.categoryMatches!];
}

/**
 * The DFA interpreter only pays off after enough repeated suffix comparisons are
 * removed. For each concrete first token, estimate that work as the sum of the
 * remaining path lengths. A score of five deliberately keeps K2 x2/x4 on the
 * original implementation while selecting wide/deep paths such as ECMA5's
 * Identifier x22 and LCurly x36 buckets.
 */
function isDfaLookaheadProfitableFor(
  alternatives: LookaheadSequence[],
  minCandidateCount: number,
): boolean {
  let hasMultiTokenPath = false;
  for (const alternative of alternatives) {
    for (const path of alternative) {
      // The compiler recursively advances one token per state. Preserve support
      // for unusually large maxLookahead values by using the original scanner.
      if (path.length > MAX_DFA_PATH_LENGTH) return false;
      if (path.length > 1) hasMultiTokenPath = true;
    }
  }
  if (!hasMultiTokenPath) return false;

  const candidatesByFirst: Record<
    number,
    { candidateCount: number; score: number }
  > = Object.create(null);

  for (const alternative of alternatives) {
    for (const path of alternative) {
      if (path.length === 0) continue;
      for (const tokenTypeIdx of matchingTokenTypeIdxs(path[0])) {
        const bucket = (candidatesByFirst[tokenTypeIdx] ??= {
          candidateCount: 0,
          score: 0,
        });
        bucket.candidateCount++;
        bucket.score += path.length - 1;
        if (
          bucket.candidateCount >= minCandidateCount &&
          bucket.score >= MIN_DFA_SCORE
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * OR starts paying off with fewer candidates than single-production lookahead
 * because the original implementation also scans preceding alternatives. The
 * retained benchmark shows the score threshold selects only measured wins.
 */
export function isDfaLookaheadProfitable(
  alternatives: LookaheadSequence[],
): boolean {
  return isDfaLookaheadProfitableFor(alternatives, 2);
}

/**
 * Single-production lookahead has a cheaper original loop. Chrome benchmarks
 * show K3 x3 regresses and K3 x4 is neutral, while x5 is consistently faster.
 */
export function isDfaSingleLookaheadProfitable(
  alternative: LookaheadSequence,
): boolean {
  return isDfaLookaheadProfitableFor([alternative], MIN_SINGLE_DFA_CANDIDATES);
}

export function buildDfaLookaheadMachine(
  alternatives: LookaheadSequence[],
): DfaLookaheadMachine {
  const candidates: DfaCandidate[] = [];
  let fallbackAlternative: number | undefined;
  let candidateId = 0;

  for (let alternative = 0; alternative < alternatives.length; alternative++) {
    for (const path of alternatives[alternative]) {
      if (path.length === 0) {
        fallbackAlternative = Math.min(
          fallbackAlternative ?? Infinity,
          alternative,
        );
      } else {
        candidates.push({
          id: candidateId++,
          alternative,
          path,
          position: 0,
        });
      }
    }
  }

  const states: DfaState[] = [];
  const memoizedStates = new Map<string, number>();
  let transitionCount = 0;
  let maxCandidates = 0;

  function encodeAlternative(alternative: number): number {
    return -alternative - 1;
  }

  function compileState(
    activeCandidates: DfaCandidate[],
    completedAlternative: number | undefined,
  ): number | undefined {
    if (completedAlternative !== undefined) {
      activeCandidates = activeCandidates.filter(
        (candidate) => candidate.alternative < completedAlternative,
      );
    }
    if (activeCandidates.length === 0) {
      return completedAlternative === undefined
        ? undefined
        : encodeAlternative(completedAlternative);
    }

    maxCandidates = Math.max(maxCandidates, activeCandidates.length);
    const key = `${completedAlternative ?? ""}|${activeCandidates
      .map((candidate) => `${candidate.id}:${candidate.position}`)
      .join(",")}`;
    const memoizedState = memoizedStates.get(key);
    if (memoizedState !== undefined) return memoizedState;

    const stateIdx = states.length;
    const fallback =
      completedAlternative === undefined
        ? undefined
        : encodeAlternative(completedAlternative);
    const transitions: Record<number, number> = Object.create(null);
    states.push({ fallback, transitions });
    memoizedStates.set(key, stateIdx);

    const actualTokenTypeIdxs = new Set<number>();
    for (const candidate of activeCandidates) {
      for (const tokenTypeIdx of matchingTokenTypeIdxs(
        candidate.path[candidate.position],
      )) {
        actualTokenTypeIdxs.add(tokenTypeIdx);
      }
    }

    for (const tokenTypeIdx of actualTokenTypeIdxs) {
      const nextCandidates: DfaCandidate[] = [];
      let nextCompletedAlternative = completedAlternative;

      for (const candidate of activeCandidates) {
        const expected = candidate.path[candidate.position];
        if (
          expected.tokenTypeIdx !== tokenTypeIdx &&
          expected.categoryMatchesMap![tokenTypeIdx] !== true
        ) {
          continue;
        }

        const nextPosition = candidate.position + 1;
        if (nextPosition === candidate.path.length) {
          nextCompletedAlternative = Math.min(
            nextCompletedAlternative ?? Infinity,
            candidate.alternative,
          );
        } else {
          nextCandidates.push({ ...candidate, position: nextPosition });
        }
      }

      const target = compileState(nextCandidates, nextCompletedAlternative);
      if (target !== undefined && target !== fallback) {
        transitions[tokenTypeIdx] = target;
        transitionCount++;
      }
    }

    return stateIdx;
  }

  return {
    root: compileState(candidates, fallbackAlternative),
    states,
    transitions: transitionCount,
    maxCandidates,
  };
}

export function buildDfaAlternativesLookAheadFunc(
  alternatives: LookaheadSequence[],
): () => number | undefined {
  const { root, states } = buildDfaLookaheadMachine(alternatives);
  if (root === undefined) return () => undefined;
  if (root < 0) {
    const alternative = -root - 1;
    return () => alternative;
  }

  return function (this: BaseParser): number | undefined {
    let stateIdx = root;
    for (let offset = 1; ; offset++) {
      const state = states[stateIdx];
      const target =
        state.transitions[this.LA_FAST(offset).tokenTypeIdx] ?? state.fallback;
      if (target === undefined) return undefined;
      if (target < 0) return -target - 1;
      stateIdx = target;
    }
  };
}

export function buildDfaSingleAlternativeLookaheadFunction(
  alternative: LookaheadSequence,
): () => boolean {
  const { root, states } = buildDfaLookaheadMachine([alternative]);
  if (root === undefined) return () => false;
  if (root < 0) return () => true;

  return function (this: BaseParser): boolean {
    let stateIdx = root;
    for (let offset = 1; ; offset++) {
      const state = states[stateIdx];
      const target =
        state.transitions[this.LA_FAST(offset).tokenTypeIdx] ?? state.fallback;
      if (target === undefined) return false;
      if (target < 0) return true;
      stateIdx = target;
    }
  };
}

export function buildAlternativesLookAheadFuncDfa(
  alternatives: LookaheadSequence[],
  hasPredicates: boolean,
  tokenMatcher: TokenMatcher,
  dynamicTokensEnabled: boolean,
): (orAlts: IOrAlt<any>[]) => number | undefined {
  return !hasPredicates &&
    !dynamicTokensEnabled &&
    isDfaLookaheadProfitable(alternatives)
    ? buildDfaAlternativesLookAheadFunc(alternatives)
    : buildAlternativesLookAheadFunc(
        alternatives,
        hasPredicates,
        tokenMatcher,
        dynamicTokensEnabled,
      );
}

export function buildSingleAlternativeLookaheadFunctionDfa(
  alternative: LookaheadSequence,
  tokenMatcher: TokenMatcher,
  dynamicTokensEnabled: boolean,
): () => boolean {
  return !dynamicTokensEnabled && isDfaSingleLookaheadProfitable(alternative)
    ? buildDfaSingleAlternativeLookaheadFunction(alternative)
    : buildSingleAlternativeLookaheadFunction(
        alternative,
        tokenMatcher,
        dynamicTokensEnabled,
      );
}
