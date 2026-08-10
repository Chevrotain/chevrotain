import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import type { IToken } from "@chevrotain/types";
import { maxPathLength, type Scenario } from "./scenarios.ts";
import {
  productionDecision,
  VARIANTS,
  type BuiltVariant,
  type Variant,
} from "./variants.ts";

export interface BenchmarkOptions {
  batchSize: number;
  sampleCount: number;
  sampleDurationMs: number;
  warmupDurationMs: number;
  buildSamples: number;
  buildsPerSample: number;
  maxSelectionRegressionPercent: number;
}

export interface VariantResult {
  name: string;
  callsPerSecond: number;
  buildMicros: number;
  productionSelected: boolean;
  states?: number;
  transitions?: number;
  maxCandidates?: number;
  layout: string;
  cells?: number;
}

export interface SelectionError {
  scenario: string;
  productionSelected: string;
  fasterVariant: string;
  selectedCallsPerSecond: number;
  fasterCallsPerSecond: number;
  regressionPercent: number;
}

export interface ScenarioResult {
  scenario: string;
  variants: VariantResult[];
  selectionError?: SelectionError;
}

export interface BenchmarkRun {
  scenarioResults: ScenarioResult[];
  selectionErrors: SelectionError[];
  scenarioCount: number;
  variantCount: number;
  checksum: number;
}

interface BenchmarkParser {
  tokVector: IToken[];
  currIdx: number;
  LA_FAST(howMuch: number): IToken;
}

interface Workload {
  tokVector: IToken[];
  inputPositions: number[];
  batchPositions: number[];
}

interface Measurement {
  name: string;
  callsPerSecond: number;
  buildMicros: number;
  layout: string;
  cells?: number;
}

const EOF_TOKEN = { tokenTypeIdx: 1 } as IToken;
const parser: BenchmarkParser = {
  tokVector: [],
  currIdx: -1,
  LA_FAST(howMuch) {
    return this.tokVector[this.currIdx + howMuch];
  },
};

let buildSink: BuiltVariant | undefined;
let benchmarkChecksum = 0;

function makeWorkload(
  inputs: number[][],
  maxLookahead: number,
  batchSize: number,
): Workload {
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
      { length: batchSize },
      (_, idx) => positions[idx % positions.length],
    ),
  };
}

