import type { LookaheadSequence, TokenType } from "@chevrotain/types";

export interface Scenario {
  name: string;
  kind: "or" | "single";
  paths: LookaheadSequence[] | LookaheadSequence;
  inputs: number[][];
}

function tokenType(
  name: string,
  tokenTypeIdx: number,
  categoryMatches: number[] = [],
): TokenType {
  const categoryMatchesMap: Record<number, boolean> = Object.create(null);
  for (const categoryMatch of categoryMatches) {
    categoryMatchesMap[categoryMatch] = true;
  }
  return {
    name,
    tokenTypeIdx,
    categoryMatches,
    categoryMatchesMap,
    isParent: categoryMatches.length > 0,
  } as TokenType;
}

const A = tokenType("A", 10);
const B = tokenType("B", 11);
const C = tokenType("C", 12);
const D = tokenType("D", 13);
const E = tokenType("E", 14);
const F = tokenType("F", 15);
const CATEGORY_AB = tokenType("CategoryAB", 20, [10, 11]);
const CATEGORY_BC = tokenType("CategoryBC", 21, [11, 12]);

function ending(idx: number): TokenType {
  return tokenType(`T${idx}`, 100 + idx);
}

function fanoutOr(prefix: TokenType[], count: number): LookaheadSequence[] {
  return Array.from({ length: count }, (_, idx) => [[...prefix, ending(idx)]]);
}

function fanoutSingle(prefix: TokenType[], count: number): LookaheadSequence {
  return Array.from({ length: count }, (_, idx) => [...prefix, ending(idx)]);
}

function uniqueInputs(inputs: number[][]): number[][] {
  const seen = new Set<string>();
  return inputs.filter((input) => {
    const key = input.join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fanoutInputs(prefix: TokenType[], count: number): number[][] {
  const prefixIds = prefix.map((token) => token.tokenTypeIdx!);
  return uniqueInputs([
    [...prefixIds, 100],
    [...prefixIds, 100 + Math.floor(count / 2)],
    [...prefixIds, 100 + count - 1],
    [...prefixIds, 998],
    [],
  ]);
}

const MIXED_OR: LookaheadSequence[] = [
  [[A]],
  [[B, C]],
  [[B, D, E]],
  [[B, D, F]],
  [[C]],
];

export const SCENARIOS: Scenario[] = [
  {
    name: "OR K1 x8",
    kind: "or",
    paths: fanoutOr([], 8),
    inputs: fanoutInputs([], 8),
  },
  ...[2, 3, 4, 5, 8, 22, 36].map(
    (count): Scenario => ({
      name: `OR K2 shared x${count}`,
      kind: "or",
      paths: fanoutOr([A], count),
      inputs: fanoutInputs([A], count),
    }),
  ),
  ...[2, 3, 4, 5, 8].map(
    (count): Scenario => ({
      name: `OR K3 shared x${count}`,
      kind: "or",
      paths: fanoutOr([A, B], count),
      inputs: fanoutInputs([A, B], count),
    }),
  ),
  {
    name: "OR mixed K1-K3",
    kind: "or",
    paths: MIXED_OR,
    inputs: [[10], [11, 12], [11, 13, 14], [11, 13, 15], [12], [11, 998], []],
  },
  {
    name: "OR K2 category overlap",
    kind: "or",
    paths: [[[CATEGORY_AB, D]], [[B, E]], [[CATEGORY_BC, F]]],
    inputs: [[10, 13], [11, 13], [11, 14], [12, 15], [11, 998], []],
  },
  {
    name: "OR K2 final empty",
    kind: "or",
    paths: [[[A, B]], [[A, C]], [[]]],
    inputs: [[10, 11], [10, 12], [10, 998], [998], []],
  },
  {
    name: "Single K1 x8",
    kind: "single",
    paths: fanoutSingle([], 8),
    inputs: fanoutInputs([], 8),
  },
  ...[2, 3, 4, 5, 8, 22, 36].map(
    (count): Scenario => ({
      name: `Single K2 shared x${count}`,
      kind: "single",
      paths: fanoutSingle([A], count),
      inputs: fanoutInputs([A], count),
    }),
  ),
  ...[2, 3, 4, 5, 8].map(
    (count): Scenario => ({
      name: `Single K3 shared x${count}`,
      kind: "single",
      paths: fanoutSingle([A, B], count),
      inputs: fanoutInputs([A, B], count),
    }),
  ),
  {
    name: "Single mixed K1-K3",
    kind: "single",
    paths: MIXED_OR.flat(),
    inputs: [[10], [11, 12], [11, 13, 14], [11, 13, 15], [12], [11, 998], []],
  },
];

export function alternativesFor(scenario: Scenario): LookaheadSequence[] {
  return scenario.kind === "or"
    ? (scenario.paths as LookaheadSequence[])
    : [scenario.paths as LookaheadSequence];
}

export function maxPathLength(scenario: Scenario): number {
  let max = 0;
  for (const alternative of alternativesFor(scenario)) {
    for (const path of alternative) max = Math.max(max, path.length);
  }
  return max;
}
