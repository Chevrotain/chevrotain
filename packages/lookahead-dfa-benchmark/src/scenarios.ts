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

function nonSharedK2Paths(count: number): TokenType[][] {
  return Array.from({ length: count }, (_, idx) => [
    ending(idx * 2),
    ending(idx * 2 + 1),
  ]);
}

function nonSharedK2Inputs(paths: TokenType[][]): number[][] {
  const ids = paths.map((path) => path.map((token) => token.tokenTypeIdx!));
  const middle = ids[Math.floor(ids.length / 2)];
  return uniqueInputs([
    ids[0],
    middle,
    ids[ids.length - 1],
    [middle[0], 998],
    [998],
    [],
  ]);
}

function earlyBiased(inputs: number[][]): number[][] {
  const [first, ...rest] = inputs;
  return [...Array.from({ length: rest.length * 4 }, () => first), ...rest];
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
      name: `${label} K${depth} shared hit-only x8`,
      kind,
      paths,
      inputs: [
        [...prefixIds, 100],
        [...prefixIds, 104],
        [...prefixIds, 107],
      ],
    },
    {
      name: `${label} K${depth} shared miss-only x8`,
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

export const SCENARIOS: Scenario[] = [
  {
    name: "OR K1 x8",
    kind: "or",
    paths: fanoutOr([], 8),
    inputs: fanoutInputs([], 8),
  },
  ...[2, 3, 4, 5, 8, 22, 31, 32, 33, 36].map(
    (count): Scenario => ({
      name: `OR K2 shared x${count}`,
      kind: "or",
      paths: fanoutOr([A], count),
      inputs: fanoutInputs([A], count),
    }),
  ),
  ...[2, 3, 4, 5, 8, 22, 36].flatMap((count): Scenario[] => {
    const paths = nonSharedK2Paths(count);
    const inputs = nonSharedK2Inputs(paths);
    const alternatives = paths.map((path) => [path]);
    return [
      {
        name: `OR K2 non-shared balanced x${count}`,
        kind: "or",
        paths: alternatives,
        inputs,
      },
      {
        name: `OR K2 non-shared early80 x${count}`,
        kind: "or",
        paths: alternatives,
        inputs: earlyBiased(inputs),
      },
    ];
  }),
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
    name: "OR K2 high contiguous IDs x5",
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
    name: "OR K2 sparse IDs x5",
    kind: "or",
    paths: customFanoutOr([A], [100, 10_000, 20_000, 30_000, 40_000]),
    inputs: customFanoutInputs([A], [100, 10_000, 20_000, 30_000, 40_000]),
  },
  {
    name: "Single K1 x8",
    kind: "single",
    paths: fanoutSingle([], 8),
    inputs: fanoutInputs([], 8),
  },
  ...[2, 3, 4, 5, 8, 22, 31, 32, 33, 36].map(
    (count): Scenario => ({
      name: `Single K2 shared x${count}`,
      kind: "single",
      paths: fanoutSingle([A], count),
      inputs: fanoutInputs([A], count),
    }),
  ),
  ...[2, 3, 4, 5, 8, 22, 36].flatMap((count): Scenario[] => {
    const paths = nonSharedK2Paths(count);
    const inputs = nonSharedK2Inputs(paths);
    return [
      {
        name: `Single K2 non-shared balanced x${count}`,
        kind: "single",
        paths,
        inputs,
      },
      {
        name: `Single K2 non-shared early80 x${count}`,
        kind: "single",
        paths,
        inputs: earlyBiased(inputs),
      },
    ];
  }),
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
  ...sharedProbeScenarios("or", [A], 2, B),
  ...sharedProbeScenarios("or", [A, B], 3, C),
  ...sharedProbeScenarios("single", [A], 2, B),
  ...sharedProbeScenarios("single", [A, B], 3, C),
  {
    name: "OR K3 in-range fallback80",
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
