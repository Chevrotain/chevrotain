import type { IToken, LookaheadSequence, TokenType } from "@chevrotain/types";
import {
  areTokenCategoriesNotUsed,
  buildAlternativesLookAheadFunc,
  buildSingleAlternativeLookaheadFunction,
} from "../src/parse/grammar/lookahead.js";
import {
  buildAlternativesLookAheadFuncDfa,
  buildDfaAlternativesLookAheadFunc,
  buildDfaLookaheadMachine,
  buildDfaSingleAlternativeLookaheadFunction,
  buildSingleAlternativeLookaheadFunctionDfa,
  isDfaLookaheadProfitable,
  isDfaSingleLookaheadProfitable,
} from "../src/parse/grammar/lookahead_dfa.js";
import {
  tokenStructuredMatcher,
  tokenStructuredMatcherNoCategories,
} from "../src/scan/tokens.js";

declare const Benchmark: any;

const BATCH_SIZE = 100;
const EOF_TOKEN = { tokenTypeIdx: 999999 } as IToken;

interface Scenario {
  name: string;
  kind: "or" | "single";
  paths: LookaheadSequence[] | LookaheadSequence;
  inputs: number[][];
}

interface BenchmarkParser {
  tokVector: IToken[];
  currIdx: number;
  LA_FAST(howMuch: number): IToken;
}

const parser: BenchmarkParser = {
  tokVector: [],
  currIdx: -1,
  LA_FAST(howMuch) {
    return this.tokVector[this.currIdx + howMuch];
  },
};

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

