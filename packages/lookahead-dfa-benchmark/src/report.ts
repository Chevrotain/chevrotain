import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  BenchmarkRun,
  ScenarioResult,
  VariantResult,
} from "./benchmark_runner.ts";

function markdownTable(rows: Record<string, unknown>[]): string {
  const headings = Object.keys(rows[0]);
  const escape = (value: unknown) => String(value).replaceAll("|", "\\|");
  return [
    `| ${headings.join(" | ")} |`,
    `| ${headings.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${Object.values(row).map(escape).join(" | ")} |`),
  ].join("\n");
}

interface Comparison {
  shape: string;
  workload: string;
  pathScan: VariantResult;
  denseDfa: VariantResult;
  selected: string;
  winner: string;
  winnerMarginPercent: number;
}

function comparisonFor(result: ScenarioResult): Comparison {
  const pathScan = result.variants.find(
    (variant) => variant.name === "Path Scan",
  )!;
  const denseDfa = result.variants.find(
    (variant) => variant.name === "Dense DFA",
  )!;
  const winner =
    denseDfa.callsPerSecond > pathScan.callsPerSecond ? denseDfa : pathScan;
  const slower = winner === denseDfa ? pathScan : denseDfa;
  return {
    shape: result.shape,
    workload: result.workload,
    pathScan,
    denseDfa,
    selected: denseDfa.productionSelected ? denseDfa.name : pathScan.name,
    winner: winner.name,
    winnerMarginPercent:
      (1 - slower.callsPerSecond / winner.callsPerSecond) * 100,
  };
}

function runtimeRows(comparisons: Comparison[]): Record<string, unknown>[] {
  return comparisons.map((comparison) => ({
    Shape: comparison.shape,
    Workload: comparison.workload,
    Selected: comparison.selected,
    "Path Scan M/s": (comparison.pathScan.callsPerSecond / 1e6).toFixed(2),
    "Dense DFA M/s": (comparison.denseDfa.callsPerSecond / 1e6).toFixed(2),
    Difference: `${comparison.winner} +${comparison.winnerMarginPercent.toFixed(1)}%`,
  }));
}

function runtimeSection(comparisons: Comparison[]): string {
  return comparisons.length === 0
    ? "None."
    : markdownTable(runtimeRows(comparisons));
}

export function writeReport(
  run: BenchmarkRun,
  maxSelectionRegressionPercent: number,
  summary: string,
): string {
  const comparisons = run.scenarioResults.map(comparisonFor);
  const clearResults = comparisons.filter(
    (comparison) =>
      comparison.winnerMarginPercent > maxSelectionRegressionPercent,
  );
  const denseWins = clearResults.filter(
    (comparison) => comparison.winner === "Dense DFA",
  );
  const pathScanWins = clearResults.filter(
    (comparison) => comparison.winner === "Path Scan",
  );
  const nearTies = comparisons.filter(
    (comparison) =>
      comparison.winnerMarginPercent <= maxSelectionRegressionPercent,
  );
  const selectionMistakeReport =
    run.selectionErrors.length === 0
      ? `No production selection mistakes exceeded ${maxSelectionRegressionPercent}%.`
      : markdownTable(
          run.selectionErrors.map((error) => ({
            Shape: error.shape,
            Workload: error.workload,
            Selected: error.productionSelected,
            Faster: error.fasterVariant,
            "Selected M calls/s": (error.selectedCallsPerSecond / 1e6).toFixed(
              2,
            ),
            "Faster M calls/s": (error.fasterCallsPerSecond / 1e6).toFixed(2),
            "Behind by": `${error.regressionPercent.toFixed(1)}%`,
          })),
        );
  const diagnostics = comparisons.map((comparison) => ({
    Shape: comparison.shape,
    Workload: comparison.workload,
    "Path Scan build us": comparison.pathScan.buildMicros.toFixed(2),
    "Dense DFA build us": comparison.denseDfa.buildMicros.toFixed(2),
    "Dense layout": comparison.denseDfa.layout,
    Cells: comparison.denseDfa.cells ?? "-",
    "S/T/C": `${comparison.denseDfa.states ?? "-"}/${comparison.denseDfa.transitions ?? "-"}/${comparison.denseDfa.maxCandidates ?? "-"}`,
  }));
  const reportDirectory = new URL("../report/", import.meta.url);
  const reportUrl = new URL("lookahead_dfa_benchmark.md", reportDirectory);
  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(
    reportUrl,
    `# DFA Lookahead Microbenchmark

- Generated: ${new Date().toISOString()}
- Node: ${process.version}
- V8: ${process.versions.v8}
- Platform: ${process.platform} ${process.arch}
- Selection regression threshold: ${maxSelectionRegressionPercent}%

## Legend

- **Path Scan**: Chevrotain's ordered lookahead-path scanner.
- **Dense DFA**: compiled dense Int32Array transition table.
- **M/s**: million lookahead calls per second; higher is better.
- **Selected**: variant chosen by the production selector.
- **S/T/C**: DFA states / transitions / maximum active candidates.

| Shape term | Meaning |
| --- | --- |
| OR | Selects an alternative index. |
| Single | Boolean lookahead for OPTION or repetition. |
| K&lt;n&gt; | Paths inspect up to n tokens. |
| x&lt;n&gt; | Number of lookahead paths. |
| shared / non-shared | Paths do / do not overlap on the first token. |
| mixed | Combines path depths from K1 through K3. |
| category overlap | Token categories overlap between paths. |
| final empty | The final alternative has an empty path. |
| contiguous / sparse IDs | Token type IDs are tightly packed / far apart. |
| in-range | A mismatch uses a completed shorter-path fallback. |

| Workload | Meaning |
| --- | --- |
| representative | Standard mixture of representative hits, misses, and EOF probes. |
| balanced | Representative hits and misses have equal weight. |
| early80 | A full match of the first path is 80% of calls. |
| hit-only / miss-only | Contains only successful / unsuccessful probes. |
| fallback80 | A completed shorter path handles 80% of calls. |

## Production Selection

- Clear wins: ${clearResults.length - run.selectionErrors.length}
- Mistakes over ${maxSelectionRegressionPercent}%: ${run.selectionErrors.length}
- Within ${maxSelectionRegressionPercent}%: ${nearTies.length}

### Mistakes

${selectionMistakeReport}

## Runtime Results

### Dense DFA Faster (>${maxSelectionRegressionPercent}%)

${runtimeSection(denseWins)}

### Path Scan Faster (>${maxSelectionRegressionPercent}%)

${runtimeSection(pathScanWins)}

### Within ${maxSelectionRegressionPercent}%

${runtimeSection(nearTies)}

<details>
<summary>Construction diagnostics</summary>

${markdownTable(diagnostics)}

</details>

${summary}
`,
  );
  return fileURLToPath(reportUrl);
}
