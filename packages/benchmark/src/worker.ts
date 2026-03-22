/**
 * Benchmark worker — runs in a separate sub-process for isolation.
 *
 * Receives configuration via CLI arguments, runs a single benchmark variant
 * using mitata, and writes the result to a JSON file.
 *
 * Usage:
 *   node --experimental-strip-types src/worker.ts \
 *     --grammar=json \
 *     --phase=full \
 *     --version=latest \
 *     --chevrotain-path=/abs/path/chevrotain.mjs \
 *     --output=/abs/path/result.json \
 *     --output-cst=true \
 *     --min-cpu-time-ms=642
 */
import { writeFileSync } from "node:fs";
import { measure } from "mitata";
import { GRAMMARS } from "./grammars/index.ts";
import type { BenchmarkResult, Phase } from "./types.ts";

// ---------- Parse CLI args ----------
function parseWorkerArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }

  const grammar = args["grammar"];
  const phase = args["phase"] as Phase;
  const versionLabel = args["version"];
  const chevrotainPath = args["chevrotain-path"];
  const outputFile = args["output"];
  const outputCst = args["output-cst"] === "true";
  const minCpuTimeMs = args["min-cpu-time-ms"]
    ? parseFloat(args["min-cpu-time-ms"])
    : 642;

  if (!grammar || !phase || !versionLabel || !chevrotainPath || !outputFile) {
    console.error("Missing required worker arguments.");
    console.error(
      "Required: --grammar, --phase, --version, --chevrotain-path, --output",
    );
    process.exit(1);
  }

  return {
    grammar,
    phase,
    versionLabel,
    chevrotainPath,
    outputFile,
    outputCst,
    minCpuTimeMs,
  };
}

async function main() {
  const args = parseWorkerArgs(process.argv.slice(2));

  // ---------- Load chevrotain version ----------
  const chevrotain = await import(args.chevrotainPath);

  // ---------- Look up grammar ----------
  const grammarDef = GRAMMARS[args.grammar];
  if (!grammarDef) {
    throw new Error(
      `Unknown grammar: "${args.grammar}". Available: ${Object.keys(GRAMMARS).join(", ")}`,
    );
  }

  // ---------- Create grammar instance ----------
  const grammar = grammarDef.factory(chevrotain, {
    outputCst: args.outputCst,
  });
  const sampleInput = grammarDef.sampleInput;

  // ---------- Sanity check: run once to verify it works ----------
  if (args.phase === "lexer" || args.phase === "full") {
    grammar.fullFlow(sampleInput);
  }
  if (args.phase === "parser") {
    const tokens = grammar.lex(sampleInput);
    grammar.parse(tokens);
  }

  // ---------- Build the function to measure ----------
  let fn: () => void;
  if (args.phase === "lexer") {
    fn = () => {
      grammar.lex(sampleInput);
    };
  } else if (args.phase === "parser") {
    // Lex once upfront; only the parse step is measured each iteration
    const tokens = grammar.lex(sampleInput);
    fn = () => {
      grammar.parse(tokens);
    };
  } else {
    // "full" — lex + parse every iteration
    fn = () => {
      grammar.fullFlow(sampleInput);
    };
  }

  // ---------- Run benchmark via mitata measure() ----------
  // min_cpu_time is in nanoseconds; config provides it in milliseconds.
  // inner_gc: run GC between each sample to prevent GC pauses skewing results
  //   (this automatically doubles min_cpu_time inside mitata)
  // warmup_samples: extra iterations to let V8 TurboFan reach steady-state JIT
  //   before measurement begins
  const s = await measure(fn, {
    min_cpu_time: args.minCpuTimeMs * 1e6,
    inner_gc: true,
    warmup_samples: 20,
  });

  // ---------- Build result ----------
  const result: BenchmarkResult = {
    grammar: args.grammar,
    phase: args.phase,
    version: args.versionLabel,
    outputCst: args.outputCst,
    stats: {
      avg: s.avg,
      min: s.min,
      max: s.max,
      p50: s.p50,
      p75: s.p75,
      p99: s.p99,
      samples: s.samples?.length ?? 0,
    },
  };

  // ---------- Write result ----------
  writeFileSync(args.outputFile, JSON.stringify(result, null, 2), "utf-8");
}

main().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
