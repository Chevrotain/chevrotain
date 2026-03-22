import type { BenchmarkPhase, ComparisonRow, MeasuredRow } from "./types.js";

function formatMs(value: number, digits: number) {
  return `${value.toFixed(digits)} ms`;
}

function formatOps(value: number) {
  return `${Math.round(value).toLocaleString()} ops/sec`;
}

function formatCount(value: number) {
  return Math.round(value).toLocaleString();
}

function findWarmLexRow(
  rows: MeasuredRow[] | ComparisonRow[],
  fixture: string,
) {
  return rows.find(
    (row) => row.fixture === fixture && row.phase === "warm-lex",
  );
}

function getRowThroughput(row: MeasuredRow | ComparisonRow | undefined) {
  if (!row) {
    return undefined;
  }

  if ("throughput" in row) {
    return row.throughput;
  }

  if ("baselineThroughput" in row) {
    return row.baselineThroughput ?? row.thisPrThroughput;
  }

  return undefined;
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

export function printWarmLexThroughputSingle(
  rows: MeasuredRow[],
  currentLabel: string,
) {
  const warmLexRows = rows.filter(
    (row) => row.phase === "warm-lex" && row.throughput,
  );

  if (warmLexRows.length === 0) {
    return;
  }

  console.log("\nWarm-Lex Normalized Throughput");
  printTable(
    ["Fixture", `${currentLabel} tokens/sec`],
    warmLexRows.map((row) => [
      row.fixture,
      formatCount(row.throughput!.tokensPerSec),
    ]),
  );
}

export function printWarmLexThroughputComparison(
  rows: ComparisonRow[],
  baselineLabel: string,
  currentLabel: string,
) {
  const warmLexRows = rows.filter(
    (row) =>
      row.phase === "warm-lex" &&
      row.baselineThroughput &&
      row.thisPrThroughput,
  );

  if (warmLexRows.length === 0) {
    return;
  }

  console.log("\nWarm-Lex Normalized Throughput");
  printTable(
    [
      "Fixture",
      `${baselineLabel} tokens/sec`,
      `${currentLabel} tokens/sec`,
      "Delta",
    ],
    warmLexRows.map((row) => [
      row.fixture,
      formatCount(row.baselineThroughput!.tokensPerSec),
      formatCount(row.thisPrThroughput!.tokensPerSec),
      formatDelta(
        ((row.thisPrThroughput!.tokensPerSec -
          row.baselineThroughput!.tokensPerSec) /
          row.baselineThroughput!.tokensPerSec) *
          100,
      ),
    ]),
  );
}

export function printFixtureStats(rows: MeasuredRow[] | ComparisonRow[]) {
  const fixtures = [...new Set(rows.map((row) => row.fixture))];
  const statsRows = fixtures
    .map((fixture) => {
      const row = findWarmLexRow(rows, fixture);
      const throughput = getRowThroughput(row);

      if (!throughput) {
        return undefined;
      }

      return [
        fixture,
        formatCount(throughput.charsPerOp),
        formatCount(throughput.tokensPerOp),
      ];
    })
    .filter((row): row is string[] => Boolean(row));

  if (statsRows.length === 0) {
    return;
  }

  console.log("\nFixture Workload");
  printTable(["Fixture", "Chars/op", "Tokens/op"], statsRows);
}
