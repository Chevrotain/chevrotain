/**
 * Benchmark orchestrator — the main entry point.
 *
 * Spawns one long-lived worker process per variant (grammar × phase × version).
 * Round-robins across all workers, requesting small batches of samples from each.
 * After all rounds complete, merges samples per variant, trims outliers,
 * computes final stats, and prints a comparison table.
 *
 * Usage:
 *   node --experimental-strip-types src/run.ts                # Run all benchmarks
 *   node --experimental-strip-types src/run.ts --grammar=json # Only JSON grammar
 *   node --experimental-strip-types src/run.ts --phase=parser # Only parser phase
 *   node --experimental-strip-types src/run.ts --no-cst       # Disable CST creation
 */
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawn, type ChildProcess } from "node:child_process";
import { parseCliArgs, buildConfig } from "./config.ts";
import { downloadLatestVersion, ensureNextVersion } from "./load_version.ts";
import { trimAndComputeStats } from "./stats.ts";
import { formatResults } from "./format.ts";
import { GRAMMARS } from "./grammars/index.ts";
import type {
  BenchmarkResult,
  Phase,
  WorkerCommand,
  WorkerResponse,
} from "./types.ts";

const __dirname = import.meta.dirname;
const PACKAGE_ROOT = resolve(__dirname, "..");

// --experimental-strip-types: run .ts files directly (Node 22.6+)
// --expose-gc: enables global.gc() so the worker can trigger GC between batches
const NODE_FLAGS = ["--experimental-strip-types", "--expose-gc"];

interface Variant {
  grammar: string;
  phase: Phase;
  versionLabel: string;
  chevrotainPath: string;
}

interface VariantWorker {
  variant: Variant;
  proc: ChildProcess;
  samples: number[];
  error?: string;
}

// ---------- IPC helpers ----------

/**
 * Send a command to a worker process via IPC.
 */
function sendCommand(proc: ChildProcess, cmd: WorkerCommand) {
  proc.send(cmd);
}

/**
 * Wait for a single IPC message from a worker process.
 * Rejects if the process exits before sending a message.
 */
function waitForMessage(proc: ChildProcess): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    function onMessage(msg: WorkerResponse) {
      cleanup();
      resolve(msg);
    }
    function onClose(code: number | null) {
      cleanup();
      reject(new Error(`Worker exited with code ${code} before responding`));
    }
    function cleanup() {
      proc.removeListener("message", onMessage);
      proc.removeListener("close", onClose);
    }
    proc.once("message", onMessage);
    proc.once("close", onClose);
  });
}

// ---------- Main ----------