function matcherFor(alternatives: LookaheadSequence[]) {
  return areTokenCategoriesNotUsed(alternatives)
    ? tokenStructuredMatcherNoCategories
    : tokenStructuredMatcher;
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

const SCENARIOS: Scenario[] = [
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

function alternativesFor(scenario: Scenario): LookaheadSequence[] {
  return scenario.kind === "or"
    ? (scenario.paths as LookaheadSequence[])
    : [scenario.paths as LookaheadSequence];
}

function maxPathLength(scenario: Scenario): number {
  let max = 0;
  for (const alternative of alternativesFor(scenario)) {
    for (const path of alternative) max = Math.max(max, path.length);
  }
  return max;
}

function makeWorkload(inputs: number[][], maxLookahead: number) {
  const tokVector: IToken[] = [];
  const positions: number[] = [];
  for (const input of inputs) {
    const start = tokVector.length;
    positions.push(start - 1);
    for (const tokenTypeIdx of input) {
      tokVector.push({ tokenTypeIdx } as IToken);
    }
    for (let idx = input.length; idx < maxLookahead + 1; idx++) {
      tokVector.push(EOF_TOKEN);
    }
  }
  return {
    tokVector,
    inputPositions: positions,
    batchPositions: Array.from(
      { length: BATCH_SIZE },
      (_, idx) => positions[idx % positions.length],
    ),
  };
}

function buildOriginal(scenario: Scenario) {
  const alternatives = alternativesFor(scenario);
  const matcher = matcherFor(alternatives);
  return scenario.kind === "or"
    ? buildAlternativesLookAheadFunc(alternatives, false, matcher, false)
    : buildSingleAlternativeLookaheadFunction(alternatives[0], matcher, false);
}

function buildSelected(scenario: Scenario) {
  const alternatives = alternativesFor(scenario);
  const matcher = matcherFor(alternatives);
  return scenario.kind === "or"
    ? buildAlternativesLookAheadFuncDfa(alternatives, false, matcher, false)
    : buildSingleAlternativeLookaheadFunctionDfa(
        alternatives[0],
        matcher,
        false,
      );
}

function buildForcedDfa(scenario: Scenario) {
  const alternatives = alternativesFor(scenario);
  return scenario.kind === "or"
    ? buildDfaAlternativesLookAheadFunc(alternatives)
    : buildDfaSingleAlternativeLookaheadFunction(alternatives[0]);
}

const VARIANTS = [
  { name: "original", build: buildOriginal },
  { name: "selected", build: buildSelected },
  { name: "forced DFA", build: buildForcedDfa },
];

function resultNumber(value: number | boolean | undefined): number {
  if (value === undefined) return -1;
  if (value === true) return 1;
  if (value === false) return 0;
  return value;
}

function measureBuild(
  builder: (scenario: Scenario) => Function,
  scenario: Scenario,
) {
  const samples: number[] = [];
  for (let sample = 0; sample < 5; sample++) {
    const start = performance.now();
    for (let iteration = 0; iteration < 500; iteration++) {
      (window as any).__lookaheadBuildSink = builder(scenario);
    }
    samples.push(((performance.now() - start) * 1000) / 500);
  }
  samples.sort((left, right) => left - right);
  return samples[2];
}

function assertEquivalent(scenario: Scenario) {
  const functions = VARIANTS.map(({ build }) => build(scenario));
  const workload = makeWorkload(
    scenario.inputs,
    Math.max(1, maxPathLength(scenario)),
  );
  parser.tokVector = workload.tokVector;
  for (let idx = 0; idx < scenario.inputs.length; idx++) {
    parser.currIdx = workload.inputPositions[idx];
    const expected = functions[0].call(parser);
    for (let variant = 1; variant < functions.length; variant++) {
      const actual = functions[variant].call(parser);
      if (actual !== expected) {
        throw new Error(
          `${scenario.name}: ${VARIANTS[variant].name} returned ${actual}, expected ${expected} for [${scenario.inputs[idx]}]`,
        );
      }
    }
  }
}

function addResultRow(
  scenario: Scenario,
  result: any,
  originalHz: number,
  fastestHz: number,
) {
  const row = document.createElement("tr");
  if (result.hz === fastestHz) row.className = "fastest";
  const values = [
    scenario.name,
    result.name,
    ((result.hz * BATCH_SIZE) / 1e6).toFixed(2),
    `${((result.hz / originalHz) * 100).toFixed(1)}%`,
    `+/-${result.rme.toFixed(2)}%`,
    result.buildMicros.toFixed(2),
    result.selected ? "yes" : "no",
    result.machine?.states.length || "-",
    result.machine?.transitions || "-",
    result.machine?.maxCandidates || "-",
  ];
  for (const value of values) {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    row.appendChild(cell);
  }
  document.getElementById("results")!.appendChild(row);
}

function runScenario(index: number) {
  if (index === SCENARIOS.length) {
    document.getElementById("status")!.textContent = "Complete";
    document.body.dataset.benchmark = "complete";
    (window as any).__lookaheadBenchmarkDone = true;
    return;
  }

  const scenario = SCENARIOS[index];
  assertEquivalent(scenario);
  document.getElementById("status")!.textContent = `Running ${scenario.name}`;
  const suite = new Benchmark.Suite();
  const prepared = new Map<string, any>();
  const workload = makeWorkload(
    scenario.inputs,
    Math.max(1, maxPathLength(scenario)),
  );
  const selected =
    scenario.kind === "or"
      ? isDfaLookaheadProfitable(alternativesFor(scenario))
      : isDfaSingleLookaheadProfitable(alternativesFor(scenario)[0]);
  const machine = buildDfaLookaheadMachine(alternativesFor(scenario));
  const orderedVariants = [
    ...VARIANTS.slice(index % VARIANTS.length),
    ...VARIANTS.slice(0, index % VARIANTS.length),
  ];

  for (const variant of orderedVariants) {
    const fn = variant.build(scenario);
    prepared.set(variant.name, {
      name: variant.name,
      selected: variant.name === "selected" && selected,
      machine: variant.name === "forced DFA" ? machine : undefined,
      buildMicros: measureBuild(variant.build, scenario),
    });
    suite.add(variant.name, {
      minSamples: 20,
      maxTime: 1,
      fn() {
        parser.tokVector = workload.tokVector;
        let checksum = 0;
        for (let iteration = 0; iteration < BATCH_SIZE; iteration++) {
          parser.currIdx = workload.batchPositions[iteration];
          checksum += resultNumber(fn.call(parser));
        }
        (window as any).__lookaheadChecksum =
          ((window as any).__lookaheadChecksum ?? 0) ^ checksum;
      },
    });
  }

  suite.on("complete", function (this: any) {
    const benchmarkResults = new Map<string, any>();
    for (const bench of Array.from(this) as any[]) {
      benchmarkResults.set(bench.name, {
        ...prepared.get(bench.name),
        hz: bench.hz,
        rme: bench.stats.rme,
      });
    }
    const results = VARIANTS.map((variant) =>
      benchmarkResults.get(variant.name),
    );
    const originalHz = results[0].hz;
    const fastestHz = Math.max(...results.map((result) => result.hz));
    for (const result of results) {
      addResultRow(scenario, result, originalHz, fastestHz);
    }
    setTimeout(() => runScenario(index + 1), 0);
  });
  suite.run({ async: true });
}

function run() {
  const button = document.getElementById("run") as HTMLButtonElement;
  button.disabled = true;
  document.getElementById("results")!.textContent = "";
  document.getElementById("status")!.textContent = "Checking correctness";
  try {
    for (const scenario of SCENARIOS) assertEquivalent(scenario);
    runScenario(0);
  } catch (error) {
    document.getElementById("status")!.textContent = (error as Error).stack!;
    document.body.dataset.benchmark = "failed";
    (window as any).__lookaheadBenchmarkDone = true;
    throw error;
  }
}

document.getElementById("browser")!.textContent = navigator.userAgent;
document.getElementById("run")!.addEventListener("click", run);
if (new URLSearchParams(location.search).has("autorun")) run();
