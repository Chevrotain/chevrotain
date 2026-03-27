/**
 * Node.js CLI benchmark for the Chevrotain parser engine.
 *
 * Usage:
 *   node benchmark.mjs                        # our local build
 *   node benchmark.mjs --lib <path>           # compare a different build
 *   node benchmark.mjs --parser json|css      # select parser (default: all)
 *   node benchmark.mjs --cst                  # use CstParser (default: EmbeddedActionsParser)
 *   node benchmark.mjs --iterations 5000      # override iteration count
 *
 * To compare against the published npm version:
 *   npm pack chevrotain@latest -o /tmp/chevrotain-baseline.tgz
 *   tar -xzf /tmp/chevrotain-baseline.tgz -C /tmp/
 *   node benchmark.mjs --lib /tmp/package/lib/chevrotain.mjs
 */

import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function getArg(flag, defaultVal) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : defaultVal;
}

const libPath = getArg(
  "--lib",
  new URL("../lib/chevrotain.mjs", import.meta.url).href,
);
const mode = getArg("--mode", "warm"); // "warm" | "warm-lex" | "warm-parse" | "cold" | "first-parse" | "construction" | "all"
const selectedParser = getArg("--parser", "all");
const useCst = args.includes("--cst");
const useSmart = args.includes("--smart");
const quiet = args.includes("--quiet");
// --no-psa: construct parsers WITHOUT calling performSelfAnalysis().
// Local no-PSA runs use SmartParser. v12 requires performSelfAnalysis().
const noPsa = args.includes("--no-psa");
const ITERATIONS = parseInt(getArg("--iterations", "5000"), 10);
const WARMUP = Math.max(100, Math.floor(ITERATIONS * 0.1));
const defaultRuns = mode === "compare" ? "3" : "1";
const defaultBurnInRuns = mode === "compare" ? "1" : "0";
const RUNS = Math.max(1, parseInt(getArg("--runs", defaultRuns), 10));
const BURN_IN_RUNS = Math.max(
  0,
  parseInt(getArg("--burn-in-runs", defaultBurnInRuns), 10),
);

// ---------------------------------------------------------------------------
// Load chevrotain
// ---------------------------------------------------------------------------
const libUrl =
  libPath.startsWith("http") || libPath.startsWith("file:")
    ? libPath
    : pathToFileURL(path.resolve(process.cwd(), libPath)).href;

const chevrotain = await import(libUrl);
const { createToken, Lexer, EmbeddedActionsParser, CstParser, SmartParser } =
  chevrotain;
const ParserBase = useCst
  ? CstParser
  : useSmart || noPsa
    ? SmartParser
    : EmbeddedActionsParser;
const parserConfig = useCst ? {} : { outputCst: false };

// ---------------------------------------------------------------------------
// JSON parser
// ---------------------------------------------------------------------------
function makeJsonParser() {
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

  class JsonParser extends ParserBase {
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
        $.OR(
          ($.c1 ??= [
            { ALT: () => $.CONSUME(StringLiteral) },
            { ALT: () => $.CONSUME(NumberLiteral) },
            { ALT: () => $.SUBRULE($.object) },
            { ALT: () => $.SUBRULE($.array) },
            { ALT: () => $.CONSUME(True) },
            { ALT: () => $.CONSUME(False) },
            { ALT: () => $.CONSUME(Null) },
          ]),
        );
      });

      if (!noPsa) this.performSelfAnalysis();
    }
  }

  const parser = new JsonParser();

  // ~40 KB of JSON (1000 records)
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
    tokenize() {
      return lexer.tokenize(sample).tokens;
    },
    parse(tokens) {
      parser.input = tokens;
      parser.json();
    },
    run() {
      this.parse(this.tokenize());
    },
  };
}

// ---------------------------------------------------------------------------
// CSS parser
// ---------------------------------------------------------------------------
function makeCssParser() {
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

  class CssParser extends ParserBase {
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

      if (!noPsa) this.performSelfAnalysis();
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
    tokenize() {
      return lexer.tokenize(sample).tokens;
    },
    parse(tokens) {
      parser.input = tokens;
      parser.stylesheet();
    },
    run() {
      this.parse(this.tokenize());
    },
  };
}

