/**
 * Benchmark worker — runs in a separate sub-process for isolation.
 *
 * Receives configuration via CLI arguments, runs a single benchmark variant
 * using mitata, and writes the result to a JSON file.
 *
 * Usage:
 *   node src/worker.ts \
 *     --grammar=json \
 *     --phase=full \
 *     --version=latest \
 *     --chevrotain-path=/abs/path/chevrotain.mjs \
 *     --output=/abs/path/result.json \
 *     --output-cst=true
 */
import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";
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

  // ---------- Define mitata benchmark ----------
  const label = `${grammar.name} | ${args.phase} | ${args.versionLabel}`;

  const gcMode = "once";
  if (args.phase === "lexer") {
    bench(label, () => {
      grammar.lex(sampleInput);
    }).gc(gcMode);
  } else if (args.phase === "parser") {
    // Lex once, reuse tokens for every iteration
    const tokens = grammar.lex(sampleInput);
    bench(label, () => {
      grammar.parse(tokens);
    }).gc(gcMode);
  } else {
    // "full" — lex + parse every iteration
    bench(label, () => {
      grammar.fullFlow(sampleInput);
    }).gc(gcMode);
  }

  // ---------- Run benchmark ----------
  const report = await run({ format: "quiet" });

  // ---------- Extract stats ----------
  const trial = report.benchmarks[0];
  const runResult = trial?.runs?.[0];

  let result: BenchmarkResult;

  if (runResult?.error) {
    result = {
      grammar: args.grammar,
      phase: args.phase,
      version: args.versionLabel,
      outputCst: args.outputCst,
      stats: { avg: 0, min: 0, max: 0, p50: 0, p75: 0, p99: 0, samples: 0 },
      error: String(runResult.error),
    };
  } else if (runResult?.stats) {
    const s = runResult.stats;
    result = {
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
  } else {
    result = {
      grammar: args.grammar,
      phase: args.phase,
      version: args.versionLabel,
      outputCst: args.outputCst,
      stats: { avg: 0, min: 0, max: 0, p50: 0, p75: 0, p99: 0, samples: 0 },
      error: "No benchmark results produced",
    };
  }

  // ---------- Write result ----------
  writeFileSync(args.outputFile, JSON.stringify(result, null, 2), "utf-8");
}

main().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
