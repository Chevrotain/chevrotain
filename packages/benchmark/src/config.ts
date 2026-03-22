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
  /** Minimum CPU time per benchmark variant in milliseconds. Passed to mitata as min_cpu_time. */
  minCpuTimeMs: number;
  /** Directory to write result JSON files. */
  resultsDir: string;
}

export const DEFAULT_CONFIG: BenchmarkConfig = {
  grammars: ["json"],
  phases: ["lexer", "parser"],
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
  // 642ms is the default of mitata
  // might need to increase the multiple for more stable results
  // particularly when measuring small performance improvements (e.g. 1-2%)
  minCpuTimeMs: 642 * 5,
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
