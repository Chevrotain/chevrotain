/**
 * Shared type definitions for the benchmark package.
 */

/** Benchmark phase — which part of the parsing pipeline to measure. */
export type Phase = "lexer" | "parser" | "full";

/** Arguments passed to each worker sub-process via CLI flags. */
export interface WorkerArgs {
  grammar: string;
  phase: Phase;
  versionLabel: string;
  chevrotainPath: string;
  resultsFile: string;
  outputCst: boolean;
}

/** Result written by each worker to its JSON output file. */
export interface BenchmarkResult {
  grammar: string;
  phase: Phase;
  version: string;
  outputCst: boolean;
  stats: {
    /** Average nanoseconds per iteration */
    avg: number;
    min: number;
    max: number;
    p50: number;
    p75: number;
    p99: number;
    samples: number;
  };
  error?: string;
}

/**
 * A grammar factory creates a lexer and parser from a given chevrotain module.
 * This allows benchmarking different chevrotain versions with the same grammar.
 */
export type GrammarFactory = (
  chevrotain: any,
  options: { outputCst: boolean },
) => {
  /**
   * Tokenize the input text. Returns the token array.
   * Used directly in "lexer" phase and as a pre-step in "parser" phase.
   */
  lex: (text: string) => any[];
  /**
   * Parse pre-lexed tokens. Used in "parser" phase.
   */
  parse: (tokens: any[]) => void;
  /**
   * Full pipeline: lex + parse. Used in "full" phase.
   */
  fullFlow: (text: string) => void;
  /** Display name for this grammar. */
  name: string;
};

/** Registry entry for a grammar. */
export interface GrammarDefinition {
  factory: GrammarFactory;
  sampleInput: string;
  name: string;
}
