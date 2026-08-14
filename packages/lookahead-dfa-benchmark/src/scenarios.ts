import type { LookaheadSequence, TokenType } from "@chevrotain/types";

export interface Scenario {
  shape: string;
  workload?:
    | "balanced"
    | "early80"
    | "first-alt80"
    | "hit-only"
    | "miss-only"
    | "fallback80";
  kind: "or" | "single";
  paths: LookaheadSequence[] | LookaheadSequence;
  inputs: number[][];
}

export function scenarioLabel(scenario: Scenario): string {
  return scenario.workload === undefined
    ? scenario.shape
    : `${scenario.shape} ${scenario.workload}`;
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
const HIGH_A = tokenType("HighA", 100_000);

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

function nonSharedPaths(count: number, depth = 2): TokenType[][] {
  return Array.from({ length: count }, (_, pathIdx) =>
    Array.from({ length: depth }, (_, tokenIdx) =>
      ending(pathIdx * depth + tokenIdx),
    ),
  );
}

function nonSharedInputs(paths: TokenType[][]): number[][] {
  const ids = paths.map((path) => path.map((token) => token.tokenTypeIdx!));
  if (ids.length === 2) {
    return [ids[0], ids[1], [ids[1][0], 998], []];
  }
  const middle = ids[Math.floor(ids.length / 2)];
  return [ids[0], middle, ids[ids.length - 1], [middle[0], 998], [998], []];
}

function earlyBiased(inputs: number[][]): number[][] {
  const [first, ...rest] = inputs;
  return [...Array.from({ length: rest.length * 4 }, () => first), ...rest];
}

function nonSharedScenarios(
  kind: "or" | "single",
  depth: number,
  count: number,
  workloads: ("balanced" | "early80")[],
): Scenario[] {
  const paths = nonSharedPaths(count, depth);
  const inputs = nonSharedInputs(paths);
  return workloads.map((workload) => ({
    shape: `${kind === "or" ? "OR" : "Single"} K${depth} non-shared x${count}`,
    workload,
    kind,
    paths: kind === "or" ? paths.map((path) => [path]) : paths,
    inputs: workload === "balanced" ? inputs : earlyBiased(inputs),
  }));
}

function customFanoutOr(
  prefix: TokenType[],
  endingTokenTypeIdxs: number[],
): LookaheadSequence[] {
  return endingTokenTypeIdxs.map((tokenTypeIdx, idx) => [
    [...prefix, tokenType(`CustomT${idx}`, tokenTypeIdx)],
  ]);
}

function customFanoutInputs(
  prefix: TokenType[],
  endingTokenTypeIdxs: number[],
): number[][] {
  const prefixIds = prefix.map((token) => token.tokenTypeIdx!);
  return [
    [...prefixIds, endingTokenTypeIdxs[0]],
    [
      ...prefixIds,
      endingTokenTypeIdxs[Math.floor(endingTokenTypeIdxs.length / 2)],
    ],
    [...prefixIds, endingTokenTypeIdxs[endingTokenTypeIdxs.length - 1]],
    [...prefixIds, 998],
    [],
  ];
}

function sharedProbeScenarios(
  kind: "or" | "single",
  prefix: TokenType[],
  depth: 2 | 3,
  inRangeMiss: TokenType,
): Scenario[] {
  const paths = kind === "or" ? fanoutOr(prefix, 8) : fanoutSingle(prefix, 8);
  const prefixIds = prefix.map((token) => token.tokenTypeIdx!);
  const label = kind === "or" ? "OR" : "Single";
  return [
    {
      shape: `${label} K${depth} shared x8`,
      workload: "hit-only",
      kind,
      paths,
      inputs: [
        [...prefixIds, 100],
        [...prefixIds, 104],
        [...prefixIds, 107],
      ],
    },
    {
      shape: `${label} K${depth} shared x8`,
      workload: "miss-only",
      kind,
      paths,
      inputs: [
        [...prefixIds, inRangeMiss.tokenTypeIdx!],
        [...prefixIds, 1],
        [...prefixIds, 998],
      ],
    },
  ];
}

const MIXED_OR: LookaheadSequence[] = [
  [[A]],
  [[B, C]],
  [[B, D, E]],
  [[B, D, F]],
  [[C]],
];

const ONE_MULTI_PATHS: TokenType[][] = [[A, B], [C], [D], [E]];
const ONE_MULTI_INPUTS = [
  [10, 11],
  [12],
  [13],
  [14],
  [10, 998],
  [11],
  [998],
  [],
];
const CATEGORY_PATHS: TokenType[][] = [
  [CATEGORY_AB, D],
  [B, E],
  [CATEGORY_BC, F],
];
const CATEGORY_INPUTS = [[10, 13], [11, 13], [11, 14], [12, 15], [11, 998], []];

export const SCENARIOS: Scenario[] = [
  {
    shape: "OR K1 x8",
    kind: "or",
    paths: fanoutOr([], 8),
    inputs: fanoutInputs([], 8),
  },
  ...[2, 8, 22, 36].map(
    (count): Scenario => ({
      shape: `OR K2 shared x${count}`,
      kind: "or",
      paths: fanoutOr([A], count),
      inputs: fanoutInputs([A], count),
    }),
  ),
  ...nonSharedScenarios("or", 2, 2, ["balanced", "early80"]),
  ...nonSharedScenarios("or", 2, 8, ["balanced"]),
  {
    shape: "OR K3 shared x2",
    kind: "or",
    paths: fanoutOr([A, B], 2),
    inputs: fanoutInputs([A, B], 2),
  },
  ...nonSharedScenarios("or", 4, 2, ["balanced", "early80"]),
  {
    shape: "OR mixed K1-K2 one-multi x4",
    workload: "balanced",
    kind: "or",
    paths: ONE_MULTI_PATHS.map((path) => [path]),
    inputs: ONE_MULTI_INPUTS,
  },
  {
    shape: "OR K2 grouped 2-alt x8",
    workload: "first-alt80",
    kind: "or",
    paths: [
      Array.from({ length: 4 }, (_, idx) => [A, ending(idx)]),
      Array.from({ length: 4 }, (_, idx) => [B, ending(idx + 4)]),
    ],
    inputs: [
      ...Array.from({ length: 16 }, (_, idx) => [10, 100 + (idx % 4)]),
      [11, 104],
      [11, 107],
      [11, 998],
      [998],
    ],
  },
  {
    shape: "OR mixed K1-K3",
    kind: "or",
    paths: MIXED_OR,
    inputs: [[10], [11, 12], [11, 13, 14], [11, 13, 15], [12], [11, 998], []],
  },
  {
    shape: "OR K2 category overlap",
    kind: "or",
    paths: CATEGORY_PATHS.map((path) => [path]),
    inputs: CATEGORY_INPUTS,
  },
  {
    shape: "OR K2 final empty",
    kind: "or",
    paths: [[[A, B]], [[A, C]], [[]]],
    inputs: [[10, 11], [10, 12], [10, 998], [998], []],
  },
  {
    shape: "OR K2 high contiguous IDs x5",
    kind: "or",
    paths: customFanoutOr(
      [HIGH_A],
      [100_100, 100_101, 100_102, 100_103, 100_104],
    ),
    inputs: customFanoutInputs(
      [HIGH_A],
      [100_100, 100_101, 100_102, 100_103, 100_104],
    ),
  },
  {
    shape: "Single K1 x8",
    kind: "single",
    paths: fanoutSingle([], 8),
    inputs: fanoutInputs([], 8),
  },
  ...[2, 8].map(
    (count): Scenario => ({
      shape: `Single K2 shared x${count}`,
      kind: "single",
      paths: fanoutSingle([A], count),
      inputs: fanoutInputs([A], count),
    }),
  ),
  ...nonSharedScenarios("single", 2, 2, ["balanced", "early80"]),
  ...nonSharedScenarios("single", 2, 8, ["balanced"]),
  {
    shape: "Single K3 shared x2",
    kind: "single",
    paths: fanoutSingle([A, B], 2),
    inputs: fanoutInputs([A, B], 2),
  },
  ...nonSharedScenarios("single", 3, 2, ["balanced", "early80"]),
  ...nonSharedScenarios("single", 4, 2, ["balanced", "early80"]),
  {
    shape: "Single mixed K1-K2 one-multi x4",
    workload: "balanced",
    kind: "single",
    paths: ONE_MULTI_PATHS,
    inputs: ONE_MULTI_INPUTS,
  },
  {
    shape: "Single mixed K1-K3",
    kind: "single",
    paths: MIXED_OR.flat(),
    inputs: [[10], [11, 12], [11, 13, 14], [11, 13, 15], [12], [11, 998], []],
  },
  {
    shape: "Single K2 category overlap",
    kind: "single",
    paths: CATEGORY_PATHS,
    inputs: CATEGORY_INPUTS,
  },
  ...sharedProbeScenarios("or", [A, B], 3, C),
  ...sharedProbeScenarios("single", [A, B], 3, C),
  {
    shape: "OR K3 in-range",
    workload: "fallback80",
    kind: "or",
    paths: [[[A, B, C]], [[A, B]], [[D, E, F]]],
    inputs: earlyBiased([
      [10, 11, 13],
      [10, 11, 12],
      [13, 14, 15],
      [10, 11, 998],
      [998],
    ]),
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
