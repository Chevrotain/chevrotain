import type { BenchmarkPhase, ComparisonRow, MeasuredRow } from "./types.js";

function formatMs(value: number, digits: number) {
  return `${value.toFixed(digits)} ms`;
}

function formatOps(value: number) {
  return `${Math.round(value).toLocaleString()} ops/sec`;
}

export function formatPhaseValue(phase: BenchmarkPhase, value: number) {
  if (phase === "construction" || phase === "cold") {
    return formatMs(value, 2);
  }

  if (phase === "first-parse") {
    return formatMs(value, 3);
  }

  return formatOps(value);
}

export function formatDelta(deltaPct: number) {
  if (!Number.isFinite(deltaPct)) {
    return "n/a";
  }

  const sign = deltaPct > 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(1)}%`;
}

export function printTable(headers: string[], rawRows: string[][]) {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rawRows.map((row) => row[index].length)),
  );

  const renderRow = (row: string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  console.log(renderRow(headers));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rawRows) {
    console.log(renderRow(row));
  }
}

export function toSingleBuildRows(rows: MeasuredRow[], currentLabel: string) {
  return {
    headers: ["Fixture", "Phase", currentLabel],
    rows: rows.map((row) => [
      row.fixture,
      row.phase,
      formatPhaseValue(row.phase, row.thisPr),
    ]),
  };
}

export function toComparisonRows(
  rows: ComparisonRow[],
  baselineLabel: string,
  currentLabel: string,
) {
  return {
    headers: ["Fixture", "Phase", baselineLabel, currentLabel, "Delta", "Note"],
    rows: rows.map((row) => [
      row.fixture,
      row.phase,
      formatPhaseValue(row.phase, row.baseline),
      formatPhaseValue(row.phase, row.thisPr),
      formatDelta(row.deltaPct),
      row.note,
    ]),
  };
}
