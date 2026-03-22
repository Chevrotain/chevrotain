import { performance } from "node:perf_hooks";
import { createFixtures } from "./fixtures.js";
import type {
  BenchmarkPhase,
  MeasureOptions,
  MeasuredRow,
  WorkerResult,
} from "./types.js";
import { ALL_PHASES } from "./types.js";

const CONSTRUCTION_REPS = 500;
const COLD_REPS = 250;
const FIRST_PARSE_REPS = 250;
const WARM_BATCH_SIZE = 10;
const WARM_MIN_SAMPLE_MS = 100;
const WARM_MAX_BATCH_SIZE = 65_536;

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function median(values: number[]) {
  const xs = [...values].sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

function runWarmBatch(fn: () => void, batchSize: number) {
  for (let i = 0; i < batchSize; i++) {
    fn();
  }
}

function calibrateWarmBatchSize(
  fn: () => void,
  batchSize = WARM_BATCH_SIZE,
  minSampleMs = WARM_MIN_SAMPLE_MS,
) {
  let calibratedBatchSize = batchSize;

  while (calibratedBatchSize < WARM_MAX_BATCH_SIZE) {
    const start = performance.now();
    runWarmBatch(fn, calibratedBatchSize);
    const elapsed = performance.now() - start;

    if (elapsed >= minSampleMs) {
      break;
    }

    const estimatedBatchSize = Math.ceil(
      (minSampleMs / Math.max(elapsed, 0.1)) * calibratedBatchSize,
    );
    const nextBatchSize = Math.min(
      WARM_MAX_BATCH_SIZE,
      Math.max(calibratedBatchSize * 2, estimatedBatchSize),
    );

    if (nextBatchSize === calibratedBatchSize) {
      break;
    }

    calibratedBatchSize = nextBatchSize;
  }

  return calibratedBatchSize;
}

function measureConstruction(fixture: any, reps = CONSTRUCTION_REPS) {
  fixture.makeParser();
  const start = performance.now();

  for (let i = 0; i < reps; i++) {
    fixture.makeParser();
  }

  return (performance.now() - start) / reps;
}

function measureCold(fixture: any, reps = COLD_REPS) {
  const start = performance.now();

  for (let i = 0; i < reps; i++) {
    const parser = fixture.makeParser();
    const tokens = fixture.tokenize();
    fixture.parseWith(parser, tokens);
  }

  return (performance.now() - start) / reps;
}

function measureFirstParse(fixture: any, reps = FIRST_PARSE_REPS) {
  const tokens = fixture.tokenize();
  const start = performance.now();

  for (let i = 0; i < reps; i++) {
    const parser = fixture.makeParser();
    fixture.parseWith(parser, tokens);
  }

  return (performance.now() - start) / reps;
}

function measureWarmOps(
  fn: () => void,
  warmup: number,
  iterations: number,
  samples: number,
  batchSize = WARM_BATCH_SIZE,
) {
  const calibratedBatchSize = calibrateWarmBatchSize(fn, batchSize);
  const warmupBatches = Math.max(1, Math.ceil(warmup / calibratedBatchSize));

  for (let i = 0; i < warmupBatches; i++) {
    runWarmBatch(fn, calibratedBatchSize);
  }

  const sampleIterations = Math.max(
    1,
    Math.ceil(iterations / samples / calibratedBatchSize),
  );
  const rates: number[] = [];

  for (let sample = 0; sample < samples; sample++) {
    const start = performance.now();

    for (let i = 0; i < sampleIterations; i++) {
      runWarmBatch(fn, calibratedBatchSize);
    }

    const elapsed = performance.now() - start;
    rates.push(((sampleIterations * calibratedBatchSize) / elapsed) * 1000);
  }

  return median(rates);
}

function measurePhase(
  fixture: any,
  phase: BenchmarkPhase,
  warmup: number,
  iterations: number,
  samples: number,
) {
  if (phase === "construction") {
    return round(measureConstruction(fixture));
  }

  if (phase === "cold") {
    return round(measureCold(fixture));
  }

  if (phase === "first-parse") {
    return round(measureFirstParse(fixture), 3);
  }

  if (phase === "warm-lex") {
    return round(
      measureWarmOps(() => fixture.tokenize(), warmup, iterations, samples),
      0,
    );
  }

  if (phase === "warm-parse") {
    const tokens = fixture.tokenize();
    return round(
      measureWarmOps(() => fixture.parse(tokens), warmup, iterations, samples),
      0,
    );
  }

  return round(
    measureWarmOps(() => fixture.run(), warmup, iterations, samples),
    0,
  );
}

function getSelectedPhases(mode: MeasureOptions["mode"]) {
  return mode === "all" ? ALL_PHASES : [mode];
}

export function measureLibrary(
  chevrotain: Record<string, unknown>,
  options: MeasureOptions,
): WorkerResult {
  const fixtures = createFixtures(
    chevrotain,
    options.selectedParser,
    options.useCst,
  );
  const phases = getSelectedPhases(options.mode);
  const rows: MeasuredRow[] = [];

  for (const fixture of fixtures) {
    for (const phase of phases) {
      rows.push({
        fixture: fixture.name,
        phase,
        thisPr: measurePhase(
          fixture,
          phase,
          options.warmup,
          options.iterations,
          options.samples,
        ),
      });
    }
  }

  return {
    mode: options.mode,
    parser: options.useCst ? "CstParser" : "EmbeddedActionsParser",
    iterations: options.iterations,
    warmup: options.warmup,
    samples: options.samples,
    fixtures: fixtures.map((fixture) => fixture.name),
    rows,
  };
}
