/**
 * Benchmark orchestrator — the main entry point.
 *
 * Reads configuration, downloads/verifies chevrotain versions,
 * spawns worker sub-processes for each variant, collects results,
 * and prints a comparison table.
 *
 * Usage:
 *   node --experimental-strip-types src/run.ts                # Run all benchmarks
 *   node --experimental-strip-types src/run.ts --grammar=json # Only JSON grammar
 *   node --experimental-strip-types src/run.ts --phase=parser # Only parser phase
 *   node --experimental-strip-types src/run.ts --no-cst       # Disable CST creation
 */
import {
  mkdirSync,
  readFileSync,
  existsSync,
  writeFileSync,
  unlinkSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { parseCliArgs, buildConfig } from "./config.ts";
import { downloadLatestVersion, ensureNextVersion } from "./load_version.ts";
import { formatResults } from "./format.ts";
import { GRAMMARS } from "./grammars/index.ts";
import type { BenchmarkResult, Phase } from "./types.ts";

const PACKAGE_ROOT = resolve(dirname(import.meta.dirname!));

interface Variant {
  grammar: string;
  phase: Phase;
  versionLabel: string;
  chevrotainPath: string;
}

const NODE_TS_FLAGS = [
  // --experimental-strip-types: run .ts files directly (Node 22.6+)
  "--experimental-strip-types",
  // --expose-gc: enables global.gc() so mitata can trigger GC properly between
  //   samples; without it mitata falls back to allocating a ~1GB array to pressure GC
  "--expose-gc",
];

/**
 * Spawn a Node.js child process and wait for it to exit.
 * Returns the exit code and captured stderr.
 */
function spawnWorker(
  args: string[],
  cwd: string,
): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn("node", [...NODE_TS_FLAGS, ...args], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderrData = "";
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderrData += chunk.toString();
    });

    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 1, stderr: stderrData });
    });
  });
}

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

  // Download latest fresh into a temp file for this run
  const latestTmpPath = join(tmpdir(), "chevrotain-benchmark-latest.mjs");
  try {
    const body = await downloadLatestVersion(config.versions.latest.url);
    writeFileSync(latestTmpPath, body, "utf-8");
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

  // ---------- Build variant matrix ----------
  const variants: Variant[] = [];
  for (const grammar of config.grammars) {
    for (const phase of config.phases) {
      variants.push({
        grammar,
        phase,
        versionLabel: "latest",
        chevrotainPath: latestTmpPath,
      });
      variants.push({
        grammar,
        phase,
        versionLabel: "next",
        chevrotainPath: nextPath,
      });
    }
  }

  console.log(
    `\nRunning ${variants.length} benchmark variants (outputCst: ${config.outputCst})...\n`,
  );

  // ---------- Run variants sequentially ----------
  const workerScript = resolve(PACKAGE_ROOT, "src", "worker.ts");
  const results: BenchmarkResult[] = [];
  let hasErrors = false;

  try {
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const outputFile = resolve(
        resultsDir,
        `${v.grammar}-${v.phase}-${v.versionLabel}.json`,
      );
      const grammarName = GRAMMARS[v.grammar]?.name ?? v.grammar;

      const progress = `[${i + 1}/${variants.length}]`;
      process.stdout.write(
        `${progress} ${grammarName} | ${v.phase} | ${v.versionLabel} ...`,
      );

      const { exitCode, stderr } = await spawnWorker(
        [
          workerScript,
          `--grammar=${v.grammar}`,
          `--phase=${v.phase}`,
          `--version=${v.versionLabel}`,
          `--chevrotain-path=${v.chevrotainPath}`,
          `--output=${outputFile}`,
          `--output-cst=${config.outputCst}`,
          `--min-cpu-time-ms=${config.minCpuTimeMs}`,
        ],
        PACKAGE_ROOT,
      );

      if (exitCode !== 0) {
        console.log(` FAILED (exit code ${exitCode})`);
        if (stderr.trim()) {
          console.error(`  stderr: ${stderr.trim()}`);
        }
        hasErrors = true;

        // Write an error result so the table still shows this variant
        results.push({
          grammar: v.grammar,
          phase: v.phase,
          version: v.versionLabel,
          outputCst: config.outputCst,
          stats: { avg: 0, min: 0, max: 0, p50: 0, p75: 0, p99: 0, samples: 0 },
          error: `Worker exited with code ${exitCode}`,
        });
        continue;
      }

      // Read the result file
      if (existsSync(outputFile)) {
        try {
          const resultJson = readFileSync(outputFile, "utf-8");
          const result: BenchmarkResult = JSON.parse(resultJson);
          results.push(result);

          if (result.error) {
            console.log(` ERROR: ${result.error}`);
            hasErrors = true;
          } else {
            const opsPerSec =
              result.stats.avg > 0
                ? (1e9 / result.stats.avg).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })
                : "N/A";
            console.log(` done (${opsPerSec} op/s)`);
          }
        } catch {
          console.log(" FAILED (could not read result file)");
          hasErrors = true;
        }
      } else {
        console.log(" FAILED (no result file produced)");
        hasErrors = true;
      }
    }
  } finally {
    // Clean up the temp file for the latest version
    try {
      unlinkSync(latestTmpPath);
    } catch {}
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