function resultNumber(value: number | boolean | undefined): number {
  if (value === undefined) return -1;
  if (value === true) return 1;
  if (value === false) return 0;
  return value;
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function batchChecksum(fn: Function, workload: Workload): number {
  parser.tokVector = workload.tokVector;
  let checksum = 0;
  for (const position of workload.batchPositions) {
    parser.currIdx = position;
    checksum += resultNumber(fn.call(parser));
  }
  benchmarkChecksum ^= checksum;
  return checksum;
}

function runBatches(fn: Function, workload: Workload, count: number): number {
  const start = performance.now();
  for (let iteration = 0; iteration < count; iteration++) {
    batchChecksum(fn, workload);
  }
  return performance.now() - start;
}

function measureRuntime(
  fn: Function,
  workload: Workload,
  options: BenchmarkOptions,
): number {
  if (options.warmupDurationMs > 0) {
    const deadline = performance.now() + options.warmupDurationMs;
    while (performance.now() < deadline) batchChecksum(fn, workload);
  }

  let batches = 1;
  let elapsed = runBatches(fn, workload, batches);
  while (elapsed < options.sampleDurationMs) {
    batches = Math.max(
      batches + 1,
      Math.ceil(
        (batches * options.sampleDurationMs) / Math.max(elapsed, 0.001),
      ),
    );
    elapsed = runBatches(fn, workload, batches);
  }

  const samples: number[] = [];
  for (let sample = 0; sample < options.sampleCount; sample++) {
    elapsed = runBatches(fn, workload, batches);
    samples.push((batches * workload.batchPositions.length * 1000) / elapsed);
  }
  const callsPerSecond = median(samples);
  assert.ok(Number.isFinite(callsPerSecond) && callsPerSecond > 0);
  return callsPerSecond;
}

function measureBuild(
  variant: Variant,
  scenario: Scenario,
  options: BenchmarkOptions,
): number {
  const samples: number[] = [];
  for (let sample = 0; sample < options.buildSamples; sample++) {
    const start = performance.now();
    for (let iteration = 0; iteration < options.buildsPerSample; iteration++) {
      buildSink = variant.build(scenario);
    }
    samples.push(
      ((performance.now() - start) * 1000) / options.buildsPerSample,
    );
  }
  const buildMicros = median(samples);
  assert.ok(Number.isFinite(buildMicros) && buildMicros > 0);
  return buildMicros;
}

function assertEquivalent(scenario: Scenario, batchSize: number): void {
  const variants = VARIANTS;
  const functions = variants.map(({ build }) => build(scenario).fn);
  const workload = makeWorkload(
    scenario.inputs,
    Math.max(1, maxPathLength(scenario)),
    batchSize,
  );
  parser.tokVector = workload.tokVector;
  for (let idx = 0; idx < scenario.inputs.length; idx++) {
    parser.currIdx = workload.inputPositions[idx];
    const expected = functions[0].call(parser);
    for (let variant = 1; variant < functions.length; variant++) {
      const actual = functions[variant].call(parser);
      assert.strictEqual(
        actual,
        expected,
        `${scenario.name}: ${variants[variant].name} for [${scenario.inputs[idx]}]`,
      );
    }
  }

  const expectedChecksum = batchChecksum(functions[0], workload);
  for (let variant = 1; variant < functions.length; variant++) {
    assert.strictEqual(
      batchChecksum(functions[variant], workload),
      expectedChecksum,
      `${scenario.name}: ${variants[variant].name} checksum`,
    );
  }
}

function runScenario(
  scenario: Scenario,
  index: number,
  options: BenchmarkOptions,
): ScenarioResult {
  assertEquivalent(scenario, options.batchSize);
  const workload = makeWorkload(
    scenario.inputs,
    Math.max(1, maxPathLength(scenario)),
    options.batchSize,
  );
  const decision = productionDecision(scenario);
  const variants = VARIANTS;
  const orderedVariants = [
    ...variants.slice(index % variants.length),
    ...variants.slice(0, index % variants.length),
  ];
  const measured = new Map<string, Measurement>();

  for (const variant of orderedVariants) {
    const built = variant.build(scenario);
    measured.set(variant.name, {
      name: variant.name,
      callsPerSecond: measureRuntime(built.fn, workload, options),
      buildMicros: measureBuild(variant, scenario, options),
      layout: built.layout,
      cells: built.cells,
    });
  }

  const original = measured.get("Original")!;
  const dfa = measured.get("DFA Dense")!;
  const selected = decision.usesDfa ? dfa : original;
  const other = decision.usesDfa ? original : dfa;
  const regressionPercent =
    (1 - selected.callsPerSecond / other.callsPerSecond) * 100;

  return {
    scenario: scenario.name,
    variants: variants.map(({ name }) => {
      const result = measured.get(name)!;
      return {
        ...result,
        productionSelected:
          name === "DFA Dense"
            ? decision.usesDfa
            : name === "Original"
              ? !decision.usesDfa
              : false,
        states: name.startsWith("DFA") ? decision.states : undefined,
        transitions: name.startsWith("DFA") ? decision.transitions : undefined,
        maxCandidates: name.startsWith("DFA")
          ? decision.maxCandidates
          : undefined,
      };
    }),
    selectionError:
      regressionPercent > options.maxSelectionRegressionPercent
        ? {
            scenario: scenario.name,
            productionSelected: selected.name,
            fasterVariant: other.name,
            selectedCallsPerSecond: selected.callsPerSecond,
            fasterCallsPerSecond: other.callsPerSecond,
            regressionPercent,
          }
        : undefined,
  };
}

export function runBenchmark(
  scenarios: readonly Scenario[],
  options: BenchmarkOptions,
  onProgress?: (current: number, total: number, name: string) => void,
): BenchmarkRun {
  buildSink = undefined;
  benchmarkChecksum = 0;
  const scenarioResults = scenarios.map((scenario, index) => {
    onProgress?.(index + 1, scenarios.length, scenario.name);
    return runScenario(scenario, index, options);
  });
  assert.ok(buildSink !== undefined);

  return {
    scenarioResults,
    selectionErrors: scenarioResults.flatMap((result) =>
      result.selectionError === undefined ? [] : [result.selectionError],
    ),
    scenarioCount: scenarioResults.length,
    variantCount: scenarioResults.reduce(
      (count, result) => count + result.variants.length,
      0,
    ),
    checksum: benchmarkChecksum,
  };
}
