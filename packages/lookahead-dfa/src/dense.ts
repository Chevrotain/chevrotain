import type { DfaLookaheadMachine } from "./lookahead_dfa.js";

export const MAX_DENSE_DFA_CELLS = 4096;

interface LookaheadHost {
  LA_FAST(howMuch: number): { tokenTypeIdx: number };
}

interface DenseDfaMachine {
  base: number;
  width: number;
  stride: number;
  transitions: Int32Array;
}

export function denseDfaCellCount(machine: DfaLookaheadMachine): number {
  const width = Number.isFinite(machine.minTokenTypeIdx)
    ? machine.maxTokenTypeIdx - machine.minTokenTypeIdx + 1
    : 0;
  return machine.fallbacks.length * width;
}

function toDenseDfaMachine(
  machine: DfaLookaheadMachine,
): DenseDfaMachine | undefined {
  const { minTokenTypeIdx, maxTokenTypeIdx } = machine;
  const width = Number.isFinite(minTokenTypeIdx)
    ? maxTokenTypeIdx - minTokenTypeIdx + 1
    : 0;
  const cellCount = machine.fallbacks.length * width;
  if (cellCount > MAX_DENSE_DFA_CELLS) return undefined;

  const stride = width + 1;
  const transitions = new Int32Array(machine.fallbacks.length * stride);
  for (let stateIdx = 0; stateIdx < machine.fallbacks.length; stateIdx++) {
    const fallback = machine.fallbacks[stateIdx] ?? 0;
    if (fallback !== 0) {
      const rowStart = stateIdx * stride;
      transitions.fill(fallback, rowStart, rowStart + stride);
    }
  }
  for (const transition of machine.transitions) {
    const column = transition.tokenTypeIdx - minTokenTypeIdx;
    transitions[transition.state * stride + 1 + column] =
      transition.target < 0
        ? transition.target
        : transition.target * stride + 1;
  }

  return {
    base: Number.isFinite(minTokenTypeIdx) ? minTokenTypeIdx : 0,
    width,
    stride,
    transitions,
  };
}

export function buildDenseDfaAlternativesLookAheadFunc(
  machine: DfaLookaheadMachine,
): (() => number | undefined) | undefined {
  const { root } = machine;
  if (root === undefined) return () => undefined;
  if (root < 0) {
    const alternative = -root - 1;
    return () => alternative;
  }

  const dense = toDenseDfaMachine(machine);
  if (dense === undefined) return undefined;
  const { base, width, stride, transitions } = dense;

  return function (this: LookaheadHost): number | undefined {
    let row = root * stride + 1;
    for (let offset = 1; ; offset++) {
      const column = this.LA_FAST(offset).tokenTypeIdx - base;
      const target =
        transitions[column >= 0 && column < width ? row + column : row - 1];
      if (target === 0) return undefined;
      if (target < 0) return -target - 1;
      row = target;
    }
  };
}

export function buildDenseDfaSingleAlternativeLookaheadFunction(
  machine: DfaLookaheadMachine,
): (() => boolean) | undefined {
  const { root } = machine;
  if (root === undefined) return () => false;
  if (root < 0) return () => true;

  const dense = toDenseDfaMachine(machine);
  if (dense === undefined) return undefined;
  const { base, width, stride, transitions } = dense;

  return function (this: LookaheadHost): boolean {
    let row = root * stride + 1;
    for (let offset = 1; ; offset++) {
      const column = this.LA_FAST(offset).tokenTypeIdx - base;
      const target =
        transitions[column >= 0 && column < width ? row + column : row - 1];
      if (target === 0) return false;
      if (target < 0) return true;
      row = target;
    }
  };
}
