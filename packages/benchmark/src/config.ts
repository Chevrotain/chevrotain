/**
 * Benchmark configuration and CLI argument parsing.
 */
import type { Phase } from "./types.ts";

export interface BenchmarkConfig {
  /** Which grammars to benchmark. */
  grammars: string[];
  /** Which phases to benchmark. */
  phases: Phase[];
  /** Whether parsers should build a CST. Applies to the entire run. */
  outputCst: boolean;
  /** Chevrotain version sources. */
  versions: {
    latest: { url: string };
    next: { path: string };
  };
  /**
   * Number of samples collected per batch per variant per round.
   * Each round, the orchestrator requests this many samples from each
   * variant's long-lived worker process.
   */
  batchSize: number;
  /**
   * Total number of interleaved rounds.
   * Total samples per variant = batchSize × rounds.
   * Higher values distribute temporal noise more evenly across variants.
   */
  rounds: number;
  /**
   * Number of warmup iterations run in each worker process after loading
   * the grammar and before any measurement. Allows V8 TurboFan to reach
   * steady-state JIT compilation.
   */
  warmupIterations: number;
  /**
   * Fraction of samples to trim from each end before computing final stats.
   * e.g. 0.1 removes the lowest 10% and highest 10% (20% total).
   * Applied once on the merged samples from all rounds.
   */
  trimPercent: number;
  /** Directory for final result JSON files. */
  resultsDir: string;
}

export const DEFAULT_CONFIG: BenchmarkConfig = {
  grammars: ["json", "css"],
  phases: ["lexer", "parser", "full"],
  outputCst: false,
  versions: {
    latest: {
      url: "https://unpkg.com/chevrotain@latest/lib/chevrotain.mjs",
    },
    next: {
      // Relative to the benchmark package root
      path: "../chevrotain/lib/chevrotain.mjs",
    },
  },
  batchSize: 100,
  rounds: 100,
  // warmup runs in parallel, so we can go overboard without increasing total runtime too much
  // while increasing the consistency of the results by giving V8 more time to optimize
  warmupIterations: 10000,
  // trim outliers aggressively for more consistent results.
  trimPercent: 0.2,
  resultsDir: "./results",
};

export interface CliArgs {
  grammar?: string;
  phase?: Phase;
  noCst: boolean;
}

/**
 * Parse CLI arguments from `process.argv`.
 *
 * Supported flags:
 *   --grammar=json       Run only this grammar
 *   --phase=parser       Run only this phase
 *   --no-cst             Disable CST creation (outputCst: false)
 */
export function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    noCst: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--grammar=")) {
      args.grammar = arg.slice("--grammar=".length);
    } else if (arg.startsWith("--phase=")) {
      args.phase = arg.slice("--phase=".length) as Phase;
    } else if (arg === "--no-cst") {
      args.noCst = true;
    }
  }

  return args;
}

/**
 * Build the effective config by merging defaults with CLI overrides.
 */
export function buildConfig(cliArgs: CliArgs): BenchmarkConfig {
  const config = { ...DEFAULT_CONFIG };

  if (cliArgs.grammar) {
    config.grammars = [cliArgs.grammar];
  }

  if (cliArgs.phase) {
    config.phases = [cliArgs.phase];
  }

  if (cliArgs.noCst) {
    config.outputCst = false;
  }

  return config;
}
