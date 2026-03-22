/**
 * Node.js CLI benchmark for comparing Chevrotain builds.
 *
 * Usage:
 *   node benchmark.mjs
 *   node benchmark.mjs --baseline-lib /path/to/v12.0.0/chevrotain.mjs --lib /path/to/this-pr/chevrotain.mjs --mode all
 *   node benchmark.mjs --baseline-lib /path/to/v12.0.0/chevrotain.mjs --baseline-label v12.0.0 --this-pr-label "Current"
 *   node benchmark.mjs --current-label "Current"
 *   node benchmark.mjs --parser json|css|all
 *   node benchmark.mjs --cst
 *   node benchmark.mjs --mode construction|cold|first-parse|warm-lex|warm-parse|warm|all
 *   node benchmark.mjs --iterations 5000
 *   node benchmark.mjs --compare-runs 7
 *   node benchmark.mjs --compare-warmup-rounds 1
 *   node benchmark.mjs --json
 */

import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_BASELINE_LABEL = "v12.0.0";
const DEFAULT_CURRENT_LABEL = "Current";
const DEFAULT_COMPARE_LABEL = "Current";
const CONSTRUCTION_REPS = 500;
const COLD_REPS = 250;
const FIRST_PARSE_REPS = 250;
const WARM_BATCH_SIZE = 10;
const WARM_MIN_SAMPLE_MS = 100;
const WARM_MAX_BATCH_SIZE = 65_536;
const MS_PARITY_THRESHOLD = 0.2;
const ALL_PHASES = [
  "construction",
  "cold",
  "first-parse",
  "warm-lex",
  "warm-parse",
  "warm",
];

const args = process.argv.slice(2);

function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : defaultValue;
}

function hasFlag(flag) {
  return args.includes(flag);
}