// ---------------------------------------------------------------------------
// Benchmark runner
// ---------------------------------------------------------------------------
const REPS = 50; // repetitions for construction/cold timing

function timeMs(fn, reps = REPS) {
  fn(); // throwaway: ensure module cached
  const start = performance.now();
  for (let i = 0; i < reps; i++) fn();
  return (performance.now() - start) / reps;
}

function bench(name, fn) {
  // Warmup: give V8 time to JIT-compile all paths before measuring.
  for (let i = 0; i < WARMUP; i++) fn();
  // Collect SAMPLES timed windows and take the median to suppress outliers
  // caused by GC pauses, OS scheduling jitter, and CPU frequency scaling.
  const SAMPLES = 7;
  const SAMPLE_ITERS = Math.ceil(ITERATIONS / SAMPLES);
  const rates = [];
  for (let s = 0; s < SAMPLES; s++) {
    const start = performance.now();
    for (let i = 0; i < SAMPLE_ITERS; i++) fn();
    rates.push((SAMPLE_ITERS / (performance.now() - start)) * 1000);
  }
  rates.sort((a, b) => a - b);
  const median = rates[Math.floor(SAMPLES / 2)];
  const opsPerSec = Math.round(median);
  const msPerOp = (1000 / median).toFixed(3);
  console.log(
    `  ${name.padEnd(8)} ${opsPerSec.toLocaleString().padStart(10)} ops/sec   (${msPerOp} ms/op)`,
  );
  return opsPerSec;
}

function median(nums) {
  const xs = [...nums].sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

function stripFlags(argv, flagsWithValues = [], flagsWithoutValues = []) {
  const result = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (flagsWithValues.includes(arg)) {
      i++;
      continue;
    }
    if (flagsWithoutValues.includes(arg)) {
      continue;
    }
    result.push(arg);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const factories = [];
if (selectedParser === "all" || selectedParser === "json")
  factories.push({ name: "JSON", make: makeJsonParser });
if (selectedParser === "all" || selectedParser === "css")
  factories.push({ name: "CSS", make: makeCssParser });

if (!quiet) {
  console.log(`\nChevrotain parser benchmark`);
  console.log(`  lib:        ${libUrl}`);
  console.log(
    `  parser type: ${useCst ? "CstParser" : useSmart || noPsa ? "SmartParser" : "EmbeddedActionsParser"}`,
  );
  console.log(`  mode:       ${mode}`);
  console.log(
    `  iterations: ${ITERATIONS.toLocaleString()} (+ ${WARMUP.toLocaleString()} warmup)`,
  );
  console.log(
    `  warm runs:  ${RUNS.toLocaleString()}${BURN_IN_RUNS > 0 ? ` (+ ${BURN_IN_RUNS.toLocaleString()} burn-in)` : ""}`,
  );
  console.log(`  parsers:    ${factories.map((f) => f.name).join(", ")}`);
  console.log(`  psa:        ${noPsa ? "SKIP (lazy-build path)" : "yes"}\n`);
}

// ---------------------------------------------------------------------------
// Prefer `node` over bun when spawning child processes: bun's JIT warms up
// differently from V8 and produces misleading comparison numbers.
// ---------------------------------------------------------------------------
const { execFileSync: _execFileSync } = await import("node:child_process");
const nodeExec = (() => {
  try {
    _execFileSync("node", ["--version"], { stdio: "ignore" });
    return "node";
  } catch {
    return process.execPath;
  }
})();

// ---------------------------------------------------------------------------
// "all" mode: spawn a fresh V8 process for each phase so JIT profiles from
// construction-heavy phases don't pollute the warm steady-state measurement.
// ---------------------------------------------------------------------------
if (mode === "all") {
  const selfPath = new URL(import.meta.url).pathname;
  // Forward CLI args, replacing --mode all with each specific mode.
  const baseArgs = process.argv
    .slice(2)
    .filter((a, i, arr) => a !== "--mode" && arr[i - 1] !== "--mode");
  for (const phase of [
    "construction",
    "cold",
    "first-parse",
    "warm-lex",
    "warm-parse",
    "warm",
  ]) {
    const childArgs = [selfPath, "--mode", phase, ...baseArgs, "--quiet"];
    try {
      const output = _execFileSync(nodeExec, childArgs, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "inherit"],
      });
      // Print only non-empty lines from the child.
      for (const l of output.split("\n")) {
        if (l.trim()) console.log(l);
      }
    } catch (e) {
      console.error(`Phase "${phase}" failed:`, e.message);
    }
  }
  process.exit(0);
}

