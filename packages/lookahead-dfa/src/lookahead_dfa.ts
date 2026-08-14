import type { LookaheadSequence, TokenType } from "@chevrotain/types";

const MIN_MULTI_TOKEN_PATHS_FOR_DFA = 2;
const MAX_RECURSIVE_DFA_PATH_LENGTH = 32;

interface DfaCandidate {
  id: number;
  alternative: number;
  path: TokenType[];
  position: number;
}

export interface DfaTransition {
  state: number;
  tokenTypeIdx: number;
  target: number;
}

export interface DfaLookaheadMachine {
  root: number | undefined;
  fallbacks: (number | undefined)[];
  transitions: DfaTransition[];
  minTokenTypeIdx: number;
  maxTokenTypeIdx: number;
  maxCandidates: number;
}

function matchingTokenTypeIdxs(tokenType: TokenType): number[] {
  return [tokenType.tokenTypeIdx!, ...tokenType.categoryMatches!];
}

/**
 * Applies the benchmark-derived path-shape gate shared by OR and Single
 * lookahead. Dense table size is checked separately when building the runtime.
 *
 * Every path must be inspected: one path beyond K32 rejects the whole decision
 * because the compiler recursively advances one token per state. Empty and K1
 * paths do not count because Path Scan handles them without multi-token work.
 * With no overlong path, two multi-token paths are enough to favor DFA overall,
 * regardless of first-token sharing or whether the decision is OR or Single.
 */
function isDfaPathShapeProfitable(alternatives: LookaheadSequence[]): boolean {
  let qualifyingMultiTokenPathCount = 0;
  for (const alternative of alternatives) {
    for (const path of alternative) {
      if (path.length > MAX_RECURSIVE_DFA_PATH_LENGTH) return false;
      if (path.length > 1) qualifyingMultiTokenPathCount++;
    }
  }
  return qualifyingMultiTokenPathCount >= MIN_MULTI_TOKEN_PATHS_FOR_DFA;
}

export function isDfaLookaheadProfitable(
  alternatives: LookaheadSequence[],
): boolean {
  return isDfaPathShapeProfitable(alternatives);
}

export function isDfaSingleLookaheadProfitable(
  alternative: LookaheadSequence,
): boolean {
  return isDfaPathShapeProfitable([alternative]);
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

  const fallbacks: (number | undefined)[] = [];
  const transitions: DfaTransition[] = [];
  const memoizedStates = new Map<string, number>();
  let minTokenTypeIdx = Infinity;
  let maxTokenTypeIdx = -Infinity;
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

    const stateIdx = fallbacks.length;
    const fallback =
      completedAlternative === undefined
        ? undefined
        : encodeAlternative(completedAlternative);
    fallbacks.push(fallback);
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
        transitions.push({ state: stateIdx, tokenTypeIdx, target });
        minTokenTypeIdx = Math.min(minTokenTypeIdx, tokenTypeIdx);
        maxTokenTypeIdx = Math.max(maxTokenTypeIdx, tokenTypeIdx);
      }
    }

    return stateIdx;
  }

  return {
    root: compileState(candidates, fallbackAlternative),
    fallbacks,
    transitions,
    minTokenTypeIdx,
    maxTokenTypeIdx,
    maxCandidates,
  };
}