function median(values) {
  const xs = [...values].sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

function resolveLibUrl(libPath, defaultHref) {
  const resolvedPath = libPath ?? defaultHref;

  return resolvedPath.startsWith("http") || resolvedPath.startsWith("file:")
    ? resolvedPath
    : pathToFileURL(path.resolve(process.cwd(), resolvedPath)).href;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatMs(value, digits) {
  return `${value.toFixed(digits)} ms`;
}

function formatOps(value) {
  return `${Math.round(value).toLocaleString()} ops/sec`;
}

function formatPhaseValue(phase, value) {
  if (phase === "construction" || phase === "cold") {
    return formatMs(value, 2);
  }

  if (phase === "first-parse") {
    return formatMs(value, 3);
  }

  return formatOps(value);
}

function formatDelta(deltaPct) {
  if (!Number.isFinite(deltaPct)) {
    return "n/a";
  }

  const sign = deltaPct > 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(1)}%`;
}

function isMillisecondPhase(phase) {
  return (
    phase === "construction" || phase === "cold" || phase === "first-parse"
  );
}

function getParityNote(phase, absoluteDeltaMs) {
  if (!isMillisecondPhase(phase)) {
    return "";
  }

  if (absoluteDeltaMs <= MS_PARITY_THRESHOLD) {
    return `parity (<= ${MS_PARITY_THRESHOLD.toFixed(1)} ms)`;
  }

  return "";
}

function createJsonFixture(chevrotain, parserBase, parserConfig) {
  const { createToken, Lexer } = chevrotain;

  const True = createToken({ name: "True", pattern: "true" });
  const False = createToken({ name: "False", pattern: "false" });
  const Null = createToken({ name: "Null", pattern: "null" });
  const LCurly = createToken({ name: "LCurly", pattern: "{" });
  const RCurly = createToken({ name: "RCurly", pattern: "}" });
  const LSquare = createToken({ name: "LSquare", pattern: "[" });
  const RSquare = createToken({ name: "RSquare", pattern: "]" });
  const Comma = createToken({ name: "Comma", pattern: "," });
  const Colon = createToken({ name: "Colon", pattern: ":" });
  const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
  });
  const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
  });
  const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \n\r\t]+/,
    group: Lexer.SKIPPED,
  });

  const jsonTokens = [
    WhiteSpace,
    StringLiteral,
    NumberLiteral,
    Comma,
    Colon,
    LCurly,
    RCurly,
    LSquare,
    RSquare,
    True,
    False,
    Null,
  ];

  const lexer = new Lexer(jsonTokens, { positionTracking: "onlyOffset" });

  class JsonParser extends parserBase {
    constructor() {
      super(jsonTokens, parserConfig);

      const $ = this;

      $.RULE("json", () => {
        $.OR([
          { ALT: () => $.SUBRULE($.object) },
          { ALT: () => $.SUBRULE($.array) },
        ]);
      });

      $.RULE("object", () => {
        $.CONSUME(LCurly);
        $.OPTION(() => {
          $.SUBRULE($.objectItem);
          $.MANY(() => {
            $.CONSUME(Comma);
            $.SUBRULE2($.objectItem);
          });
        });
        $.CONSUME(RCurly);
      });

      $.RULE("objectItem", () => {
        $.CONSUME(StringLiteral);
        $.CONSUME(Colon);
        $.SUBRULE($.value);
      });

      $.RULE("array", () => {
        $.CONSUME(LSquare);
        $.OPTION(() => {
          $.SUBRULE($.value);
          $.MANY(() => {
            $.CONSUME(Comma);
            $.SUBRULE2($.value);
          });
        });
        $.CONSUME(RSquare);
      });

      $.RULE("value", () => {
        $.OR([
          { ALT: () => $.CONSUME(StringLiteral) },
          { ALT: () => $.CONSUME(NumberLiteral) },
          { ALT: () => $.SUBRULE($.object) },
          { ALT: () => $.SUBRULE($.array) },
          { ALT: () => $.CONSUME(True) },
          { ALT: () => $.CONSUME(False) },
          { ALT: () => $.CONSUME(Null) },
        ]);
      });

      this.performSelfAnalysis();
    }
  }

  const parser = new JsonParser();
  const sample = JSON.stringify(
    Array.from({ length: 50 }, (_, i) => ({
      _id: `id${i}`,
      index: i,
      guid: `xxxxxxxx-${i}`,
      isActive: i % 2 === 0,
      balance: `$${(1000 + i * 13.37).toFixed(2)}`,
      name: `Person ${i}`,
      tags: [`tag${i % 5}`, `tag${(i + 1) % 5}`, `tag${(i + 2) % 5}`],
      address: `${i * 100} Main St`,
      about: `This is a somewhat longer description field for person ${i}.`,
    })),
  );

  return {
    name: "JSON",
    makeParser() {
      return new JsonParser();
    },
    parseWith(activeParser, tokens) {
      activeParser.input = tokens;
      activeParser.json();
    },
    tokenize() {
      return lexer.tokenize(sample).tokens;
    },
    parse(tokens) {
      this.parseWith(parser, tokens);
    },
    run() {
      this.parse(this.tokenize());
    },
  };
}

function createCssFixture(chevrotain, parserBase, parserConfig) {
  const { createToken, Lexer } = chevrotain;

  const Identifier = createToken({
    name: "Identifier",
    pattern: /[a-zA-Z]\w*/,
  });
  const Dot = createToken({ name: "Dot", pattern: "." });
  const Hash = createToken({ name: "Hash", pattern: "#" });
  const Colon = createToken({ name: "Colon", pattern: ":" });
  const Semicolon = createToken({ name: "Semicolon", pattern: ";" });
  const LCurly = createToken({ name: "LCurly", pattern: "{" });
  const RCurly = createToken({ name: "RCurly", pattern: "}" });
  const LParen = createToken({ name: "LParen", pattern: "(" });
  const RParen = createToken({ name: "RParen", pattern: ")" });
  const Comma = createToken({ name: "Comma", pattern: "," });
  const Star = createToken({ name: "Star", pattern: "*" });
  const At = createToken({ name: "At", pattern: "@" });
  const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"[^"]*"|'[^']*'/,
  });
  const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /\d+(\.\d+)?(px|em|rem|%|vh|vw|pt)?/,
  });
  const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /[ \t\n\r]+/,
    group: Lexer.SKIPPED,
  });
  const Comment = createToken({
    name: "Comment",
    pattern: /\/\*[^*]*\*+([^/*][^*]*\*+)*\//,
    group: Lexer.SKIPPED,
  });
  const Other = createToken({ name: "Other", pattern: /[^\s{}();:,.#*@"']+/ });

  const cssTokens = [
    WhiteSpace,
    Comment,
    StringLiteral,
    NumberLiteral,
    Identifier,
    LCurly,
    RCurly,
    LParen,
    RParen,
    Semicolon,
    Colon,
    Comma,
    Dot,
    Hash,
    Star,
    At,
    Other,
  ];

  const lexer = new Lexer(cssTokens, { positionTracking: "onlyOffset" });

  class CssParser extends parserBase {
    constructor() {
      super(cssTokens, parserConfig);

      const $ = this;

      $.RULE("stylesheet", () => {
        $.MANY(() => $.SUBRULE($.rule));
      });

      $.RULE("rule", () => {
        $.SUBRULE($.selector);
        $.CONSUME(LCurly);
        $.MANY(() => $.SUBRULE($.declaration));
        $.CONSUME(RCurly);
      });

      $.RULE("selector", () => {
        $.SUBRULE($.selectorPart);
        $.MANY(() => {
          $.OPTION(() => $.CONSUME(Comma));
          $.SUBRULE2($.selectorPart);
        });
      });

      $.RULE("selectorPart", () => {
        $.AT_LEAST_ONE(() => {
          $.OR([
            { ALT: () => $.CONSUME(Identifier) },
            { ALT: () => $.CONSUME(Dot) },
            { ALT: () => $.CONSUME(Hash) },
            { ALT: () => $.CONSUME(Star) },
            {
              ALT: () => {
                $.CONSUME(Colon);
                $.CONSUME2(Identifier);
              },
            },
          ]);
        });
      });

      $.RULE("declaration", () => {
        $.CONSUME(Identifier);
        $.CONSUME(Colon);
        $.SUBRULE($.value);
        $.OPTION(() => $.CONSUME(Semicolon));
      });

      $.RULE("value", () => {
        $.AT_LEAST_ONE(() => {
          $.OR([
            { ALT: () => $.CONSUME(Identifier) },
            { ALT: () => $.CONSUME(NumberLiteral) },
            { ALT: () => $.CONSUME(StringLiteral) },
            {
              ALT: () => {
                $.CONSUME(LParen);
                $.SUBRULE($.value);
                $.CONSUME(RParen);
              },
            },
            { ALT: () => $.CONSUME(Other) },
          ]);
        });
      });

      this.performSelfAnalysis();
    }
  }

  const parser = new CssParser();
  const sample = Array.from(
    { length: 100 },
    (_, i) => `
.class${i} {
  color: red;
  font-size: 14px;
  margin: 0;
  padding: 8px 16px;
  background-color: white;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
}
.class${i}:hover {
  color: blue;
  background-color: #f5f5f5;
}
`,
  ).join("\n");

  return {
    name: "CSS",
    makeParser() {
      return new CssParser();
    },
    parseWith(activeParser, tokens) {
      activeParser.input = tokens;
      activeParser.stylesheet();
    },
    tokenize() {
      return lexer.tokenize(sample).tokens;
    },
    parse(tokens) {
      this.parseWith(parser, tokens);
    },
    run() {
      this.parse(this.tokenize());
    },
  };
}

function createFixtures(chevrotain, selectedParser, useCst) {
  const { EmbeddedActionsParser, CstParser } = chevrotain;
  const parserBase = useCst ? CstParser : EmbeddedActionsParser;
  const parserConfig = useCst ? {} : { outputCst: false };
  const fixtures = [];

  if (selectedParser === "all" || selectedParser === "json") {
    fixtures.push(createJsonFixture(chevrotain, parserBase, parserConfig));
  }

  if (selectedParser === "all" || selectedParser === "css") {
    fixtures.push(createCssFixture(chevrotain, parserBase, parserConfig));
  }

  if (fixtures.length === 0) {
    throw new Error(`Unknown parser selection: ${selectedParser}`);
  }

  return fixtures;
}

function measureConstruction(fixture, reps = CONSTRUCTION_REPS) {
  fixture.makeParser();
  const start = performance.now();

  for (let i = 0; i < reps; i++) {
    fixture.makeParser();
  }

  return (performance.now() - start) / reps;
}

function measureCold(fixture, reps = COLD_REPS) {
  const start = performance.now();

  for (let i = 0; i < reps; i++) {
    const parser = fixture.makeParser();
    const tokens = fixture.tokenize();
    fixture.parseWith(parser, tokens);
  }

  return (performance.now() - start) / reps;
}

function measureFirstParse(fixture, reps = FIRST_PARSE_REPS) {
  const tokens = fixture.tokenize();
  const start = performance.now();

  for (let i = 0; i < reps; i++) {
    const parser = fixture.makeParser();
    fixture.parseWith(parser, tokens);
  }

  return (performance.now() - start) / reps;
}

function runWarmBatch(fn, batchSize) {
  for (let i = 0; i < batchSize; i++) {
    fn();
  }
}

function calibrateWarmBatchSize(
  fn,
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

function measureWarmOps(
  fn,
  warmup,
  iterations,
  samples,
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
  const rates = [];

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

function measurePhase(fixture, phase, warmup, iterations, samples) {
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

  if (phase === "warm") {
    return round(
      measureWarmOps(() => fixture.run(), warmup, iterations, samples),
      0,
    );
  }

  throw new Error(`Unknown mode: ${phase}`);
}

function getSelectedPhases(mode) {
  return mode === "all" ? ALL_PHASES : [mode];
}

function buildRows(resultsByFixture, phases) {
  const rows = [];

  for (const [fixture, fixtureResults] of Object.entries(resultsByFixture)) {
    for (const phase of phases) {
      rows.push({
        fixture,
        phase,
        value: fixtureResults[phase],
      });
    }
  }

  return rows;
}

function measureLibrary(chevrotain, options) {
  const fixtures = createFixtures(
    chevrotain,
    options.selectedParser,
    options.useCst,
  );
  const phases = getSelectedPhases(options.mode);
  const resultsByFixture = {};

  for (const fixture of fixtures) {
    resultsByFixture[fixture.name] = {};

    for (const phase of phases) {
      resultsByFixture[fixture.name][phase] = measurePhase(
        fixture,
        phase,
        options.warmup,
        options.iterations,
        options.samples,
      );
    }
  }

  return {
    fixtures: fixtures.map((fixture) => fixture.name),
    phases,
    resultsByFixture,
  };
}

function comparePairedRows(roundPairs) {
  const pairedMetrics = new Map();
  const rowOrder = [];

  for (const pair of roundPairs) {
    pair.baseline.rows.forEach((baselineRow, index) => {
      const thisPrRow = pair.thisPr.rows[index];
      const key = `${baselineRow.fixture}::${baselineRow.phase}`;
      let entry = pairedMetrics.get(key);

      if (entry === undefined) {
        entry = {
          fixture: baselineRow.fixture,
          phase: baselineRow.phase,
          baselineValues: [],
          thisPrValues: [],
          deltaPctValues: [],
          absoluteDeltaValues: [],
        };
        pairedMetrics.set(key, entry);
        rowOrder.push(key);
      }

      entry.baselineValues.push(baselineRow.thisPr);
      entry.thisPrValues.push(thisPrRow.thisPr);

      if (baselineRow.thisPr === 0) {
        entry.deltaPctValues.push(Number.NaN);
      } else {
        entry.deltaPctValues.push(
          ((thisPrRow.thisPr - baselineRow.thisPr) / baselineRow.thisPr) * 100,
        );
      }

      entry.absoluteDeltaValues.push(
        Math.abs(thisPrRow.thisPr - baselineRow.thisPr),
      );
    });
  }

  return rowOrder.map((key) => {
    const entry = pairedMetrics.get(key);
    const finiteDeltaPctValues = entry.deltaPctValues.filter((value) =>
      Number.isFinite(value),
    );
    const baseline = round(median(entry.baselineValues), 3);
    const thisPr = round(median(entry.thisPrValues), 3);
    const deltaPct =
      finiteDeltaPctValues.length === 0
        ? Number.NaN
        : median(finiteDeltaPctValues);
    const absoluteDelta = median(entry.absoluteDeltaValues);

    return {
      fixture: entry.fixture,
      phase: entry.phase,
      baseline,
      thisPr,
      deltaPct,
      note: getParityNote(entry.phase, absoluteDelta),
    };
  });
}

function runMeasurementInSubprocess(libUrl, options) {
  const childArgs = [
    fileURLToPath(import.meta.url),
    "--lib",
    libUrl,
    "--mode",
    options.mode,
    "--parser",
    options.selectedParser,
    "--iterations",
    String(options.iterations),
    "--samples",
    String(options.samples),
    "--json",
  ];

  if (options.useCst) {
    childArgs.push("--cst");
  }

  const result = spawnSync(process.execPath, childArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      `Benchmark subprocess failed for ${libUrl}\n${result.stderr || result.stdout}`,
    );
  }

  return JSON.parse(result.stdout);
}

function measureComparisonInSubprocesses(
  baselineLibUrl,
  thisPrLibUrl,
  options,
) {
  const roundPairs = [];
  const totalRounds = options.compareWarmupRounds + options.compareRuns;

  for (let i = 0; i < totalRounds; i++) {
    let baselineMeasurement;
    let thisPrMeasurement;

    // Alternate first-run order each round to avoid consistently favoring
    // either side with hotter caches or process state.
    if (i % 2 === 0) {
      baselineMeasurement = runMeasurementInSubprocess(baselineLibUrl, options);
      thisPrMeasurement = runMeasurementInSubprocess(thisPrLibUrl, options);
    } else {
      thisPrMeasurement = runMeasurementInSubprocess(thisPrLibUrl, options);
      baselineMeasurement = runMeasurementInSubprocess(baselineLibUrl, options);
    }

    if (i >= options.compareWarmupRounds) {
      roundPairs.push({
        baseline: baselineMeasurement,
        thisPr: thisPrMeasurement,
      });
    }
  }

  return {
    comparisonRows: comparePairedRows(roundPairs),
  };
}

function printTable(headers, rawRows) {
  const widths = headers.map((header, index) => {
    return Math.max(header.length, ...rawRows.map((row) => row[index].length));
  });

  const renderRow = (row) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  console.log(renderRow(headers));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rawRows) {
    console.log(renderRow(row));
  }
}

const localLibHref = new URL("../lib/chevrotain.mjs", import.meta.url).href;
const singleBuildLabel = getArg("--current-label", DEFAULT_CURRENT_LABEL);
const compareLabel = getArg("--this-pr-label", DEFAULT_COMPARE_LABEL);
const baselineLabel = getArg("--baseline-label", DEFAULT_BASELINE_LABEL);
const thisPrLibUrl = resolveLibUrl(getArg("--lib", localLibHref), localLibHref);
const baselineLibArg = getArg("--baseline-lib");
const baselineLibUrl = baselineLibArg
  ? resolveLibUrl(baselineLibArg, localLibHref)
  : undefined;
const mode = getArg("--mode", "warm");
const selectedParser = getArg("--parser", "all");
const useCst = hasFlag("--cst");
const iterations = parseInt(getArg("--iterations", "5000"), 10);
const warmup = Math.max(100, Math.floor(iterations * 0.1));
const samples = Math.max(3, parseInt(getArg("--samples", "7"), 10));
const compareRuns = Math.max(3, parseInt(getArg("--compare-runs", "7"), 10));
const compareWarmupRounds = Math.max(
  0,
  parseInt(getArg("--compare-warmup-rounds", "1"), 10),
);
const jsonOutput = hasFlag("--json");

let thisPrMeasurement;
let thisPrRows;
let comparisonRows;

if (baselineLibUrl !== undefined) {
  const comparisonMeasurements = measureComparisonInSubprocesses(
    baselineLibUrl,
    thisPrLibUrl,
    {
      mode,
      selectedParser,
      useCst,
      iterations,
      samples,
      compareRuns,
      compareWarmupRounds,
    },
  );

  const thisPrChevrotain = await import(thisPrLibUrl);
  thisPrMeasurement = measureLibrary(thisPrChevrotain, {
    mode,
    selectedParser,
    useCst,
    iterations,
    warmup,
    samples,
  });

  comparisonRows = comparisonMeasurements.comparisonRows;
} else {
  const thisPrChevrotain = await import(thisPrLibUrl);
  thisPrMeasurement = measureLibrary(thisPrChevrotain, {
    mode,
    selectedParser,
    useCst,
    iterations,
    warmup,
    samples,
  });

  thisPrRows = buildRows(
    thisPrMeasurement.resultsByFixture,
    thisPrMeasurement.phases,
  );
}

if (jsonOutput) {
  console.log(
    JSON.stringify({
      mode,
      parser: useCst ? "CstParser" : "EmbeddedActionsParser",
      iterations,
      warmup,
      samples,
      compareRuns: baselineLibUrl ? compareRuns : null,
      compareWarmupRounds: baselineLibUrl ? compareWarmupRounds : null,
      baseline: baselineLibUrl
        ? { label: baselineLabel, lib: baselineLibUrl }
        : null,
      thisPr: {
        label: baselineLibUrl ? compareLabel : singleBuildLabel,
        lib: thisPrLibUrl,
      },
      rows: baselineLibUrl
        ? comparisonRows.map((row) => ({
            fixture: row.fixture,
            phase: row.phase,
            baseline: row.baseline,
            thisPr: row.thisPr,
            deltaPct: round(row.deltaPct, 1),
            note: row.note || null,
          }))
        : thisPrRows.map((row) => ({
            fixture: row.fixture,
            phase: row.phase,
            thisPr: row.value,
          })),
    }),
  );
  process.exit(0);
}

console.log("\nChevrotain benchmark");
console.log(`  parser:     ${useCst ? "CstParser" : "EmbeddedActionsParser"}`);
console.log(`  mode:       ${mode}`);
console.log(
  `  iterations: ${iterations.toLocaleString()} (+ ${warmup.toLocaleString()} warmup)`,
);
console.log(`  fixtures:   ${thisPrMeasurement.fixtures.join(", ")}`);

if (baselineLibUrl !== undefined) {
  console.log(
    `  compare-runs: ${compareRuns} (+ ${compareWarmupRounds} warmup round${compareWarmupRounds === 1 ? "" : "s"})`,
  );
  console.log(`  ${baselineLabel}: ${baselineLibUrl}`);
  console.log(`  ${compareLabel}: ${thisPrLibUrl}\n`);
} else {
  console.log(`  ${singleBuildLabel}: ${thisPrLibUrl}\n`);
}

if (baselineLibUrl !== undefined) {
  printTable(
    ["Fixture", "Phase", baselineLabel, compareLabel, "Delta", "Note"],
    comparisonRows.map((row) => [
      row.fixture,
      row.phase,
      formatPhaseValue(row.phase, row.baseline),
      formatPhaseValue(row.phase, row.thisPr),
      formatDelta(row.deltaPct),
      row.note,
    ]),
  );
} else {
  printTable(
    ["Fixture", "Phase", singleBuildLabel],
    thisPrRows.map((row) => [
      row.fixture,
      row.phase,
      formatPhaseValue(row.phase, row.value),
    ]),
  );
}