function measureConstructionAndCold() {
  const results = {};
  for (const f of factories) {
    // Measure constructor and first parse in the same repetition so the
    // reported rows add up exactly: construct+parse = constructor + parse-only.
    f.make(); // throwaway for module/cache warmup symmetry with timeMs()
    let constructionTotal = 0;
    let coldTotal = 0;
    for (let i = 0; i < REPS; i++) {
      const t0 = performance.now();
      const p = f.make();
      const t1 = performance.now();
      p.run();
      const t2 = performance.now();
      constructionTotal += t1 - t0;
      coldTotal += t2 - t0;
    }
    const construction = constructionTotal / REPS;
    const cold = coldTotal / REPS;
    results[f.name] = {
      construction: parseFloat(construction.toFixed(2)),
      cold: parseFloat(cold.toFixed(2)),
      "first-parse": parseFloat((cold - construction).toFixed(3)),
    };
  }
  return results;
}

// ---------------------------------------------------------------------------
// "compare" mode: run all phases for v12, our+psa, our-psa side-by-side.
//
// Usage:
//   node benchmark.mjs --mode compare --v12 /tmp/chevrotain-v12/package/lib/chevrotain.mjs
// ---------------------------------------------------------------------------
if (mode === "compare") {
  const selfPath = new URL(import.meta.url).pathname;
  const ourLib = new URL("../lib/chevrotain.mjs", import.meta.url).href;
  const v12Lib = getArg(
    "--v12",
    "/tmp/chevrotain-v12/package/lib/chevrotain.mjs",
  );

  function runPhase(phase, extraArgs) {
    const childArgs = [
      "--expose-gc",
      selfPath,
      "--mode",
      phase,
      "--json",
      "--quiet",
      ...extraArgs,
    ];
    try {
      const out = _execFileSync(nodeExec, childArgs, {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "inherit"],
      });
      // Find the JSON line (last non-empty line in case of warnings)
      const lines = out
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      return JSON.parse(lines[lines.length - 1]);
    } catch (e) {
      return null;
    }
  }

  function runWarmMedian(phase, extraArgs) {
    const warmRuns = [];
    for (let i = 0; i < BURN_IN_RUNS; i++) {
      runPhase(phase, extraArgs);
    }
    for (let i = 0; i < RUNS; i++) {
      const data = runPhase(phase, extraArgs);
      if (data != null) warmRuns.push(data);
    }
    if (warmRuns.length === 0) return null;
    const result = {};
    for (const parser of parserNames) {
      const vals = warmRuns
        .map((row) => row?.[parser])
        .filter((v) => typeof v === "number");
      result[parser] = vals.length > 0 ? median(vals) : null;
    }
    return result;
  }

  const phases = [
    "construction",
    "first-parse",
    "cold",
    "warm-lex",
    "warm-parse",
    "warm",
  ];
  const configs = [
    { label: "v12 + psa", args: ["--lib", v12Lib] },
    { label: "embed + psa", args: ["--lib", ourLib] },
    { label: "smart + psa", args: ["--lib", ourLib, "--smart"] },
    { label: "smart - psa", args: ["--lib", ourLib, "--smart", "--no-psa"] },
  ];

  // Collect results: results[phase][configLabel][parserName] = value
  const results = {};
  const parserNames = ["JSON", "CSS"];
  for (const phase of ["construction", "cold"]) {
    results[phase] = {};
  }
  results["first-parse"] = {};
  results["warm-lex"] = {};
  results["warm-parse"] = {};
  results.warm = {};

  process.stderr.write(`  running constructor/cold...`);
  for (const cfg of configs) {
    const data = runPhase("summary", cfg.args);
    results.construction[cfg.label] = {};
    results["first-parse"][cfg.label] = {};
    results.cold[cfg.label] = {};
    for (const parser of parserNames) {
      const row = data?.[parser];
      results.construction[cfg.label][parser] = row?.construction ?? null;
      results["first-parse"][cfg.label][parser] = row?.["first-parse"] ?? null;
      results.cold[cfg.label][parser] = row?.cold ?? null;
    }
  }
  process.stderr.write(" done\n");

  process.stderr.write(`  running warm...`);
  for (const warmPhase of ["warm-lex", "warm-parse", "warm"]) {
    for (const cfg of configs) {
      const data =
        RUNS > 1 || BURN_IN_RUNS > 0
          ? runWarmMedian(warmPhase, cfg.args)
          : runPhase(warmPhase, cfg.args);
      results[warmPhase][cfg.label] = data;
    }
  }
  process.stderr.write(" done\n");

  // Print table
  const isWarm = (phase) => phase.startsWith("warm");
  const fmt = (phase, val) =>
    val == null
      ? "  ERROR  "
      : isWarm(phase)
        ? `${Math.round(val).toLocaleString().padStart(8)}/s`
        : `${val.toFixed(2).padStart(7)} ms`;
  const phaseLabels = {
    construction: "constructor",
    cold: "construct+parse",
    "first-parse": "parse-only",
    "warm-lex": "lex-warm",
    "warm-parse": "parse-warm",
    warm: "full-warm",
  };

  const ratio = (phase, ourVal, v12Val) => {
    if (ourVal == null || v12Val == null) return "";
    const r = isWarm(phase) ? ourVal / v12Val : v12Val / ourVal;
    return `(${(r * 100).toFixed(0)}%)`;
  };

  console.log(
    "\n╔══════════════════════════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║                      Chevrotain benchmark: strict vs smart vs v12                 ║",
  );
  console.log(
    "╠══════════════════════════════════════════════════════════════════════════════════════╣",
  );

  for (const parser of parserNames) {
    console.log(
      `║  ${parser}                                                                              ║`.slice(
        0,
        86,
      ) + "║",
    );
    console.log(
      `║  Phase          v12 + psa    embed + psa   smart + psa   smart - psa                  ║`,
    );
    console.log(
      `║  ────────────────────────────────────────────────────────────────────────────────────  ║`,
    );
    for (const phase of phases) {
      const v12Val = results[phase][configs[0].label]?.[parser];
      const embedVal = results[phase][configs[1].label]?.[parser];
      const smartPsaVal = results[phase][configs[2].label]?.[parser];
      const smartNoPsaVal = results[phase][configs[3].label]?.[parser];
      const r1 = ratio(phase, embedVal, v12Val);
      const r2 = ratio(phase, smartPsaVal, v12Val);
      const r3 = ratio(phase, smartNoPsaVal, v12Val);
      const phasePad = phaseLabels[phase].padEnd(13);
      console.log(
        `║  ${phasePad}  ${fmt(phase, v12Val)}  ${fmt(phase, embedVal)} ${r1.padEnd(6)}  ${fmt(phase, smartPsaVal)} ${r2.padEnd(6)}  ${fmt(phase, smartNoPsaVal)} ${r3.padEnd(6)}  ║`,
      );
    }
    if (parser !== parserNames[parserNames.length - 1]) {
      console.log(
        "╠══════════════════════════════════════════════════════════════════════════════════════╣",
      );
    }
  }
  console.log(
    "╚══════════════════════════════════════════════════════════════════════════════════════╝",
  );
  console.log(
    "  ratios: higher = better for warm (ops/s), lower = better for ms phases",
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Single-phase modes: each runs in its own V8 process (clean JIT state).
// ---------------------------------------------------------------------------
const jsonOutput = args.includes("--json");

if (mode === "construction") {
  const results = {};
  for (const f of factories) {
    results[f.name] = parseFloat(timeMs(() => f.make(), REPS).toFixed(2));
  }
  if (jsonOutput) {
    console.log(JSON.stringify(results));
  } else {
    console.log(`Construction only (${REPS} reps each):`);
    for (const [k, v] of Object.entries(results))
      console.log(`  ${k.padEnd(8)} ${v.toFixed(2)} ms`);
  }
}

if (mode === "cold") {
  const results = {};
  for (const f of factories) {
    results[f.name] = parseFloat(
      timeMs(() => {
        const p = f.make();
        p.run();
      }, REPS).toFixed(2),
    );
  }
  if (jsonOutput) {
    console.log(JSON.stringify(results));
  } else {
    console.log(`Cold (construction + first parse, ${REPS} reps):`);
    for (const [k, v] of Object.entries(results))
      console.log(`  ${k.padEnd(8)} ${v.toFixed(2)} ms`);
  }
}

if (mode === "first-parse") {
  const combined = measureConstructionAndCold();
  const results = {};
  for (const [name, timings] of Object.entries(combined)) {
    results[name] = timings["first-parse"];
  }
  if (jsonOutput) {
    console.log(JSON.stringify(results));
  } else {
    console.log(`First parse only (post-construction, ${REPS} reps):`);
    for (const [k, v] of Object.entries(results))
      console.log(`  ${k.padEnd(8)} ${v.toFixed(3)} ms`);
  }
}

if (mode === "summary") {
  const results = measureConstructionAndCold();
  if (jsonOutput) {
    console.log(JSON.stringify(results));
  } else {
    console.log(results);
  }
}

if (mode === "warm" || mode === "warm-lex" || mode === "warm-parse") {
  const warmVariant = mode;

  if (RUNS > 1 || BURN_IN_RUNS > 0) {
    const selfPath = new URL(import.meta.url).pathname;
    const baseArgs = stripFlags(
      process.argv.slice(2),
      ["--runs", "--burn-in-runs", "--mode", "--parser"],
      ["--json", "--quiet"],
    );
    const results = {};
    for (const f of factories) {
      const samples = [];
      for (let i = 0; i < BURN_IN_RUNS; i++) {
        const out = _execFileSync(
          nodeExec,
          [
            selfPath,
            ...baseArgs,
            "--mode",
            warmVariant,
            "--parser",
            f.name.toLowerCase(),
            "--json",
            "--quiet",
          ],
          {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "inherit"],
          },
        );
        void out;
      }
      for (let i = 0; i < RUNS; i++) {
        const out = _execFileSync(
          nodeExec,
          [
            selfPath,
            ...baseArgs,
            "--mode",
            warmVariant,
            "--parser",
            f.name.toLowerCase(),
            "--json",
            "--quiet",
          ],
          {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "inherit"],
          },
        );
        const lines = out
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const data = JSON.parse(lines[lines.length - 1]);
        samples.push(data[f.name]);
      }
      results[f.name] = median(samples);
    }
    if (jsonOutput && quiet) {
      console.log(JSON.stringify(results));
    } else {
      console.log(`warm median over ${RUNS} run(s)`);
      for (const [k, v] of Object.entries(results))
        console.log(
          `  ${k.padEnd(8)} ${Math.round(v).toLocaleString().padStart(10)} ops/sec`,
        );
    }
    process.exit(0);
  }

  const results = {};
  for (const f of factories) {
    const p = f.make();
    if (warmVariant === "warm-lex") {
      results[f.name] = bench(f.name, () => p.tokenize());
    } else if (warmVariant === "warm-parse") {
      const tokens = p.tokenize();
      results[f.name] = bench(f.name, () => p.parse(tokens));
    } else {
      results[f.name] = bench(f.name, () => p.run());
    }
  }
  if (jsonOutput && quiet) {
    console.log(JSON.stringify(results));
  }
}
const phaseLabels = {
  construction: "constructor",
  cold: "construct+parse",
  "first-parse": "parse-only",
  warm: "warm-reuse",
};