async function main() {
  const cliArgs = parseCliArgs(process.argv.slice(2));
  const config = buildConfig(cliArgs);

  // Validate grammar names
  for (const g of config.grammars) {
    if (!GRAMMARS[g]) {
      console.error(
        `Unknown grammar: "${g}". Available: ${Object.keys(GRAMMARS).join(", ")}`,
      );
      process.exit(1);
    }
  }

  // Validate phase names
  const validPhases = new Set(["lexer", "parser", "full"]);
  for (const p of config.phases) {
    if (!validPhases.has(p)) {
      console.error(`Unknown phase: "${p}". Available: lexer, parser, full`);
      process.exit(1);
    }
  }

  // Ensure results directory
  const resultsDir = resolve(PACKAGE_ROOT, config.resultsDir);
  mkdirSync(resultsDir, { recursive: true });

  // ---------- Resolve chevrotain versions ----------
  console.log("Resolving chevrotain versions...\n");

  const downloadsDir = resolve(__dirname, "..", "downloads");
  mkdirSync(downloadsDir, { recursive: true });
  const latestDownloadPath = join(downloadsDir, `chevrotain-latest.mjs`);
  try {
    const body = await downloadLatestVersion(config.versions.latest.url);
    writeFileSync(latestDownloadPath, body, "utf-8");
    console.log(`  latest: ${config.versions.latest.url}`);
  } catch (err: any) {
    console.error(`Failed to download latest version: ${err.message}`);
    process.exit(1);
  }

  let nextPath: string;
  try {
    nextPath = ensureNextVersion(config.versions.next.path);
    console.log(`  next:   ${nextPath}`);
  } catch (err: any) {
    console.error(`Failed to resolve next version: ${err.message}`);
    process.exit(1);
  }

  // ---------- Build variant list ----------
  const variants: Variant[] = [];
  for (const grammar of config.grammars) {
    for (const phase of config.phases) {
      variants.push({
        grammar,
        phase,
        versionLabel: "latest",
        chevrotainPath: latestDownloadPath,
      });
      variants.push({
        grammar,
        phase,
        versionLabel: "next",
        chevrotainPath: nextPath,
      });
    }
  }

  const totalSamples = config.batchSize * config.rounds;
  console.log(
    `\nBenchmarking ${variants.length} variants ` +
      `(${config.rounds} rounds × ${config.batchSize} samples/batch = ${totalSamples} samples each, ` +
      `outputCst: ${config.outputCst})\n`,
  );

  // ---------- Spawn one long-lived worker per variant ----------
  const workerScript = resolve(PACKAGE_ROOT, "src", "worker.ts");
  const workers: VariantWorker[] = [];

  console.log("Spawning and initializing workers...");

  for (const variant of variants) {
    const proc = spawn("node", [...NODE_FLAGS, workerScript], {
      cwd: PACKAGE_ROOT,
      stdio: ["inherit", "inherit", "pipe", "ipc"],
    });

    // Capture stderr for error reporting
    let stderrBuf = "";
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString();
    });

    workers.push({ variant, proc, samples: [] });

    // Send init command
    sendCommand(proc, {
      type: "init",
      grammar: variant.grammar,
      phase: variant.phase,
      chevrotainPath: variant.chevrotainPath,
      outputCst: config.outputCst,
      warmupIterations: config.warmupIterations,
    });
  }

  // Wait for all workers to report ready
  let hasErrors = false;
  for (const w of workers) {
    const grammarName = GRAMMARS[w.variant.grammar]?.name ?? w.variant.grammar;
    const label = `${grammarName} | ${w.variant.phase} | ${w.variant.versionLabel}`;
    try {
      const msg = await waitForMessage(w.proc);
      if (msg.type === "ready") {
        console.log(`  ${label} — ready`);
      } else if (msg.type === "error") {
        console.error(`  ${label} — init error: ${msg.message}`);
        w.error = msg.message;
        hasErrors = true;
      }
    } catch (err: any) {
      console.error(`  ${label} — ${err.message}`);
      w.error = err.message;
      hasErrors = true;
    }
  }

  // ---------- Round-robin measurement loop ----------
  console.log("\nMeasuring...");

  const activeWorkers = workers.filter((w) => !w.error);

  for (let round = 0; round < config.rounds; round++) {
    // Progress display every 10th round (or first/last)
    if (round % 10 === 0 || round === config.rounds - 1) {
      const padded = String(round + 1).padStart(String(config.rounds).length);
      process.stdout.write(`\r  Round ${padded}/${config.rounds}`);
    }

    for (const w of activeWorkers) {
      await sleep(10);
      sendCommand(w.proc, { type: "measure", batchSize: config.batchSize });

      try {
        const msg = await waitForMessage(w.proc);
        if (msg.type === "samples") {
          // Append batch samples to the accumulator
          for (const s of msg.samples) {
            w.samples.push(s);
          }
        } else if (msg.type === "error") {
          const label = `${w.variant.grammar} | ${w.variant.phase} | ${w.variant.versionLabel}`;
          console.error(
            `\n  ${label} — error in round ${round + 1}: ${msg.message}`,
          );
          w.error = msg.message;
          hasErrors = true;
        }
      } catch (err: any) {
        const label = `${w.variant.grammar} | ${w.variant.phase} | ${w.variant.versionLabel}`;
        console.error(
          `\n  ${label} — crashed in round ${round + 1}: ${err.message}`,
        );
        w.error = err.message;
        hasErrors = true;
      }
    }
  }

  console.log("\n");

  // ---------- Shut down all workers ----------
  for (const w of workers) {
    try {
      sendCommand(w.proc, { type: "exit" });
    } catch {
      // Worker may have already exited
    }
  }

  // ---------- Compute final stats and build results ----------
  const results: BenchmarkResult[] = [];

  for (const w of workers) {
    if (w.error) {
      results.push({
        grammar: w.variant.grammar,
        phase: w.variant.phase,
        version: w.variant.versionLabel,
        outputCst: config.outputCst,
        stats: { avg: 0, min: 0, max: 0, p50: 0, p75: 0, p99: 0, samples: 0 },
        error: w.error,
      });
      continue;
    }

    // Sort all samples, then trim and compute stats
    w.samples.sort((a, b) => a - b);
    const stats = trimAndComputeStats(w.samples, config.trimPercent);

    const result: BenchmarkResult = {
      grammar: w.variant.grammar,
      phase: w.variant.phase,
      version: w.variant.versionLabel,
      outputCst: config.outputCst,
      stats,
    };

    results.push(result);

    // Write individual result file
    const outputFile = resolve(
      resultsDir,
      `${w.variant.grammar}-${w.variant.phase}-${w.variant.versionLabel}.json`,
    );
    writeFileSync(outputFile, JSON.stringify(result, null, 2), "utf-8");
  }

  // ---------- Print results table ----------
  const table = formatResults(results);
  console.log(table);

  if (hasErrors) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Benchmark orchestrator failed:", err);
  process.exit(1);
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
