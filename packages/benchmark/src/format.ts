/**
 * Format benchmark results into a comparison table.
 */
import type { BenchmarkResult } from "./types.ts";

/**
 * Format nanoseconds per operation into a human-readable ops/sec string.
 */
function formatOpsPerSec(avgNs: number): string {
  if (avgNs <= 0) return "N/A";
  const opsPerSec = 1e9 / avgNs;
  return opsPerSec.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

/**
 * Compute the percentage change from baseline to current.
 * Positive means faster (improvement), negative means slower (regression).
 */
function percentChange(baselineNs: number, currentNs: number): number {
  if (baselineNs <= 0) return 0;
  // Lower ns = faster, so we invert: (baseline - current) / baseline
  return ((baselineNs - currentNs) / baselineNs) * 100;
}

/**
 * Format a percentage change with sign and color hint.
 */
function formatChange(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Pad a string to a given width (right-aligned for numbers).
 */
function padRight(str: string, width: number): string {
  return str.padEnd(width);
}

function padLeft(str: string, width: number): string {
  return str.padStart(width);
}

/**
 * Format all benchmark results into a printable comparison table.
 *
 * Groups results by (grammar, phase) and shows latest vs next side-by-side.
 */
export function formatResults(results: BenchmarkResult[]): string {
  const outputCst = results.length > 0 ? results[0].outputCst : true;

  // Group by grammar + phase, collect latest/next
  type Row = {
    grammar: string;
    phase: string;
    latest?: BenchmarkResult;
    next?: BenchmarkResult;
  };

  const rowMap = new Map<string, Row>();
  for (const r of results) {
    const key = `${r.grammar}|${r.phase}`;
    if (!rowMap.has(key)) {
      rowMap.set(key, { grammar: r.grammar, phase: r.phase });
    }
    const row = rowMap.get(key)!;
    if (r.version === "latest") {
      row.latest = r;
    } else if (r.version === "next") {
      row.next = r;
    }
  }

  const rows = Array.from(rowMap.values());

  // Sort: by grammar name, then by phase order (lexer, parser, full)
  const phaseOrder: Record<string, number> = { lexer: 0, parser: 1, full: 2 };
  rows.sort((a, b) => {
    const grammarCmp = a.grammar.localeCompare(b.grammar);
    if (grammarCmp !== 0) return grammarCmp;
    return (phaseOrder[a.phase] ?? 99) - (phaseOrder[b.phase] ?? 99);
  });

  // Column widths
  const COL_GRAMMAR = 9;
  const COL_PHASE = 9;
  const COL_OPS = 15;
  const COL_CHANGE = 10;

  const lines: string[] = [];

  // Header
  lines.push("");
  lines.push(`Chevrotain Performance Benchmark (outputCst: ${outputCst})`);
  lines.push("=".repeat(60));
  lines.push(
    `Runtime: Node ${process.version} | V8: ${process.versions.v8} | Date: ${new Date().toISOString().slice(0, 10)}`,
  );
  lines.push("");

  // Table header
  const sep = `+${"-".repeat(COL_GRAMMAR + 2)}+${"-".repeat(COL_PHASE + 2)}+${"-".repeat(COL_OPS + 2)}+${"-".repeat(COL_OPS + 2)}+${"-".repeat(COL_CHANGE + 2)}+`;

  lines.push(sep);
  lines.push(
    `| ${padRight("Grammar", COL_GRAMMAR)} | ${padRight("Phase", COL_PHASE)} | ${padLeft("latest (op/s)", COL_OPS)} | ${padLeft("next (op/s)", COL_OPS)} | ${padLeft("Change", COL_CHANGE)} |`,
  );
  lines.push(sep);

  // Table rows
  for (const row of rows) {
    const latestOps = row.latest?.error
      ? "ERROR"
      : row.latest
        ? formatOpsPerSec(row.latest.stats.avg)
        : "-";

    const nextOps = row.next?.error
      ? "ERROR"
      : row.next
        ? formatOpsPerSec(row.next.stats.avg)
        : "-";

    let change = "-";
    if (
      row.latest &&
      row.next &&
      !row.latest.error &&
      !row.next.error &&
      row.latest.stats.avg > 0 &&
      row.next.stats.avg > 0
    ) {
      const pct = percentChange(row.latest.stats.avg, row.next.stats.avg);
      change = formatChange(pct);
    }

    const grammarDisplay = row.grammar.toUpperCase();

    lines.push(
      `| ${padRight(grammarDisplay, COL_GRAMMAR)} | ${padRight(row.phase, COL_PHASE)} | ${padLeft(latestOps, COL_OPS)} | ${padLeft(nextOps, COL_OPS)} | ${padLeft(change, COL_CHANGE)} |`,
    );
  }

  lines.push(sep);

  // Errors summary
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    lines.push("");
    lines.push("Errors:");
    for (const e of errors) {
      lines.push(`  - ${e.grammar} | ${e.phase} | ${e.version}: ${e.error}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
