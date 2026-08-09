import type { BaseParser } from "@chevrotain/types";
import type { DfaLookaheadMachine } from "../lookahead_dfa.js";

export const MAX_DENSE_DFA_CELLS = 4096;

interface DenseDfaMachine {
  base: number;
  width: number;
  transitions: Int32Array;
  fallbacks: Int32Array;
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

  const transitions = new Int32Array(cellCount);
  const fallbacks = new Int32Array(machine.fallbacks.length);
  for (let stateIdx = 0; stateIdx < machine.fallbacks.length; stateIdx++) {
    fallbacks[stateIdx] = machine.fallbacks[stateIdx] ?? 0;
  }
  for (const transition of machine.transitions) {
    const column = transition.tokenTypeIdx - minTokenTypeIdx;
    transitions[transition.state * width + column] =
      transition.target < 0 ? transition.target : transition.target + 1;
  }

  return {
    base: Number.isFinite(minTokenTypeIdx) ? minTokenTypeIdx : 0,
    width,
    transitions,
    fallbacks,
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
  const { base, width, transitions, fallbacks } = dense;

  return function (this: BaseParser): number | undefined {
    let stateIdx = root;
    for (let offset = 1; ; offset++) {
      const column = this.LA_FAST(offset).tokenTypeIdx - base;
      const transition =
        column >= 0 && column < width
          ? transitions[stateIdx * width + column]
          : 0;
      const target = transition || fallbacks[stateIdx];
      if (target === 0) return undefined;
      if (target < 0) return -target - 1;
      stateIdx = target - 1;
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
  const { base, width, transitions, fallbacks } = dense;

  return function (this: BaseParser): boolean {
    let stateIdx = root;
    for (let offset = 1; ; offset++) {
      const column = this.LA_FAST(offset).tokenTypeIdx - base;
      const transition =
        column >= 0 && column < width
          ? transitions[stateIdx * width + column]
          : 0;
      const target = transition || fallbacks[stateIdx];
      if (target === 0) return false;
      if (target < 0) return true;
      stateIdx = target - 1;
    }
  };
}
