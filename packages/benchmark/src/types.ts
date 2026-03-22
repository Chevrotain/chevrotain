export const ALL_PHASES = [
  "construction",
  "cold",
  "first-parse",
  "warm-lex",
  "warm-parse",
  "warm",
] as const;

export type BenchmarkPhase = (typeof ALL_PHASES)[number];
export type BenchmarkRuntime = "node" | "bun";

export interface MeasureOptions {
  mode: BenchmarkPhase | "all";
  selectedParser: "json" | "css" | "all";
  useCst: boolean;
  iterations: number;
  warmup: number;
  samples: number;
}

export interface WorkerOptions extends MeasureOptions {
  libUrl: string;
}

export interface Fixture {
  name: string;
  charsPerOp: number;
  makeParser(): unknown;
  parseWith(parser: any, tokens: any[]): void;
  tokenize(): any[];
  parse(tokens: any[]): void;
  run(): void;
}

export interface ThroughputMetrics {
  charsPerOp: number;
  tokensPerOp: number;
  charsPerSec: number;
  tokensPerSec: number;
}

export interface MeasuredRow {
  fixture: string;
  phase: BenchmarkPhase;
  thisPr: number;
  throughput?: ThroughputMetrics;
}

export interface WorkerResult {
  mode: BenchmarkPhase | "all";
  parser: "CstParser" | "EmbeddedActionsParser";
  iterations: number;
  warmup: number;
  samples: number;
  rows: MeasuredRow[];
  fixtures: string[];
}

export interface CliOptions extends MeasureOptions {
  thisPrLibUrl: string;
  baselineLibUrl?: string;
  baselineLabel: string;
  currentLabel: string;
  runtime: BenchmarkRuntime;
  compareRuntime: boolean;
  jsonOutput: boolean;
  compareRuns: number;
  compareWarmupRounds: number;
}

export interface ComparisonRow {
  fixture: string;
  phase: BenchmarkPhase;
  baseline: number;
  thisPr: number;
  deltaPct: number;
  note: string;
  baselineThroughput?: ThroughputMetrics;
  thisPrThroughput?: ThroughputMetrics;
}
